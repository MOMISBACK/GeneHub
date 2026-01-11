/**
 * Global Search Service
 * Unified search across genes (external APIs) and knowledge base (Supabase)
 */

import { searchAll as searchKB, type SearchResult as KBSearchResult } from './knowledge';
import { geneDataLayer } from './dataLayer';
import type { GeneSummary } from './api';

// ============ Types ============

export type SearchResultType = 'gene' | 'researcher' | 'article' | 'conference';

export interface GeneSearchResult {
  type: 'gene';
  data: {
    symbol: string;
    organism: string;
    name?: string;
    description?: string;
  };
}

export type GlobalSearchResult = GeneSearchResult | KBSearchResult;

export interface SearchOptions {
  /** Which types to search */
  types?: SearchResultType[];
  /** Organism for gene search */
  organism?: string;
  /** Max results per type */
  limit?: number;
}

// ============ Gene Search ============

// Common E. coli genes for quick local matching
const COMMON_GENES = [
  { symbol: 'dnaA', name: 'Chromosomal replication initiator protein DnaA' },
  { symbol: 'ftsZ', name: 'Cell division protein FtsZ' },
  { symbol: 'recA', name: 'Recombinase A' },
  { symbol: 'lexA', name: 'LexA repressor' },
  { symbol: 'gyrA', name: 'DNA gyrase subunit A' },
  { symbol: 'gyrB', name: 'DNA gyrase subunit B' },
  { symbol: 'rpoA', name: 'RNA polymerase subunit alpha' },
  { symbol: 'rpoB', name: 'RNA polymerase subunit beta' },
  { symbol: 'rpoC', name: 'RNA polymerase subunit beta prime' },
  { symbol: 'rpoD', name: 'RNA polymerase sigma factor' },
  { symbol: 'dnaB', name: 'Replicative DNA helicase' },
  { symbol: 'dnaC', name: 'DnaA-homolog protein' },
  { symbol: 'dnaE', name: 'DNA polymerase III alpha subunit' },
  { symbol: 'polA', name: 'DNA polymerase I' },
  { symbol: 'lig', name: 'DNA ligase' },
  { symbol: 'ssb', name: 'Single-stranded DNA-binding protein' },
  { symbol: 'uvrA', name: 'UvrABC nucleotide excision repair protein A' },
  { symbol: 'uvrB', name: 'UvrABC nucleotide excision repair protein B' },
  { symbol: 'uvrC', name: 'UvrABC nucleotide excision repair protein C' },
  { symbol: 'mutS', name: 'DNA mismatch repair protein MutS' },
  { symbol: 'mutL', name: 'DNA mismatch repair protein MutL' },
  { symbol: 'mutH', name: 'DNA mismatch repair protein MutH' },
  { symbol: 'lacZ', name: 'Beta-galactosidase' },
  { symbol: 'lacY', name: 'Lactose permease' },
  { symbol: 'lacI', name: 'Lac repressor' },
  { symbol: 'trpA', name: 'Tryptophan synthase alpha chain' },
  { symbol: 'trpB', name: 'Tryptophan synthase beta chain' },
  { symbol: 'trpC', name: 'Indole-3-glycerol phosphate synthase' },
  { symbol: 'trpD', name: 'Anthranilate phosphoribosyltransferase' },
  { symbol: 'trpE', name: 'Anthranilate synthase component I' },
  { symbol: 'hisA', name: 'Phosphoribosylformimino-5-aminoimidazole carboxamide ribotide isomerase' },
  { symbol: 'hisB', name: 'Histidine biosynthesis bifunctional protein HisB' },
  { symbol: 'groEL', name: 'Chaperonin GroEL' },
  { symbol: 'groES', name: 'Co-chaperonin GroES' },
  { symbol: 'dnaK', name: 'Chaperone protein DnaK' },
  { symbol: 'dnaJ', name: 'Chaperone protein DnaJ' },
  { symbol: 'clpA', name: 'ATP-dependent Clp protease ATP-binding subunit ClpA' },
  { symbol: 'clpP', name: 'ATP-dependent Clp protease proteolytic subunit' },
  { symbol: 'clpX', name: 'ATP-dependent Clp protease ATP-binding subunit ClpX' },
  { symbol: 'lon', name: 'Lon protease' },
  { symbol: 'ftsA', name: 'Cell division protein FtsA' },
  { symbol: 'ftsI', name: 'Peptidoglycan D,D-transpeptidase FtsI' },
  { symbol: 'ftsK', name: 'DNA translocase FtsK' },
  { symbol: 'ftsQ', name: 'Cell division protein FtsQ' },
  { symbol: 'minC', name: 'Septum site-determining protein MinC' },
  { symbol: 'minD', name: 'Septum site-determining protein MinD' },
  { symbol: 'minE', name: 'Cell division topological specificity factor MinE' },
  { symbol: 'mreB', name: 'Rod shape-determining protein MreB' },
  { symbol: 'murA', name: 'UDP-N-acetylglucosamine 1-carboxyvinyltransferase' },
  { symbol: 'murB', name: 'UDP-N-acetylenolpyruvoylglucosamine reductase' },
];

/**
 * Search for genes locally first, then optionally fetch from API
 */
async function searchGenes(
  query: string,
  organism = 'Escherichia coli',
  options?: { fetchRemote?: boolean; limit?: number }
): Promise<GeneSearchResult[]> {
  const normalizedQuery = query.toLowerCase().trim();
  const limit = options?.limit ?? 10;
  
  // Local search first
  const localMatches = COMMON_GENES.filter(g => 
    g.symbol.toLowerCase().includes(normalizedQuery) ||
    g.name.toLowerCase().includes(normalizedQuery)
  ).slice(0, limit);

  const results: GeneSearchResult[] = localMatches.map(g => ({
    type: 'gene',
    data: { symbol: g.symbol, organism, name: g.name },
  }));

  // If exact match, try to get full data from cache or API
  if (options?.fetchRemote !== false) {
    const exactMatch = COMMON_GENES.find(g => 
      g.symbol.toLowerCase() === normalizedQuery
    );
    
    if (exactMatch) {
      // Check cache first
      const cached = await geneDataLayer.getCached(exactMatch.symbol, organism);
      if (cached) {
        results[0] = {
          type: 'gene',
          data: {
            symbol: cached.symbol,
            organism: cached.organism,
            name: cached.proteinName ?? cached.name,
            description: cached.description,
          },
        };
      }
    }
  }

  return results;
}

// ============ Global Search ============

/**
 * Search across all data sources
 */
export async function globalSearch(
  query: string,
  options: SearchOptions = {}
): Promise<GlobalSearchResult[]> {
  const types = options.types ?? ['gene', 'researcher', 'article', 'conference'];
  const organism = options.organism ?? 'Escherichia coli';
  const limit = options.limit ?? 10;

  const results: GlobalSearchResult[] = [];
  const promises: Promise<void>[] = [];

  // Gene search
  if (types.includes('gene')) {
    promises.push(
      searchGenes(query, organism, { limit })
        .then(geneResults => { results.push(...geneResults); })
        .catch(console.error)
    );
  }

  // Knowledge base search (parallel)
  const kbTypes = types.filter(t => t !== 'gene') as ('researcher' | 'article' | 'conference')[];
  if (kbTypes.length > 0) {
    promises.push(
      searchKB(query)
        .then(kbResults => {
          const filtered = kbResults.filter(r => kbTypes.includes(r.type));
          results.push(...filtered.slice(0, limit));
        })
        .catch(console.error)
    );
  }

  await Promise.all(promises);

  // Sort by relevance (exact matches first)
  const normalizedQuery = query.toLowerCase();
  results.sort((a, b) => {
    const aName = getResultName(a).toLowerCase();
    const bName = getResultName(b).toLowerCase();
    
    // Exact match first
    if (aName === normalizedQuery && bName !== normalizedQuery) return -1;
    if (bName === normalizedQuery && aName !== normalizedQuery) return 1;
    
    // Starts with query second
    if (aName.startsWith(normalizedQuery) && !bName.startsWith(normalizedQuery)) return -1;
    if (bName.startsWith(normalizedQuery) && !aName.startsWith(normalizedQuery)) return 1;
    
    return 0;
  });

  return results;
}

/**
 * Get primary name for sorting
 */
function getResultName(result: GlobalSearchResult): string {
  switch (result.type) {
    case 'gene':
      return result.data.symbol;
    case 'researcher':
      return result.data.name;
    case 'article':
      return result.data.title;
    case 'conference':
      return result.data.name;
    default:
      return '';
  }
}

/**
 * Quick search for autocomplete (faster, local only)
 */
export function quickSearch(
  query: string,
  options: SearchOptions = {}
): GeneSearchResult[] {
  if (query.length < 2) return [];
  
  const limit = options.limit ?? 5;
  const normalizedQuery = query.toLowerCase().trim();
  
  return COMMON_GENES
    .filter(g => 
      g.symbol.toLowerCase().startsWith(normalizedQuery) ||
      g.name.toLowerCase().includes(normalizedQuery)
    )
    .slice(0, limit)
    .map(g => ({
      type: 'gene',
      data: {
        symbol: g.symbol,
        organism: options.organism ?? 'Escherichia coli',
        name: g.name,
      },
    }));
}

// Export common genes for other uses
export { COMMON_GENES };
