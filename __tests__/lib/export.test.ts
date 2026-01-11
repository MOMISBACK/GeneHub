/**
 * Export Service Tests
 */

import {
  articleToBibtex,
  exportArticlesToBibtex,
  exportNotesToMarkdown,
  exportArticlesToCsv,
  exportResearchersToCsv,
  getExportExtension,
  getExportMimeType,
  generateExportFilename,
} from '../../src/lib/export';
import type { Article, EntityNote, Researcher, Tag } from '../../src/types/knowledge';

describe('Export Service', () => {
  // Sample data
  const sampleArticle: Article = {
    id: '1',
    title: 'Gene regulation in E. coli',
    journal: 'Nature',
    year: 2024,
    doi: '10.1038/nature12345',
    pmid: '12345678',
    url: 'https://example.com/article',
    abstract: 'This is an abstract about gene regulation.',
    created_at: '2024-01-01',
    updated_at: '2024-01-15',
  };

  const sampleNote: EntityNote = {
    id: 'note-1',
    user_id: 'user-123',
    entity_type: 'gene',
    entity_id: 'lacZ',
    content: 'Important note about lacZ gene function.',
    created_at: '2024-01-10T12:00:00Z',
    updated_at: '2024-01-12T14:30:00Z',
    tags: [
      { id: 't1', user_id: 'user-123', name: 'important', created_at: '2024-01-01' },
      { id: 't2', user_id: 'user-123', name: 'regulation', created_at: '2024-01-01' },
    ],
  };

  const sampleResearcher: Researcher = {
    id: 'r1',
    name: 'Dr. Jane Smith',
    institution: 'MIT',
    city: 'Cambridge',
    country: 'USA',
    email: 'jane@mit.edu',
    specialization: 'Molecular Biology',
    orcid: '0000-0001-2345-6789',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  describe('BibTeX Export', () => {
    it('should export article to BibTeX format', () => {
      const bibtex = articleToBibtex(sampleArticle, 'smith2024regulation');
      
      expect(bibtex).toContain('@article{smith2024regulation');
      expect(bibtex).toContain('title = {Gene regulation in E. coli}');
      expect(bibtex).toContain('journal = {Nature}');
      expect(bibtex).toContain('year = {2024}');
      expect(bibtex).toContain('doi = {10.1038/nature12345}');
      expect(bibtex).toContain('pmid = {12345678}');
    });

    it('should escape special BibTeX characters', () => {
      const articleWithSpecial: Article = {
        ...sampleArticle,
        title: 'Gene A & Gene B: 100% related',
      };
      const bibtex = articleToBibtex(articleWithSpecial);
      
      expect(bibtex).toContain('\\&');
      expect(bibtex).toContain('\\%');
    });

    it('should handle missing fields gracefully', () => {
      const minimalArticle: Article = {
        id: '2',
        title: 'Minimal Article',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };
      const bibtex = articleToBibtex(minimalArticle);
      
      expect(bibtex).toContain('title = {Minimal Article}');
      expect(bibtex).not.toContain('journal');
      expect(bibtex).not.toContain('doi');
    });

    it('should export multiple articles with header', () => {
      const bibtex = exportArticlesToBibtex([sampleArticle, sampleArticle]);
      
      expect(bibtex).toContain('% GeneHub Export');
      expect(bibtex).toContain('% 2 article(s)');
      expect(bibtex.split('@article').length).toBe(3); // Header + 2 entries
    });
  });

  describe('Markdown Notes Export', () => {
    it('should export note to Markdown format', () => {
      const markdown = exportNotesToMarkdown([sampleNote], { lacZ: 'lacZ Gene' });
      
      expect(markdown).toContain('# GeneHub Notes Export');
      expect(markdown).toContain('## lacZ Gene');
      expect(markdown).toContain('Important note about lacZ gene function.');
      expect(markdown).toContain('#important');
      expect(markdown).toContain('#regulation');
    });

    it('should group notes by entity type', () => {
      const notes: EntityNote[] = [
        { ...sampleNote, entity_type: 'gene' },
        { ...sampleNote, id: 'n2', entity_type: 'article', entity_id: 'art-1' },
      ];
      const markdown = exportNotesToMarkdown(notes);
      
      expect(markdown).toContain('# Genes');
      expect(markdown).toContain('# Articles');
    });

    it('should include metadata dates', () => {
      const markdown = exportNotesToMarkdown([sampleNote]);
      
      expect(markdown).toContain('Created:');
      expect(markdown).toContain('Updated:');
    });
  });

  describe('CSV Export', () => {
    it('should export articles to CSV', () => {
      const csv = exportArticlesToCsv([sampleArticle]);
      const lines = csv.split('\n');
      
      expect(lines[0]).toBe('title,journal,year,doi,pmid,url,abstract');
      expect(lines[1]).toContain('Gene regulation in E. coli');
      expect(lines[1]).toContain('Nature');
      expect(lines[1]).toContain('2024');
    });

    it('should escape CSV special characters', () => {
      const articleWithComma: Article = {
        ...sampleArticle,
        title: 'Gene A, Gene B, and Gene C',
      };
      const csv = exportArticlesToCsv([articleWithComma]);
      
      expect(csv).toContain('"Gene A, Gene B, and Gene C"');
    });

    it('should export researchers to CSV', () => {
      const csv = exportResearchersToCsv([sampleResearcher]);
      const lines = csv.split('\n');
      
      expect(lines[0]).toBe('name,institution,city,country,email,specialization,orcid');
      expect(lines[1]).toContain('Dr. Jane Smith');
      expect(lines[1]).toContain('MIT');
      expect(lines[1]).toContain('0000-0001-2345-6789');
    });
  });

  describe('Export Utilities', () => {
    it('should return correct file extensions', () => {
      expect(getExportExtension('bibtex')).toBe('bib');
      expect(getExportExtension('markdown')).toBe('md');
      expect(getExportExtension('csv')).toBe('csv');
      expect(getExportExtension('json')).toBe('json');
    });

    it('should return correct MIME types', () => {
      expect(getExportMimeType('bibtex')).toBe('application/x-bibtex');
      expect(getExportMimeType('markdown')).toBe('text/markdown');
      expect(getExportMimeType('csv')).toBe('text/csv');
      expect(getExportMimeType('json')).toBe('application/json');
    });

    it('should generate correct filenames', () => {
      const filename = generateExportFilename('articles', 'bibtex');
      
      expect(filename).toMatch(/^genehub-articles-\d{4}-\d{2}-\d{2}\.bib$/);
    });

    it('should generate different filenames for different types', () => {
      const notesFn = generateExportFilename('notes', 'markdown');
      const articlesFn = generateExportFilename('articles', 'csv');
      const fullFn = generateExportFilename('full', 'json');
      
      expect(notesFn).toContain('notes');
      expect(notesFn).toContain('.md');
      expect(articlesFn).toContain('articles');
      expect(articlesFn).toContain('.csv');
      expect(fullFn).toContain('full');
      expect(fullFn).toContain('.json');
    });
  });
});
