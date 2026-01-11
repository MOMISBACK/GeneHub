/**
 * Inbox Parser
 * Detects type of input (PMID, DOI, URL, or plain text)
 */

import type { InboxDetectedType, ParseResult } from '../../types/inbox';

// ============ Regex Patterns ============

/**
 * PMID patterns:
 * - PMID:12345678
 * - PMID: 12345678
 * - pmid12345678
 * - 12345678 (8 digits, standalone)
 */
const PMID_PATTERNS = [
  /\bPMID[:\s]*(\d{7,8})\b/i,
  /\bpubmed[:\s/]*(\d{7,8})\b/i,
  /^(\d{7,8})$/, // Standalone 7-8 digit number
];

/**
 * DOI patterns:
 * - 10.1234/something
 * - doi:10.1234/something
 * - https://doi.org/10.1234/something
 */
const DOI_PATTERNS = [
  /\bdoi[:\s]*(10\.\d{4,}\/[^\s]+)/i,
  /doi\.org\/(10\.\d{4,}\/[^\s]+)/i,
  /\b(10\.\d{4,}\/[^\s]+)/,
];

/**
 * URL pattern (http/https)
 */
const URL_PATTERN = /^https?:\/\/[^\s]+$/i;

/**
 * PubMed URL pattern to extract PMID
 */
const PUBMED_URL_PATTERN = /pubmed\.ncbi\.nlm\.nih\.gov\/(\d{7,8})/i;

// ============ Parser Functions ============

/**
 * Try to extract PMID from text
 */
function tryParsePmid(text: string): ParseResult | null {
  const trimmed = text.trim();
  
  // First check if it's a PubMed URL
  const pubmedUrlMatch = trimmed.match(PUBMED_URL_PATTERN);
  if (pubmedUrlMatch) {
    return {
      type: 'pmid',
      normalized: pubmedUrlMatch[1],
      match: pubmedUrlMatch[0],
    };
  }
  
  // Try PMID patterns
  for (const pattern of PMID_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return {
        type: 'pmid',
        normalized: match[1],
        match: match[0],
      };
    }
  }
  
  return null;
}

/**
 * Try to extract DOI from text
 */
function tryParseDoi(text: string): ParseResult | null {
  const trimmed = text.trim();
  
  for (const pattern of DOI_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      // Clean DOI: remove trailing punctuation
      const doi = match[1].replace(/[.,;:)\]]+$/, '');
      return {
        type: 'doi',
        normalized: doi,
        match: match[0],
      };
    }
  }
  
  return null;
}

/**
 * Try to parse as URL
 */
function tryParseUrl(text: string): ParseResult | null {
  const trimmed = text.trim();
  
  if (URL_PATTERN.test(trimmed)) {
    return {
      type: 'url',
      normalized: trimmed,
      match: trimmed,
    };
  }
  
  return null;
}

// ============ Main Detection Function ============

/**
 * Detect the type of inbox input
 * Priority: PMID > DOI > URL > text
 */
export function detectInboxType(input: string): ParseResult {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return {
      type: 'text',
      normalized: '',
      match: '',
    };
  }
  
  // Try PMID first (including PubMed URLs)
  const pmidResult = tryParsePmid(trimmed);
  if (pmidResult) {
    return pmidResult;
  }
  
  // Try DOI
  const doiResult = tryParseDoi(trimmed);
  if (doiResult) {
    return doiResult;
  }
  
  // Try URL (after PMID/DOI to not catch doi.org URLs as generic URLs)
  const urlResult = tryParseUrl(trimmed);
  if (urlResult) {
    return urlResult;
  }
  
  // Default to text
  return {
    type: 'text',
    normalized: trimmed,
    match: trimmed,
  };
}

/**
 * Check if a string looks like a PMID
 */
export function isPmid(text: string): boolean {
  return detectInboxType(text).type === 'pmid';
}

/**
 * Check if a string looks like a DOI
 */
export function isDoi(text: string): boolean {
  return detectInboxType(text).type === 'doi';
}

/**
 * Check if a string looks like a URL
 */
export function isUrl(text: string): boolean {
  return detectInboxType(text).type === 'url';
}

/**
 * Extract PMID from any format
 */
export function extractPmid(text: string): string | null {
  const result = tryParsePmid(text);
  return result?.normalized ?? null;
}

/**
 * Extract DOI from any format
 */
export function extractDoi(text: string): string | null {
  const result = tryParseDoi(text);
  return result?.normalized ?? null;
}

/**
 * Get display label for detected type
 */
export function getTypeLabel(type: InboxDetectedType): string {
  switch (type) {
    case 'pmid':
      return 'PubMed ID';
    case 'doi':
      return 'DOI';
    case 'url':
      return 'URL';
    case 'text':
      return 'Texte';
    default:
      return 'Inconnu';
  }
}

/**
 * Get color for detected type (for UI badges)
 */
export function getTypeColor(type: InboxDetectedType): string {
  switch (type) {
    case 'pmid':
      return '#4A90A4'; // Blue
    case 'doi':
      return '#7B68EE'; // Purple
    case 'url':
      return '#20B2AA'; // Teal
    case 'text':
      return '#808080'; // Gray
    default:
      return '#808080';
  }
}
