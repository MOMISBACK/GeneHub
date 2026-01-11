import { supabase, supabaseAnonKey, supabaseWithAuth } from './supabase';
import { formatInvokeError } from './utils';

// ============ Types ============
export type GoTerm = {
  id: string;
  term: string;
  category: string;
};

export type Interactor = {
  gene: string;
  score: number;
};

export type PdbStructure = {
  id: string;
  method?: string;
  resolution?: number;
  title?: string;
};

export type GeneLinks = {
  ncbi?: string;
  uniprot?: string;
  alphafold?: string;
  string?: string;
  pdb?: string;
};

export type GeneSummary = {
  symbol: string;
  organism: string;
  // Basic info
  name?: string;
  synonyms?: string[];
  description?: string;
  // Genomic
  ncbiGeneId?: string;
  chromosome?: string;
  start?: number;
  stop?: number;
  strand?: string;
  // UniProt
  uniprotId?: string;
  proteinName?: string;
  function?: string;
  subcellularLocation?: string[];
  goTerms?: GoTerm[];
  keywords?: string[];
  sequence?: string;
  sequenceLength?: number;
  mass?: number; // kDa
  // Structure
  alphafoldUrl?: string;
  pdbStructures?: PdbStructure[];
  pdbIds?: string[];
  hasStructure?: boolean;
  // Interactions
  interactors?: Interactor[];
  // Pathways
  pathways?: string[];
  // Links
  links: GeneLinks;
  // Meta
  sources: string[];
  fetchedAt: string;
};

/**
 * Invoke a Supabase Edge Function WITHOUT requiring user authentication.
 * Uses only the anon key (public API key).
 * Use this for functions deployed with --no-verify-jwt
 */
async function invokePublic<T>(fnName: string, body: Record<string, unknown>): Promise<T> {
  // Use the base supabase client (no auth storage needed)
  const { data, error } = await supabase.functions.invoke(fnName, { body });

  if (error) {
    throw formatInvokeError(fnName, error);
  }

  return data as T;
}

async function getAccessToken(): Promise<string> {
  const { data, error } = await supabaseWithAuth.auth.getSession();
  if (error) {
    throw new Error('Non authentifié. Reconnecte-toi puis réessaie.');
  }
  const token = data.session?.access_token;
  if (!token) {
    throw new Error('Non authentifié. Reconnecte-toi puis réessaie.');
  }
  return token;
}

async function invokeWithAuth<T>(fnName: string, body: Record<string, unknown>): Promise<T> {
  // Note: supabase-js already sends the project anon key header internally.
  // We only provide the JWT.
  let token = await getAccessToken();

  const attempt = async (accessToken: string) =>
    supabaseWithAuth.functions.invoke(fnName, {
      body,
      headers: { Authorization: `Bearer ${accessToken}` },
    });

  let { data, error } = await attempt(token);

  // If the JWT expired, refresh once and retry.
  if (error && (error as any)?.context?.status === 401) {
    const { data: refreshed } = await supabaseWithAuth.auth.refreshSession();
    const refreshedToken = refreshed.session?.access_token;
    if (refreshedToken) {
      token = refreshedToken;
      ({ data, error } = await attempt(token));
    }
  }

  if (error) {
    throw formatInvokeError(fnName, error);
  }

  return data as T;
}

export async function getGeneSummary(symbol: string, organism: string): Promise<GeneSummary> {
  // Use public invoke - function is deployed with --no-verify-jwt
  return invokePublic<GeneSummary>('gene-summary', { symbol, organism });
}

// ============ BioCyc Types ============
export type BiocycTranscriptionUnit = {
  id: string;
  name?: string;
  promoter?: string;
  terminators: string[];
  genes: string[];
};

export type BiocycRegulator = {
  gene: string;
  name?: string;
  type: 'activator' | 'repressor' | 'unknown';
};

export type BiocycPathway = {
  id: string;
  name: string;
  type?: string;
};

export type BiocycReaction = {
  id: string;
  name: string;
  ecNumber?: string;
};

export type BiocycGeneData = {
  biocycId: string;
  name: string;
  commonName?: string;
  synonyms: string[];
  product?: string;
  transcriptionUnits: BiocycTranscriptionUnit[];
  regulatedBy: BiocycRegulator[];
  regulates: string[];
  pathways: BiocycPathway[];
  reactions: BiocycReaction[];
  goTerms?: string[];
  links: {
    biocyc?: string;
  };
};

export type BiocycResponse = {
  success: boolean;
  data?: BiocycGeneData;
  error?: string;
  fromCache?: boolean;
  isStale?: boolean;
  supported: boolean;
};

/**
 * Get BioCyc data for a gene (pathways, regulation, operons)
 */
export async function getBiocycData(gene: string, organism: string): Promise<BiocycResponse> {
  // Use public invoke - function is deployed with --no-verify-jwt
  return invokePublic<BiocycResponse>('gene-biocyc', { gene, organism });
}
