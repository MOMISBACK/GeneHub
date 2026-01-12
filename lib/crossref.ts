/**
 * Crossref API Client
 * Fetch article metadata from DOI using Crossref public API
 * 
 * API Docs: https://api.crossref.org/swagger-ui/index.html
 * Rate limit: Polite pool (w/ mailto) allows 50 req/sec
 */

import type { ArticleInsert } from '../types/knowledge';

const CROSSREF_BASE = 'https://api.crossref.org/works';
const USER_AGENT = 'GeneHub/1.0 (mailto:support@genehub.app)';

/**
 * Raw Crossref work response
 */
interface CrossrefWork {
  DOI: string;
  title?: string[];
  'container-title'?: string[];
  published?: {
    'date-parts'?: number[][];
  };
  'published-print'?: {
    'date-parts'?: number[][];
  };
  'published-online'?: {
    'date-parts'?: number[][];
  };
  abstract?: string;
  author?: Array<{
    given?: string;
    family?: string;
    name?: string;
    ORCID?: string;
    affiliation?: Array<{ name: string }>;
  }>;
  URL?: string;
  type?: string;
  subject?: string[];
  ISSN?: string[];
}

interface CrossrefResponse {
  status: string;
  'message-type': string;
  message: CrossrefWork;
}

/**
 * Normalize DOI format
 * Accepts: 10.xxx/yyy, doi:10.xxx/yyy, https://doi.org/10.xxx/yyy
 */
export function normalizeDoi(input: string): string | null {
  const cleaned = input.trim();
  
  // Extract DOI pattern
  const doiMatch = cleaned.match(/\b(10\.\d{4,}(?:\.\d+)*\/[^\s"<>]+)/i);
  if (doiMatch) {
    return doiMatch[1];
  }
  
  return null;
}

/**
 * Fetch article metadata from Crossref
 */
export async function fetchCrossrefArticle(doi: string): Promise<CrossrefWork | null> {
  const normalizedDoi = normalizeDoi(doi);
  if (!normalizedDoi) {
    throw new Error(`Invalid DOI format: ${doi}`);
  }

  const url = `${CROSSREF_BASE}/${encodeURIComponent(normalizedDoi)}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (response.status === 404) {
      return null; // DOI not found
    }

    if (!response.ok) {
      throw new Error(`Crossref API error: ${response.status}`);
    }

    const data: CrossrefResponse = await response.json();
    return data.message;
  } catch (error) {
    if (error instanceof Error && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to reach Crossref');
    }
    throw error;
  }
}

/**
 * Extract publication year from Crossref date fields
 */
function extractYear(work: CrossrefWork): number | undefined {
  const dateParts = 
    work.published?.['date-parts']?.[0] ??
    work['published-print']?.['date-parts']?.[0] ??
    work['published-online']?.['date-parts']?.[0];
  
  return dateParts?.[0]; // Year is first element
}

/**
 * Format author names from Crossref data
 */
export function formatCrossrefAuthors(work: CrossrefWork): string {
  if (!work.author?.length) return '';
  
  return work.author
    .map(a => {
      if (a.name) return a.name; // Organization name
      if (a.family && a.given) return `${a.family} ${a.given.charAt(0)}.`;
      if (a.family) return a.family;
      return '';
    })
    .filter(Boolean)
    .join(', ');
}

/**
 * Extract author ORCIDs
 */
export function extractAuthorOrcids(work: CrossrefWork): string[] {
  if (!work.author?.length) return [];
  
  return work.author
    .filter(a => a.ORCID)
    .map(a => a.ORCID!.replace('http://orcid.org/', '').replace('https://orcid.org/', ''));
}

/**
 * Clean HTML from abstract
 */
function cleanAbstract(abstract?: string): string | undefined {
  if (!abstract) return undefined;
  
  // Remove JATS XML tags and HTML
  return abstract
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Convert Crossref work to Article insert
 */
export function crossrefToArticle(work: CrossrefWork): ArticleInsert {
  return {
    title: work.title?.[0] ?? 'Untitled',
    journal: work['container-title']?.[0],
    year: extractYear(work),
    doi: work.DOI,
    url: work.URL,
    abstract: cleanAbstract(work.abstract),
    external_source: 'crossref',
    external_id: work.DOI,
  };
}

/**
 * Fetch and convert DOI to Article
 */
export async function fetchArticleFromDoi(doi: string): Promise<ArticleInsert | null> {
  const work = await fetchCrossrefArticle(doi);
  if (!work) return null;
  
  return crossrefToArticle(work);
}

/**
 * Check if DOI exists in Crossref (quick validation)
 */
export async function validateDoi(doi: string): Promise<boolean> {
  const normalizedDoi = normalizeDoi(doi);
  if (!normalizedDoi) return false;

  try {
    const url = `${CROSSREF_BASE}/${encodeURIComponent(normalizedDoi)}`;
    const response = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': USER_AGENT },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Format citation string from Crossref data
 */
export function formatCrossrefCitation(work: CrossrefWork): string {
  const authors = formatCrossrefAuthors(work);
  const title = work.title?.[0] ?? 'Untitled';
  const journal = work['container-title']?.[0] ?? '';
  const year = extractYear(work);
  
  const parts = [authors, `"${title}"`];
  if (journal) parts.push(journal);
  if (year) parts.push(`(${year})`);
  parts.push(`doi:${work.DOI}`);
  
  return parts.join('. ') + '.';
}

// ============ Search API (for autocomplete) ============

export interface CrossrefSearchResult {
  doi: string;
  title: string;
  journal?: string;
  year?: number;
  authors?: string;
}

/**
 * Search articles by title query (for autocomplete)
 * Uses Crossref's works search API
 */
export async function searchCrossrefByTitle(
  query: string,
  limit: number = 5
): Promise<CrossrefSearchResult[]> {
  if (!query || query.length < 3) return [];
  
  try {
    const params = new URLSearchParams({
      query: query,
      rows: String(limit),
      select: 'DOI,title,container-title,published,author',
    });
    
    const url = `${CROSSREF_BASE}?${params}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    const items = data.message?.items ?? [];
    
    return items.map((work: CrossrefWork) => ({
      doi: work.DOI,
      title: work.title?.[0] ?? 'Untitled',
      journal: work['container-title']?.[0],
      year: extractYear(work),
      authors: formatCrossrefAuthors(work),
    }));
  } catch {
    return [];
  }
}
