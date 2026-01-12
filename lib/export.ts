/**
 * Export Service
 * Export user data in various formats
 * 
 * Formats supported:
 * - Markdown: Notes export
 * - BibTeX: Articles export (academic citations)
 * - JSON: Full data export
 */

import type { Article, EntityNote, Researcher, Conference, Tag } from '../types/knowledge';

// ============ BibTeX Export ============

/**
 * Generate BibTeX citation key from article
 * Format: Author2024keyword
 */
function generateBibtexKey(article: Article, index: number): string {
  const year = article.year || 'nd';
  const titleWord = article.title
    .split(' ')
    .find(w => w.length > 4 && /^[a-zA-Z]+$/.test(w))
    ?.toLowerCase() || 'article';
  
  return `article${year}${titleWord}${index}`;
}

/**
 * Escape special BibTeX characters
 */
function escapeBibtex(text: string): string {
  return text
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\~{}')
    .replace(/\^/g, '\\^{}');
}

/**
 * Convert article to BibTeX entry
 */
export function articleToBibtex(article: Article, key?: string): string {
  const entryKey = key || generateBibtexKey(article, 0);
  
  const fields: string[] = [];
  
  fields.push(`  title = {${escapeBibtex(article.title)}}`);
  
  if (article.journal) {
    fields.push(`  journal = {${escapeBibtex(article.journal)}}`);
  }
  
  if (article.year) {
    fields.push(`  year = {${article.year}}`);
  }
  
  if (article.doi) {
    fields.push(`  doi = {${article.doi}}`);
  }
  
  if (article.pmid) {
    fields.push(`  pmid = {${article.pmid}}`);
  }
  
  if (article.url) {
    fields.push(`  url = {${article.url}}`);
  }
  
  if (article.abstract) {
    fields.push(`  abstract = {${escapeBibtex(article.abstract)}}`);
  }
  
  return `@article{${entryKey},\n${fields.join(',\n')}\n}`;
}

/**
 * Export multiple articles to BibTeX format
 */
export function exportArticlesToBibtex(articles: Article[]): string {
  const header = `% GeneHub Export - ${new Date().toISOString().split('T')[0]}
% ${articles.length} article(s)
`;
  
  const entries = articles.map((article, i) => {
    const key = generateBibtexKey(article, i);
    return articleToBibtex(article, key);
  });
  
  return header + '\n' + entries.join('\n\n');
}

// ============ Markdown Notes Export ============

/**
 * Format note to Markdown
 */
function noteToMarkdown(note: EntityNote, entityName?: string): string {
  const header = `## ${entityName || `${note.entity_type}:${note.entity_id}`}`;
  const meta = `*Created: ${new Date(note.created_at).toLocaleDateString()} | Updated: ${new Date(note.updated_at).toLocaleDateString()}*`;
  
  const tags = note.tags?.length 
    ? `**Tags:** ${note.tags.map(t => `#${t.name}`).join(' ')}`
    : '';
  
  return [header, meta, tags, '', note.content, ''].filter(Boolean).join('\n');
}

/**
 * Export notes to Markdown format
 */
export function exportNotesToMarkdown(
  notes: EntityNote[],
  entityNames?: Record<string, string>
): string {
  const header = `# GeneHub Notes Export
  
*Exported: ${new Date().toISOString()}*
*${notes.length} note(s)*

---
`;
  
  // Group by entity type
  const grouped = notes.reduce((acc, note) => {
    const type = note.entity_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(note);
    return acc;
  }, {} as Record<string, EntityNote[]>);
  
  const sections = Object.entries(grouped).map(([type, typeNotes]) => {
    const sectionHeader = `# ${type.charAt(0).toUpperCase() + type.slice(1)}s\n`;
    const notesContent = typeNotes
      .map(n => noteToMarkdown(n, entityNames?.[n.entity_id]))
      .join('\n---\n\n');
    return sectionHeader + notesContent;
  });
  
  return header + sections.join('\n\n');
}

// ============ CSV Export ============

/**
 * Export articles to CSV format
 */
export function exportArticlesToCsv(articles: Article[]): string {
  const headers = ['title', 'journal', 'year', 'doi', 'pmid', 'url', 'abstract'];
  
  const escapeCSV = (val: string | number | undefined): string => {
    if (val === undefined || val === null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  const rows = articles.map(article => 
    headers.map(h => escapeCSV(article[h as keyof Article])).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Export researchers to CSV format
 */
export function exportResearchersToCsv(researchers: Researcher[]): string {
  const headers = ['name', 'institution', 'city', 'country', 'email', 'specialization', 'orcid'];
  
  const escapeCSV = (val: string | undefined): string => {
    if (val === undefined || val === null) return '';
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };
  
  const rows = researchers.map(r => 
    headers.map(h => escapeCSV(r[h as keyof Researcher] as string)).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

// ============ JSON Export ============

export interface FullExportData {
  exportedAt: string;
  version: string;
  notes: EntityNote[];
  tags: Tag[];
  // These are shared data, not owned by user, but included for context
  articles?: Article[];
  researchers?: Researcher[];
  conferences?: Conference[];
}

/**
 * Export all user data to JSON
 */
export function exportToJson(data: FullExportData): string {
  return JSON.stringify(data, null, 2);
}

// ============ Export Utilities ============

/**
 * Get file extension for export format
 */
export function getExportExtension(format: 'bibtex' | 'markdown' | 'csv' | 'json'): string {
  switch (format) {
    case 'bibtex': return 'bib';
    case 'markdown': return 'md';
    case 'csv': return 'csv';
    case 'json': return 'json';
  }
}

/**
 * Get MIME type for export format
 */
export function getExportMimeType(format: 'bibtex' | 'markdown' | 'csv' | 'json'): string {
  switch (format) {
    case 'bibtex': return 'application/x-bibtex';
    case 'markdown': return 'text/markdown';
    case 'csv': return 'text/csv';
    case 'json': return 'application/json';
  }
}

/**
 * Generate export filename
 */
export function generateExportFilename(
  type: 'notes' | 'articles' | 'researchers' | 'full',
  format: 'bibtex' | 'markdown' | 'csv' | 'json'
): string {
  const date = new Date().toISOString().split('T')[0];
  return `genehub-${type}-${date}.${getExportExtension(format)}`;
}
