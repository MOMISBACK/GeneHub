/**
 * BioCyc Service Module
 * 
 * Handles authentication and data fetching from BioCyc/EcoCyc.
 * BioCyc provides rich bacterial gene data including:
 * - Pathways
 * - Transcription units (operons)
 * - Gene regulation
 * - Reactions/enzymes
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withRateLimit } from './rate-limiter.ts';
import { fetchWithMetrics } from './metrics.ts';

// Organism ID mapping for BioCyc
export const BIOCYC_ORGANISM_MAP: Record<string, string> = {
  // E. coli variants
  'escherichia coli': 'ECOLI',
  'escherichia coli k-12': 'ECOLI',
  'e. coli': 'ECOLI',
  'e.coli': 'ECOLI',
  'ecoli': 'ECOLI',
  // B. subtilis
  'bacillus subtilis': 'BSUB',
  'b. subtilis': 'BSUB',
  'b.subtilis': 'BSUB',
  // P. aeruginosa
  'pseudomonas aeruginosa': 'PAER',
  'p. aeruginosa': 'PAER',
  // S. aureus
  'staphylococcus aureus': 'SAUR',
  's. aureus': 'SAUR',
  // Salmonella
  'salmonella enterica': 'STM',
  'salmonella typhimurium': 'STM',
  's. enterica': 'STM',
  // M. tuberculosis
  'mycobacterium tuberculosis': 'MTBRV',
  'm. tuberculosis': 'MTBRV',
  // V. cholerae
  'vibrio cholerae': 'VCHO',
  'v. cholerae': 'VCHO',
  // K. pneumoniae
  'klebsiella pneumoniae': 'KPNE',
  'k. pneumoniae': 'KPNE',
  // C. difficile
  'clostridioides difficile': 'CDIF',
  'clostridium difficile': 'CDIF',
  'c. difficile': 'CDIF',
};

// Types for BioCyc data
export interface BiocycGeneData {
  biocycId: string;
  name: string;
  commonName?: string;
  synonyms: string[];
  product?: string;
  transcriptionUnits: TranscriptionUnit[];
  regulatedBy: Regulator[];
  regulates: string[];
  pathways: Pathway[];
  reactions: Reaction[];
  goTerms?: string[];
}

export interface TranscriptionUnit {
  id: string;
  name?: string;
  promoter?: string;
  terminators: string[];
  genes: string[];
}

export interface Regulator {
  gene: string;
  name?: string;
  type: 'activator' | 'repressor' | 'unknown';
}

export interface Pathway {
  id: string;
  name: string;
  type?: string;
}

export interface Reaction {
  id: string;
  name: string;
  ecNumber?: string;
}

// Session management
interface BiocycSession {
  cookies: string;
  expiresAt: number;
}

let sessionCache: BiocycSession | null = null;

/**
 * Get or create BioCyc session
 */
async function getBiocycSession(supabase: SupabaseClient): Promise<string> {
  // Check memory cache first
  if (sessionCache && sessionCache.expiresAt > Date.now() + 300000) {
    return sessionCache.cookies;
  }

  // Try to check database cache (gracefully handle if table doesn't exist)
  try {
    const { data: dbSession, error } = await supabase
      .from('biocyc_session')
      .select('cookies, expires_at')
      .eq('id', 1)
      .single();

    // If table doesn't exist, skip DB cache
    if (!error || (error.code !== '42P01' && !error.message?.includes('does not exist'))) {
      if (dbSession && new Date(dbSession.expires_at).getTime() > Date.now() + 300000) {
        sessionCache = {
          cookies: dbSession.cookies,
          expiresAt: new Date(dbSession.expires_at).getTime(),
        };
        return sessionCache.cookies;
      }
    }
  } catch (dbError) {
    console.warn('[BioCyc] DB session cache unavailable:', dbError);
  }

  // Need to login
  const email = Deno.env.get('BIOCYC_EMAIL');
  const password = Deno.env.get('BIOCYC_PASSWORD');

  if (!email || !password) {
    throw new Error('BioCyc credentials not configured. Set BIOCYC_EMAIL and BIOCYC_PASSWORD.');
  }

  console.log('[BioCyc] Authenticating...');

  const response = await fetch('https://websvc.biocyc.org/credentials/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`BioCyc authentication failed: ${response.status}`);
  }

  // Extract cookies from Set-Cookie headers
  const setCookieHeaders = response.headers.getSetCookie?.() || [];
  const cookies = setCookieHeaders
    .map((c) => c.split(';')[0])
    .join('; ');

  if (!cookies) {
    throw new Error('BioCyc login succeeded but no cookies returned');
  }

  // Cache session (1 hour expiry)
  const expiresAt = Date.now() + 3600000;
  sessionCache = { cookies, expiresAt };

  // Try to save to database (ignore if table doesn't exist)
  try {
    await supabase.from('biocyc_session').upsert({
      id: 1,
      cookies,
      expires_at: new Date(expiresAt).toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (dbError) {
    console.warn('[BioCyc] Could not save session to DB:', dbError);
  }

  console.log('[BioCyc] Authentication successful');
  return cookies;
}

/**
 * Make authenticated request to BioCyc
 * Falls back to unauthenticated request if auth fails
 */
export async function biocycRequest<T>(
  endpoint: string,
  params: Record<string, string>,
  supabase: SupabaseClient,
  options?: { format?: 'json' | 'xml' | 'text' }
): Promise<T> {
  // Build URL
  const url = new URL(`https://websvc.biocyc.org${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  
  console.log(`[BioCyc] Fetching: ${url.toString()}`);

  // Simple fetch without rate limiting for now
  // Important: use Accept-Encoding: identity to avoid gzip issues
  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json, application/xml, text/plain',
      'Accept-Encoding': 'identity', // Request uncompressed response
    },
  });

  if (!response.ok) {
    console.error(`[BioCyc] Request failed: ${response.status} ${response.statusText}`);
    throw new Error(`BioCyc request failed: ${response.status}`);
  }

  const format = options?.format || 'json';
  const contentType = response.headers.get('content-type') || '';

  if (format === 'json' || contentType.includes('json')) {
    const json = await response.json();
    console.log(`[BioCyc] Response:`, JSON.stringify(json).substring(0, 500));
    return json;
  } else if (format === 'xml' || contentType.includes('xml')) {
    const text = await response.text();
    console.log(`[BioCyc] XML Response (first 500 chars):`, text.substring(0, 500));
    return text as unknown as T;
  }
  return response.text() as unknown as T;
}

/**
 * Search for a gene by name in BioCyc
 */
export async function searchBiocycGene(
  geneName: string,
  organism: string,
  supabase: SupabaseClient
): Promise<{ objectId: string; commonName: string } | null> {
  const orgId = getBiocycOrgId(organism);
  if (!orgId) {
    console.log(`[BioCyc] Organism not supported: ${organism}`);
    return null;
  }

  try {
    console.log(`[BioCyc] Searching for gene: ${geneName} in ${orgId}`);
    const result = await biocycRequest<{ RESULTS?: Array<{ 'OBJECT-ID': string; 'COMMON-NAME': string }> }>(
      `/${orgId}/name-search`,
      { object: geneName, class: 'Genes', fmt: 'json' },
      supabase
    );

    console.log(`[BioCyc] Search result:`, JSON.stringify(result));
    
    if (result.RESULTS && result.RESULTS.length > 0) {
      return {
        objectId: result.RESULTS[0]['OBJECT-ID'],
        commonName: result.RESULTS[0]['COMMON-NAME'],
      };
    }
    return null;
  } catch (error) {
    console.error('[BioCyc] Gene search failed:', error);
    return null;
  }
}

/**
 * Get pathways for a gene
 */
export async function getGenePathways(
  biocycId: string,
  organism: string,
  supabase: SupabaseClient
): Promise<Pathway[]> {
  const orgId = getBiocycOrgId(organism);
  if (!orgId) return [];

  try {
    console.log(`[BioCyc] getGenePathways: ${orgId}:${biocycId}`);
    const xml = await biocycRequest<string>(
      '/apixml',
      {
        fn: 'pathways-of-gene',
        id: `${orgId}:${biocycId}`,
        detail: 'low',
      },
      supabase,
      { format: 'xml' }
    );
    
    console.log(`[BioCyc] Pathways XML received, length: ${xml?.length || 0}`);
    const pathways = parsePathwaysFromXml(xml);
    console.log(`[BioCyc] Parsed ${pathways.length} pathways`);
    return pathways;
  } catch (error) {
    console.error('[BioCyc] Pathways fetch failed:', error);
    return [];
  }
}

/**
 * Get genes that regulate this gene
 */
export async function getGeneRegulators(
  biocycId: string,
  organism: string,
  supabase: SupabaseClient
): Promise<Regulator[]> {
  const orgId = getBiocycOrgId(organism);
  if (!orgId) return [];

  try {
    console.log(`[BioCyc] getGeneRegulators: ${orgId}:${biocycId}`);
    const xml = await biocycRequest<string>(
      '/apixml',
      {
        fn: 'genes-regulating-gene',
        id: `${orgId}:${biocycId}`,
        detail: 'low',
      },
      supabase,
      { format: 'xml' }
    );
    
    console.log(`[BioCyc] Regulators XML received, length: ${xml?.length || 0}`);
    const regulators = parseRegulatorsFromXml(xml);
    console.log(`[BioCyc] Parsed ${regulators.length} regulators`);
    return regulators;
  } catch (error) {
    console.error('[BioCyc] Regulators fetch failed:', error);
    return [];
  }
}

/**
 * Get genes regulated by this gene
 */
export async function getRegulatedGenes(
  biocycId: string,
  organism: string,
  supabase: SupabaseClient
): Promise<string[]> {
  const orgId = getBiocycOrgId(organism);
  if (!orgId) return [];

  try {
    const xml = await biocycRequest<string>(
      '/apixml',
      {
        fn: 'genes-regulated-by-gene',
        id: `${orgId}:${biocycId}`,
        detail: 'none',
      },
      supabase,
      { format: 'xml' }
    );

    return parseGeneIdsFromXml(xml);
  } catch (error) {
    console.error('[BioCyc] Regulated genes fetch failed:', error);
    return [];
  }
}

/**
 * Get transcription units containing this gene
 */
export async function getTranscriptionUnits(
  biocycId: string,
  organism: string,
  supabase: SupabaseClient
): Promise<TranscriptionUnit[]> {
  const orgId = getBiocycOrgId(organism);
  if (!orgId) return [];

  try {
    const xml = await biocycRequest<string>(
      '/apixml',
      {
        fn: 'transcription-units-of-gene',
        id: `${orgId}:${biocycId}`,
        detail: 'low',
      },
      supabase,
      { format: 'xml' }
    );

    return parseTranscriptionUnitsFromXml(xml);
  } catch (error) {
    console.error('[BioCyc] TUs fetch failed:', error);
    return [];
  }
}

/**
 * Get complete BioCyc data for a gene
 */
export async function getBiocycGeneData(
  geneName: string,
  organism: string,
  supabase: SupabaseClient
): Promise<BiocycGeneData | null> {
  // Search for gene
  const searchResult = await searchBiocycGene(geneName, organism, supabase);
  if (!searchResult) {
    console.log(`[BioCyc] Gene not found: ${geneName} in ${organism}`);
    return null;
  }

  const { objectId, commonName } = searchResult;
  console.log(`[BioCyc] Found gene: ${objectId} (${commonName})`);

  // Fetch additional data (with error handling for each)
  let pathways: Pathway[] = [];
  let regulatedBy: Regulator[] = [];
  let regulates: string[] = [];
  let transcriptionUnits: TranscriptionUnit[] = [];

  try {
    console.log(`[BioCyc] Fetching pathways for ${objectId}...`);
    pathways = await getGenePathways(objectId, organism, supabase);
    console.log(`[BioCyc] Got ${pathways.length} pathways`);
  } catch (e) {
    console.error('[BioCyc] Pathways error:', e);
  }

  try {
    console.log(`[BioCyc] Fetching regulators for ${objectId}...`);
    regulatedBy = await getGeneRegulators(objectId, organism, supabase);
    console.log(`[BioCyc] Got ${regulatedBy.length} regulators`);
  } catch (e) {
    console.error('[BioCyc] Regulators error:', e);
  }

  try {
    console.log(`[BioCyc] Fetching regulated genes for ${objectId}...`);
    regulates = await getRegulatedGenes(objectId, organism, supabase);
    console.log(`[BioCyc] Got ${regulates.length} regulated genes`);
  } catch (e) {
    console.error('[BioCyc] Regulated genes error:', e);
  }

  try {
    console.log(`[BioCyc] Fetching transcription units for ${objectId}...`);
    transcriptionUnits = await getTranscriptionUnits(objectId, organism, supabase);
    console.log(`[BioCyc] Got ${transcriptionUnits.length} TUs`);
  } catch (e) {
    console.error('[BioCyc] TUs error:', e);
  }

  return {
    biocycId: objectId,
    name: geneName,
    commonName,
    synonyms: [],
    transcriptionUnits,
    regulatedBy,
    regulates,
    pathways,
    reactions: [],
  };
}

// Helper functions
function getBiocycOrgId(organism: string): string | null {
  const normalized = organism.toLowerCase().trim();
  return BIOCYC_ORGANISM_MAP[normalized] || null;
}

// Simple XML parsing helpers (ptools-xml format)
// Note: BioCyc XML uses single quotes for attributes

function parsePathwaysFromXml(xml: string): Pathway[] {
  const pathways: Pathway[] = [];
  
  // Match Pathway blocks (handle both single and double quotes)
  const pathwayBlockRegex = /<Pathway[^>]*frameid=['"]([^'"]+)['"][^>]*>[\s\S]*?<\/Pathway>/gi;
  let blockMatch;
  while ((blockMatch = pathwayBlockRegex.exec(xml)) !== null) {
    const pathwayId = blockMatch[1];
    const block = blockMatch[0];
    
    // Extract common-name from block
    const nameMatch = /<common-name[^>]*>([^<]+)<\/common-name>/i.exec(block);
    pathways.push({
      id: pathwayId,
      name: nameMatch ? nameMatch[1] : pathwayId.replace(/-/g, ' '),
    });
  }
  
  // Fallback: try simpler pattern if no blocks found
  if (pathways.length === 0) {
    const simpleRegex = /<Pathway[^>]*frameid=['"]([^'"]+)['"]/gi;
    let match;
    while ((match = simpleRegex.exec(xml)) !== null) {
      pathways.push({
        id: match[1],
        name: match[1].replace(/-/g, ' '),
      });
    }
  }
  
  console.log(`[BioCyc] parsePathwaysFromXml: found ${pathways.length} pathways`);
  return pathways;
}

function parseRegulatorsFromXml(xml: string): Regulator[] {
  const regulators: Regulator[] = [];
  
  // Match Gene blocks (handle both single and double quotes)
  const geneBlockRegex = /<Gene[^>]*frameid=['"]([^'"]+)['"][^>]*>[\s\S]*?<\/Gene>/gi;
  let blockMatch;
  while ((blockMatch = geneBlockRegex.exec(xml)) !== null) {
    const geneId = blockMatch[1];
    const block = blockMatch[0];
    
    // Extract common-name from block
    const nameMatch = /<common-name[^>]*>([^<]+)<\/common-name>/i.exec(block);
    if (nameMatch) {
      regulators.push({
        gene: geneId,
        name: nameMatch[1],
        type: 'unknown',
      });
    }
  }
  
  console.log(`[BioCyc] parseRegulatorsFromXml: found ${regulators.length} regulators`);
  return regulators;
}

function parseGeneIdsFromXml(xml: string): string[] {
  const geneIds: string[] = [];
  const geneRegex = /<Gene[^>]*frameid=['"]([^'"]+)['"]/gi;
  let match;
  while ((match = geneRegex.exec(xml)) !== null) {
    geneIds.push(match[1]);
  }
  console.log(`[BioCyc] parseGeneIdsFromXml: found ${geneIds.length} gene IDs`);
  return geneIds;
}

function parseTranscriptionUnitsFromXml(xml: string): TranscriptionUnit[] {
  const tus: TranscriptionUnit[] = [];
  const tuRegex = /<Transcription-Unit[^>]*frameid=['"]([^'"]+)['"]/gi;
  let match;
  while ((match = tuRegex.exec(xml)) !== null) {
    tus.push({
      id: match[1],
      terminators: [],
      genes: [],
    });
  }
  return tus;
}

/**
 * Check if BioCyc is available for an organism
 */
export function isBiocycSupported(organism: string): boolean {
  return getBiocycOrgId(organism) !== null;
}

/**
 * Get BioCyc URL for a gene
 */
export function getBiocycUrl(biocycId: string, organism: string): string {
  const orgId = getBiocycOrgId(organism) || 'ECOLI';
  return `https://biocyc.org/${orgId}/gene?orgid=${orgId}&id=${biocycId}`;
}
