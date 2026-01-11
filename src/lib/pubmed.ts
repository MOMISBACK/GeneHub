/**
 * PubMed API Service
 * Fetch article metadata from NCBI E-utilities
 * 
 * API Docs: https://www.ncbi.nlm.nih.gov/books/NBK25499/
 */

// ============ Types ============

export interface PubMedArticle {
  pmid: string;
  title: string;
  abstract: string | null;
  journal: string | null;
  year: number | null;
  doi: string | null;
  authors: PubMedAuthor[];
  keywords: string[];
  pubDate: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
}

export interface PubMedAuthor {
  lastName: string;
  foreName: string;
  initials: string;
  affiliation: string | null;
}

export interface PubMedFetchResult {
  success: boolean;
  article: PubMedArticle | null;
  error: string | null;
}

// ============ Constants ============

const EUTILS_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const EFETCH_URL = `${EUTILS_BASE}/efetch.fcgi`;

// Rate limiting: NCBI allows 3 requests/second without API key
const MIN_REQUEST_INTERVAL = 350; // ms
let lastRequestTime = 0;

// ============ Helpers ============

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  
  if (elapsed < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - elapsed));
  }
  
  lastRequestTime = Date.now();
  return fetch(url);
}

function parseXmlText(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? decodeXmlEntities(match[1].trim()) : null;
}

function parseXmlTextAll(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    matches.push(decodeXmlEntities(match[1].trim()));
  }
  return matches;
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/<[^>]+>/g, ''); // Strip any remaining HTML tags
}

function extractYear(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const match = dateStr.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : null;
}

// ============ Parser ============

function parsePubMedXml(xml: string): PubMedArticle | null {
  // Check if article exists
  if (!xml.includes('<PubmedArticle>')) {
    return null;
  }

  // Extract PMID
  const pmid = parseXmlText(xml, 'PMID');
  if (!pmid) return null;

  // Extract title
  const title = parseXmlText(xml, 'ArticleTitle') || 'Sans titre';

  // Extract abstract
  const abstractTexts = parseXmlTextAll(xml, 'AbstractText');
  const abstract = abstractTexts.length > 0 ? abstractTexts.join('\n\n') : null;

  // Extract journal
  const journal = parseXmlText(xml, 'Title') || parseXmlText(xml, 'ISOAbbreviation');

  // Extract publication date
  const pubDateXml = xml.match(/<PubDate>[\s\S]*?<\/PubDate>/)?.[0] || '';
  const pubYear = parseXmlText(pubDateXml, 'Year');
  const pubMonth = parseXmlText(pubDateXml, 'Month');
  const pubDay = parseXmlText(pubDateXml, 'Day');
  const year = pubYear ? parseInt(pubYear, 10) : null;
  const pubDate = pubYear ? `${pubYear}${pubMonth ? '-' + pubMonth : ''}${pubDay ? '-' + pubDay : ''}` : null;

  // Extract DOI
  const articleIdList = xml.match(/<ArticleIdList>[\s\S]*?<\/ArticleIdList>/)?.[0] || '';
  const doiMatch = articleIdList.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/);
  const doi = doiMatch ? doiMatch[1] : null;

  // Extract volume, issue, pages
  const volume = parseXmlText(xml, 'Volume');
  const issue = parseXmlText(xml, 'Issue');
  const pages = parseXmlText(xml, 'MedlinePgn');

  // Extract authors
  const authors: PubMedAuthor[] = [];
  const authorListMatch = xml.match(/<AuthorList[^>]*>[\s\S]*?<\/AuthorList>/);
  if (authorListMatch) {
    const authorMatches = authorListMatch[0].match(/<Author[^>]*>[\s\S]*?<\/Author>/g) || [];
    for (const authorXml of authorMatches) {
      const lastName = parseXmlText(authorXml, 'LastName') || '';
      const foreName = parseXmlText(authorXml, 'ForeName') || '';
      const initials = parseXmlText(authorXml, 'Initials') || '';
      const affiliation = parseXmlText(authorXml, 'Affiliation');
      
      if (lastName) {
        authors.push({ lastName, foreName, initials, affiliation });
      }
    }
  }

  // Extract keywords
  const keywords = parseXmlTextAll(xml, 'Keyword');

  return {
    pmid,
    title,
    abstract,
    journal,
    year,
    doi,
    authors,
    keywords,
    pubDate,
    volume,
    issue,
    pages,
  };
}

// ============ Main API ============

/**
 * Fetch article metadata from PubMed by PMID
 */
export async function fetchPubMedArticle(pmid: string): Promise<PubMedFetchResult> {
  try {
    // Clean PMID
    const cleanPmid = pmid.replace(/\D/g, '');
    if (!cleanPmid || cleanPmid.length < 1) {
      return { success: false, article: null, error: 'PMID invalide' };
    }

    // Fetch XML from NCBI
    const url = `${EFETCH_URL}?db=pubmed&id=${cleanPmid}&rettype=xml&retmode=xml`;
    const response = await rateLimitedFetch(url);

    if (!response.ok) {
      return { 
        success: false, 
        article: null, 
        error: `Erreur NCBI: ${response.status}` 
      };
    }

    const xml = await response.text();

    // Check for error response
    if (xml.includes('<ERROR>') || xml.includes('Error occurred')) {
      return { 
        success: false, 
        article: null, 
        error: 'Article non trouvé sur PubMed' 
      };
    }

    // Parse XML
    const article = parsePubMedXml(xml);
    if (!article) {
      return { 
        success: false, 
        article: null, 
        error: 'Impossible de parser les données PubMed' 
      };
    }

    return { success: true, article, error: null };
  } catch (error: any) {
    return { 
      success: false, 
      article: null, 
      error: error.message || 'Erreur réseau' 
    };
  }
}

/**
 * Fetch multiple articles (batched)
 */
export async function fetchPubMedArticles(pmids: string[]): Promise<Map<string, PubMedFetchResult>> {
  const results = new Map<string, PubMedFetchResult>();
  
  // NCBI supports up to 200 IDs per request, but we'll do 10 at a time for safety
  const BATCH_SIZE = 10;
  
  for (let i = 0; i < pmids.length; i += BATCH_SIZE) {
    const batch = pmids.slice(i, i + BATCH_SIZE);
    const cleanIds = batch.map(id => id.replace(/\D/g, '')).filter(Boolean);
    
    if (cleanIds.length === 0) continue;

    try {
      const url = `${EFETCH_URL}?db=pubmed&id=${cleanIds.join(',')}&rettype=xml&retmode=xml`;
      const response = await rateLimitedFetch(url);
      
      if (response.ok) {
        const xml = await response.text();
        
        // Split by PubmedArticle tags
        const articleXmls = xml.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];
        
        for (const articleXml of articleXmls) {
          const article = parsePubMedXml(articleXml);
          if (article) {
            results.set(article.pmid, { success: true, article, error: null });
          }
        }
      }
    } catch (error: any) {
      // Mark all batch items as failed
      for (const id of batch) {
        if (!results.has(id)) {
          results.set(id, { success: false, article: null, error: error.message });
        }
      }
    }
  }

  // Mark any missing PMIDs as not found
  for (const pmid of pmids) {
    const clean = pmid.replace(/\D/g, '');
    if (!results.has(clean)) {
      results.set(clean, { success: false, article: null, error: 'Non trouvé' });
    }
  }

  return results;
}

/**
 * Format authors as citation string
 */
export function formatAuthors(authors: PubMedAuthor[], maxAuthors = 3): string {
  if (authors.length === 0) return '';
  
  const formatted = authors.slice(0, maxAuthors).map(a => 
    `${a.lastName} ${a.initials}`.trim()
  );
  
  if (authors.length > maxAuthors) {
    formatted.push('et al.');
  }
  
  return formatted.join(', ');
}

/**
 * Format citation string
 */
export function formatCitation(article: PubMedArticle): string {
  const parts: string[] = [];
  
  // Authors
  const authors = formatAuthors(article.authors);
  if (authors) parts.push(authors);
  
  // Title
  parts.push(article.title);
  
  // Journal info
  const journalParts: string[] = [];
  if (article.journal) journalParts.push(article.journal);
  if (article.year) journalParts.push(String(article.year));
  if (article.volume) {
    let vol = article.volume;
    if (article.issue) vol += `(${article.issue})`;
    if (article.pages) vol += `:${article.pages}`;
    journalParts.push(vol);
  }
  
  if (journalParts.length > 0) {
    parts.push(journalParts.join('. '));
  }
  
  return parts.join('. ') + '.';
}
