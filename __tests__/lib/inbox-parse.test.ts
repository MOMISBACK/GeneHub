/**
 * Tests for Inbox Parser
 */

import {
  detectInboxType,
  isPmid,
  isDoi,
  isUrl,
  extractPmid,
  extractDoi,
  getTypeLabel,
  getTypeColor,
} from '../../src/lib/inbox/parse';

describe('Inbox Parser', () => {
  describe('detectInboxType', () => {
    // ============ PMID Tests ============
    describe('PMID detection', () => {
      it('should detect PMID: format', () => {
        const result = detectInboxType('PMID:12345678');
        expect(result.type).toBe('pmid');
        expect(result.normalized).toBe('12345678');
      });

      it('should detect PMID: with space', () => {
        const result = detectInboxType('PMID: 12345678');
        expect(result.type).toBe('pmid');
        expect(result.normalized).toBe('12345678');
      });

      it('should detect lowercase pmid', () => {
        const result = detectInboxType('pmid:12345678');
        expect(result.type).toBe('pmid');
        expect(result.normalized).toBe('12345678');
      });

      it('should detect 8-digit standalone number as PMID', () => {
        const result = detectInboxType('12345678');
        expect(result.type).toBe('pmid');
        expect(result.normalized).toBe('12345678');
      });

      it('should detect 7-digit standalone number as PMID', () => {
        const result = detectInboxType('1234567');
        expect(result.type).toBe('pmid');
        expect(result.normalized).toBe('1234567');
      });

      it('should detect PubMed URL', () => {
        const result = detectInboxType('https://pubmed.ncbi.nlm.nih.gov/12345678');
        expect(result.type).toBe('pmid');
        expect(result.normalized).toBe('12345678');
      });

      it('should detect PubMed URL with trailing slash', () => {
        const result = detectInboxType('https://pubmed.ncbi.nlm.nih.gov/12345678/');
        expect(result.type).toBe('pmid');
        expect(result.normalized).toBe('12345678');
      });

      it('should detect pubmed format', () => {
        const result = detectInboxType('pubmed:12345678');
        expect(result.type).toBe('pmid');
        expect(result.normalized).toBe('12345678');
      });
    });

    // ============ DOI Tests ============
    describe('DOI detection', () => {
      it('should detect DOI format', () => {
        const result = detectInboxType('10.1038/nature12373');
        expect(result.type).toBe('doi');
        expect(result.normalized).toBe('10.1038/nature12373');
      });

      it('should detect doi: prefix', () => {
        const result = detectInboxType('doi:10.1038/nature12373');
        expect(result.type).toBe('doi');
        expect(result.normalized).toBe('10.1038/nature12373');
      });

      it('should detect DOI: with space', () => {
        const result = detectInboxType('DOI: 10.1038/nature12373');
        expect(result.type).toBe('doi');
        expect(result.normalized).toBe('10.1038/nature12373');
      });

      it('should detect doi.org URL', () => {
        const result = detectInboxType('https://doi.org/10.1038/nature12373');
        expect(result.type).toBe('doi');
        expect(result.normalized).toBe('10.1038/nature12373');
      });

      it('should handle DOI with complex path', () => {
        const result = detectInboxType('10.1016/j.cell.2023.06.001');
        expect(result.type).toBe('doi');
        expect(result.normalized).toBe('10.1016/j.cell.2023.06.001');
      });

      it('should strip trailing punctuation from DOI', () => {
        const result = detectInboxType('10.1038/nature12373.');
        expect(result.type).toBe('doi');
        expect(result.normalized).toBe('10.1038/nature12373');
      });
    });

    // ============ URL Tests ============
    describe('URL detection', () => {
      it('should detect http URL', () => {
        const result = detectInboxType('http://example.com/article');
        expect(result.type).toBe('url');
        expect(result.normalized).toBe('http://example.com/article');
      });

      it('should detect https URL', () => {
        const result = detectInboxType('https://www.nature.com/articles/12345');
        expect(result.type).toBe('url');
        expect(result.normalized).toBe('https://www.nature.com/articles/12345');
      });

      it('should NOT detect non-http URLs', () => {
        const result = detectInboxType('ftp://example.com');
        expect(result.type).toBe('text');
      });
    });

    // ============ Text Tests ============
    describe('Text detection', () => {
      it('should detect plain text', () => {
        const result = detectInboxType('This is a note about DnaA');
        expect(result.type).toBe('text');
        expect(result.normalized).toBe('This is a note about DnaA');
      });

      it('should detect short text', () => {
        const result = detectInboxType('Check this later');
        expect(result.type).toBe('text');
      });

      it('should handle empty string', () => {
        const result = detectInboxType('');
        expect(result.type).toBe('text');
        expect(result.normalized).toBe('');
      });

      it('should handle whitespace only', () => {
        const result = detectInboxType('   ');
        expect(result.type).toBe('text');
        expect(result.normalized).toBe('');
      });

      it('should NOT detect 6-digit number as PMID', () => {
        const result = detectInboxType('123456');
        expect(result.type).toBe('text');
      });
    });

    // ============ Priority Tests ============
    describe('Priority', () => {
      it('should prioritize PMID over URL for PubMed links', () => {
        const result = detectInboxType('https://pubmed.ncbi.nlm.nih.gov/12345678');
        expect(result.type).toBe('pmid');
      });

      it('should prioritize DOI over URL for doi.org links', () => {
        const result = detectInboxType('https://doi.org/10.1038/nature12373');
        expect(result.type).toBe('doi');
      });
    });
  });

  // ============ Helper Functions ============
  describe('Helper functions', () => {
    describe('isPmid', () => {
      it('should return true for PMID', () => {
        expect(isPmid('PMID:12345678')).toBe(true);
        expect(isPmid('12345678')).toBe(true);
      });

      it('should return false for non-PMID', () => {
        expect(isPmid('10.1038/nature')).toBe(false);
        expect(isPmid('hello')).toBe(false);
      });
    });

    describe('isDoi', () => {
      it('should return true for DOI', () => {
        expect(isDoi('10.1038/nature12373')).toBe(true);
        expect(isDoi('doi:10.1038/nature12373')).toBe(true);
      });

      it('should return false for non-DOI', () => {
        expect(isDoi('PMID:12345678')).toBe(false);
        expect(isDoi('hello')).toBe(false);
      });
    });

    describe('isUrl', () => {
      it('should return true for URL', () => {
        expect(isUrl('https://example.com')).toBe(true);
      });

      it('should return false for non-URL', () => {
        expect(isUrl('example.com')).toBe(false);
        expect(isUrl('hello')).toBe(false);
      });
    });

    describe('extractPmid', () => {
      it('should extract PMID from various formats', () => {
        expect(extractPmid('PMID:12345678')).toBe('12345678');
        expect(extractPmid('https://pubmed.ncbi.nlm.nih.gov/12345678')).toBe('12345678');
      });

      it('should return null for non-PMID', () => {
        expect(extractPmid('hello')).toBeNull();
      });
    });

    describe('extractDoi', () => {
      it('should extract DOI from various formats', () => {
        expect(extractDoi('doi:10.1038/nature12373')).toBe('10.1038/nature12373');
        expect(extractDoi('https://doi.org/10.1038/nature12373')).toBe('10.1038/nature12373');
      });

      it('should return null for non-DOI', () => {
        expect(extractDoi('hello')).toBeNull();
      });
    });

    describe('getTypeLabel', () => {
      it('should return correct labels', () => {
        expect(getTypeLabel('pmid')).toBe('PubMed ID');
        expect(getTypeLabel('doi')).toBe('DOI');
        expect(getTypeLabel('url')).toBe('URL');
        expect(getTypeLabel('text')).toBe('Texte');
      });
    });

    describe('getTypeColor', () => {
      it('should return colors for all types', () => {
        expect(getTypeColor('pmid')).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(getTypeColor('doi')).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(getTypeColor('url')).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(getTypeColor('text')).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });
});
