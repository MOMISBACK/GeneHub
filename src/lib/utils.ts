/**
 * Pure utility functions extracted for testing
 * These functions have no React Native / Expo dependencies
 */

// ============ Cache Utilities ============

/**
 * Normalize gene symbol for consistent storage/lookup
 * dnaA, DnaA, DNAA -> dnaa
 */
export function normalizeSymbol(symbol: string): string {
  return symbol.toLowerCase().trim();
}

/**
 * Normalize organism name
 * E. coli, e.coli, E.Coli -> e. coli
 */
export function normalizeOrganism(organism: string): string {
  return organism.toLowerCase().trim();
}

/**
 * Generate cache key for gene storage
 */
export function getCacheKey(symbol: string, organism: string, prefix = 'gene_cache_'): string {
  return `${prefix}${normalizeSymbol(symbol)}_${normalizeOrganism(organism)}`;
}

/**
 * Check if cache is still valid (within duration)
 */
export function isCacheValid(cachedAt: number, durationMs: number = 24 * 60 * 60 * 1000): boolean {
  return Date.now() - cachedAt <= durationMs;
}

// ============ FunctionText Parsing Utilities ============

// Superscript characters for reference numbers
const SUPERSCRIPTS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];

/**
 * Convert a number to superscript characters
 */
export function toSuperscript(num: number): string {
  return num.toString().split('').map(d => SUPERSCRIPTS[parseInt(d)]).join('');
}

// Common bacterial gene name patterns (2-4 lowercase letters + uppercase letter + optional number)
// Examples: dnaA, recA, ftsZ, rpoB, gyrA, lacZ, etc.
export const GENE_PATTERN = /\b([a-z]{2,4}[A-Z][0-9]?)\b/g;

// Known gene prefixes in bacteria (used for more accurate detection)
export const KNOWN_GENE_PREFIXES = [
  'dn', 're', 'ft', 'rp', 'gy', 'la', 'ma', 'tr', 'hi', 'le',
  'ar', 'th', 'me', 'cy', 'pr', 'ph', 'ty', 'va', 'il', 'al',
  'gl', 'as', 'ly', 'se', 'uv', 'le', 'da', 'mu', 'na', 'ni',
  'fn', 'cr', 'fu', 'zu', 'so', 'ka', 'ah', 'om', 'fi', 'fl',
  'ch', 'mo', 'pt', 'pg', 'pf', 'fb', 'ga', 'en', 'py', 'ac',
  'ci', 'ic', 'su', 'md', 'pp', 'pc', 'at', 'nu', 'sd', 'nd',
  'pu', 'ca', 'ri', 'bi', 'pa', 'fo', 'he', 'to', 'sm', 'zi',
  'ss', 'li', 'rn', 'in', 'tu', 'er', 'ob', 'yp', 'ye', 'si',
  'cs', 'hn', 'ih', 'dp', 'ro', 'dx', 'qo', 'qe', 'na', 'or',
];

export type Reference = {
  index: number;
  pubmedId: string;
};

export type TextSegment = {
  type: 'text' | 'ref' | 'gene';
  content: string;
  refIndex?: number;
  geneName?: string;
};

/**
 * Parse function text to extract references and segments
 */
export function parseText(text: string): { segments: TextSegment[]; references: Reference[] } {
  const refs: Reference[] = [];
  let processedText = text;
  
  // Extract and replace PubMed references
  const pubmedRegex = /\(?PubMed[:\s]*(\d+)(?:[,\s]+PubMed[:\s]*(\d+))*\)?/gi;
  const pubmedMap = new Map<string, number>();
  
  // Find all PubMed matches
  let match;
  const pubmedMatches: Array<{ fullMatch: string; ids: string[] }> = [];
  
  while ((match = pubmedRegex.exec(text)) !== null) {
    const ids: string[] = [];
    const fullMatch = match[0];
    const idMatches = fullMatch.matchAll(/(\d{5,})/g);
    for (const idMatch of idMatches) {
      ids.push(idMatch[1]);
    }
    pubmedMatches.push({ fullMatch, ids });
  }
  
  // Assign indices to unique PubMed IDs and build replacement text
  for (const m of pubmedMatches) {
    let replacement = '';
    for (const id of m.ids) {
      if (!pubmedMap.has(id)) {
        const idx = refs.length + 1;
        pubmedMap.set(id, idx);
        refs.push({ index: idx, pubmedId: id });
      }
      replacement += `<<REF:${pubmedMap.get(id)}>>`;
    }
    processedText = processedText.replace(m.fullMatch, replacement);
  }
  
  // Parse the text into segments (text, refs, and genes)
  const segs: TextSegment[] = [];
  
  // Split by ref markers first
  const refParts = processedText.split(/(<<REF:\d+>>)/);
  
  for (const part of refParts) {
    const refMatch = part.match(/<<REF:(\d+)>>/);
    if (refMatch) {
      segs.push({ type: 'ref', content: toSuperscript(parseInt(refMatch[1])), refIndex: parseInt(refMatch[1]) });
    } else if (part.trim()) {
      // Look for gene names in this text part
      const geneMatches: Array<{ gene: string; start: number; end: number }> = [];
      let geneMatch;
      
      GENE_PATTERN.lastIndex = 0;
      
      while ((geneMatch = GENE_PATTERN.exec(part)) !== null) {
        const gene = geneMatch[1];
        const prefix = gene.slice(0, 2).toLowerCase();
        
        if (KNOWN_GENE_PREFIXES.includes(prefix)) {
          geneMatches.push({
            gene,
            start: geneMatch.index,
            end: geneMatch.index + gene.length,
          });
        }
      }
      
      // Build segments from this part
      if (geneMatches.length === 0) {
        segs.push({ type: 'text', content: part });
      } else {
        let lastIdx = 0;
        for (const gm of geneMatches) {
          if (gm.start > lastIdx) {
            segs.push({ type: 'text', content: part.slice(lastIdx, gm.start) });
          }
          segs.push({ type: 'gene', content: gm.gene, geneName: gm.gene });
          lastIdx = gm.end;
        }
        if (lastIdx < part.length) {
          segs.push({ type: 'text', content: part.slice(lastIdx) });
        }
      }
    }
  }
  
  // If no segments, just return the whole text
  if (segs.length === 0) {
    segs.push({ type: 'text', content: text });
  }
  
  return { segments: segs, references: refs };
}

// ============ API Error Formatting ============

/**
 * Format API invoke error with user-friendly message
 */
export function formatInvokeError(fnName: string, error: unknown): Error {
  const e = error as any;
  const message = String(e?.message ?? error);
  const status = e?.context?.status ?? e?.status;

  if (status === 401) {
    return new Error('Non autorisé (401). Reconnecte-toi puis réessaie.');
  }
  if (status === 404) {
    return new Error(`Fonction ${fnName} non déployée. Déploie-la sur Supabase.`);
  }
  if (status === 422) {
    return new Error('Gène non trouvé. Vérifie le symbole.');
  }
  if (status === 502) {
    return new Error('Erreur serveur (502). Réessaie dans quelques secondes.');
  }
  return new Error(`Erreur: ${message}`);
}
