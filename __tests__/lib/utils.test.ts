/**
 * Unit tests for pure utility functions
 * These tests don't depend on React Native / Expo
 */

import {
  normalizeSymbol,
  normalizeOrganism,
  getCacheKey,
  isCacheValid,
  toSuperscript,
  parseText,
  formatInvokeError,
  GENE_PATTERN,
  KNOWN_GENE_PREFIXES,
} from '../../src/lib/utils';

describe('Cache Utilities', () => {
  describe('normalizeSymbol', () => {
    it('should convert to lowercase', () => {
      expect(normalizeSymbol('DnaA')).toBe('dnaa');
      expect(normalizeSymbol('RECA')).toBe('reca');
      expect(normalizeSymbol('ftsZ')).toBe('ftsz');
    });

    it('should trim whitespace', () => {
      expect(normalizeSymbol('  dnaA  ')).toBe('dnaa');
      expect(normalizeSymbol('\tdnaA\n')).toBe('dnaa');
    });

    it('should handle empty string', () => {
      expect(normalizeSymbol('')).toBe('');
      expect(normalizeSymbol('   ')).toBe('');
    });
  });

  describe('normalizeOrganism', () => {
    it('should convert to lowercase', () => {
      expect(normalizeOrganism('E. coli')).toBe('e. coli');
      expect(normalizeOrganism('Escherichia Coli')).toBe('escherichia coli');
      expect(normalizeOrganism('B. SUBTILIS')).toBe('b. subtilis');
    });

    it('should trim whitespace', () => {
      expect(normalizeOrganism('  E. coli  ')).toBe('e. coli');
    });
  });

  describe('getCacheKey', () => {
    it('should generate normalized cache key', () => {
      expect(getCacheKey('DnaA', 'E. coli')).toBe('gene_cache_dnaa_e. coli');
      expect(getCacheKey('recA', 'Bacillus subtilis')).toBe('gene_cache_reca_bacillus subtilis');
    });

    it('should use custom prefix', () => {
      expect(getCacheKey('dnaA', 'E. coli', 'custom_')).toBe('custom_dnaa_e. coli');
    });

    it('should handle case variations consistently', () => {
      const key1 = getCacheKey('DnaA', 'E. coli');
      const key2 = getCacheKey('dnaa', 'e. coli');
      const key3 = getCacheKey('DNAA', 'E. COLI');
      
      expect(key1).toBe(key2);
      expect(key2).toBe(key3);
    });
  });

  describe('isCacheValid', () => {
    it('should return true for recent cache', () => {
      const now = Date.now();
      expect(isCacheValid(now - 1000)).toBe(true); // 1 second ago
      expect(isCacheValid(now - 60000)).toBe(true); // 1 minute ago
      expect(isCacheValid(now - 3600000)).toBe(true); // 1 hour ago
    });

    it('should return false for expired cache (default 24h)', () => {
      const now = Date.now();
      const twentyFiveHoursAgo = now - 25 * 60 * 60 * 1000;
      expect(isCacheValid(twentyFiveHoursAgo)).toBe(false);
    });

    it('should respect custom duration', () => {
      const now = Date.now();
      const oneHourMs = 60 * 60 * 1000;
      
      // Cache from 30 minutes ago with 1 hour duration
      expect(isCacheValid(now - 30 * 60 * 1000, oneHourMs)).toBe(true);
      
      // Cache from 2 hours ago with 1 hour duration
      expect(isCacheValid(now - 2 * 60 * 60 * 1000, oneHourMs)).toBe(false);
    });
  });
});

describe('FunctionText Parsing Utilities', () => {
  describe('toSuperscript', () => {
    it('should convert single digits', () => {
      expect(toSuperscript(0)).toBe('⁰');
      expect(toSuperscript(1)).toBe('¹');
      expect(toSuperscript(2)).toBe('²');
      expect(toSuperscript(3)).toBe('³');
      expect(toSuperscript(4)).toBe('⁴');
      expect(toSuperscript(5)).toBe('⁵');
      expect(toSuperscript(6)).toBe('⁶');
      expect(toSuperscript(7)).toBe('⁷');
      expect(toSuperscript(8)).toBe('⁸');
      expect(toSuperscript(9)).toBe('⁹');
    });

    it('should convert multi-digit numbers', () => {
      expect(toSuperscript(10)).toBe('¹⁰');
      expect(toSuperscript(23)).toBe('²³');
      expect(toSuperscript(100)).toBe('¹⁰⁰');
      expect(toSuperscript(456)).toBe('⁴⁵⁶');
    });
  });

  describe('Gene Pattern Matching', () => {
    it('should match standard gene names (lowercase + uppercase)', () => {
      const testCases = [
        { text: 'The dnaA gene is essential', expected: 'dnaA' },
        { text: 'Regulated by recA protein', expected: 'recA' },
        { text: 'ftsZ is involved in cell division', expected: 'ftsZ' },
        { text: 'rpoB encodes RNA polymerase', expected: 'rpoB' },
      ];

      for (const { text, expected } of testCases) {
        GENE_PATTERN.lastIndex = 0;
        const match = GENE_PATTERN.exec(text);
        expect(match).not.toBeNull();
        expect(match![1]).toBe(expected);
      }
    });

    it('should match gene names with trailing numbers', () => {
      GENE_PATTERN.lastIndex = 0;
      const match = GENE_PATTERN.exec('trpA1 and trpB2 genes');
      expect(match).not.toBeNull();
      expect(match![1]).toBe('trpA1');
    });

    it('should not match regular words', () => {
      const text = 'The protein was isolated and purified';
      GENE_PATTERN.lastIndex = 0;
      const match = GENE_PATTERN.exec(text);
      expect(match).toBeNull();
    });

    it('should not match all-uppercase or all-lowercase', () => {
      const tests = ['DNAA', 'dnaa', 'RECA', 'reca'];
      for (const text of tests) {
        GENE_PATTERN.lastIndex = 0;
        const match = GENE_PATTERN.exec(text);
        expect(match).toBeNull();
      }
    });
  });

  describe('parseText - PubMed References', () => {
    it('should extract single PubMed reference', () => {
      const text = 'DnaA initiates replication (PubMed: 12345678)';
      const { references } = parseText(text);
      
      expect(references).toHaveLength(1);
      expect(references[0].pubmedId).toBe('12345678');
      expect(references[0].index).toBe(1);
    });

    it('should extract multiple PubMed references', () => {
      const text = 'DnaA initiates replication (PubMed: 12345678, PubMed: 87654321)';
      const { references } = parseText(text);
      
      expect(references).toHaveLength(2);
      expect(references[0].pubmedId).toBe('12345678');
      expect(references[1].pubmedId).toBe('87654321');
    });

    it('should handle PubMed references in different formats', () => {
      const formats = [
        'PubMed: 12345678',
        'PubMed:12345678',
        'PubMed 12345678',
        '(PubMed: 12345678)',
      ];

      for (const format of formats) {
        const { references } = parseText(`Test text ${format}`);
        expect(references).toHaveLength(1);
        expect(references[0].pubmedId).toBe('12345678');
      }
    });

    it('should deduplicate same PubMed IDs', () => {
      const text = 'First mention (PubMed: 12345678) and second mention (PubMed: 12345678)';
      const { references } = parseText(text);
      
      expect(references).toHaveLength(1);
      expect(references[0].pubmedId).toBe('12345678');
    });

    it('should extract multiple PubMed IDs from repeated PubMed markers', () => {
      const text = 'Multiple refs (PubMed: 12345678, PubMed: 23456789, PubMed: 34567890)';
      const { references } = parseText(text);
      expect(references).toHaveLength(3);
      expect(references.map(r => r.pubmedId)).toEqual(['12345678', '23456789', '34567890']);
    });

    it('should preserve text while removing the literal "PubMed" marker', () => {
      const text = 'Alpha (PubMed: 12345678), Beta.';
      const { segments } = parseText(text);
      const joined = segments.map(s => s.content).join('');
      expect(joined).toContain('Alpha');
      expect(joined).toContain('Beta');
      expect(joined.toLowerCase()).not.toContain('pubmed');
    });

    it('should create reference segments with superscript', () => {
      const text = 'DnaA initiates replication (PubMed: 12345678)';
      const { segments } = parseText(text);
      
      const refSegment = segments.find(s => s.type === 'ref');
      expect(refSegment).toBeDefined();
      expect(refSegment!.content).toBe('¹');
      expect(refSegment!.refIndex).toBe(1);
    });

    it('should handle no PubMed references', () => {
      const text = 'Simple text without references';
      const { references, segments } = parseText(text);
      
      expect(references).toHaveLength(0);
      expect(segments).toHaveLength(1);
      expect(segments[0].type).toBe('text');
    });
  });

  describe('parseText - Gene Names', () => {
    it('should detect gene names in text', () => {
      const text = 'The dnaA gene interacts with recA protein';
      const { segments } = parseText(text);
      
      const geneSegments = segments.filter(s => s.type === 'gene');
      expect(geneSegments).toHaveLength(2);
      expect(geneSegments[0].geneName).toBe('dnaA');
      expect(geneSegments[1].geneName).toBe('recA');
    });

    it('should preserve surrounding text', () => {
      const text = 'The dnaA gene is important';
      const { segments } = parseText(text);
      
      expect(segments[0].type).toBe('text');
      expect(segments[0].content).toBe('The ');
      expect(segments[1].type).toBe('gene');
      expect(segments[2].type).toBe('text');
      expect(segments[2].content).toBe(' gene is important');
    });

    it('should not detect gene-like patterns with unknown prefixes', () => {
      // 'zzZ' has prefix 'zz' which is not in KNOWN_GENE_PREFIXES
      const text = 'The zzZ gene is unknown';
      const { segments } = parseText(text);
      
      const geneSegments = segments.filter(s => s.type === 'gene');
      expect(geneSegments).toHaveLength(0);
    });
  });

  describe('parseText - Combined', () => {
    it('should handle text with both genes and references', () => {
      const text = 'The dnaA gene initiates replication (PubMed: 12345678) and interacts with recA';
      const { segments, references } = parseText(text);
      
      expect(references).toHaveLength(1);
      
      const geneSegments = segments.filter(s => s.type === 'gene');
      expect(geneSegments.length).toBeGreaterThanOrEqual(2);
      
      const refSegments = segments.filter(s => s.type === 'ref');
      expect(refSegments).toHaveLength(1);
    });

    it('should handle complex scientific text', () => {
      const text = 'DnaA binds to oriC and recruits the helicase dnaB (PubMed: 11111111). The recA protein is also involved (PubMed: 22222222).';
      const { segments, references } = parseText(text);
      
      expect(references).toHaveLength(2);
      expect(references[0].pubmedId).toBe('11111111');
      expect(references[1].pubmedId).toBe('22222222');
      
      // Should have gene segments for dnaB and recA
      const geneNames = segments.filter(s => s.type === 'gene').map(s => s.geneName);
      expect(geneNames).toContain('dnaB');
      expect(geneNames).toContain('recA');
    });

    it('should return plain text if no special elements', () => {
      const text = 'This is just regular text without any special formatting.';
      const { segments, references } = parseText(text);
      
      expect(references).toHaveLength(0);
      expect(segments).toHaveLength(1);
      expect(segments[0].type).toBe('text');
      expect(segments[0].content).toBe(text);
    });

    it('should keep stable reference numbering by first appearance', () => {
      const text = 'Ref A (PubMed: 22222222) then Ref B (PubMed: 11111111)';
      const { references } = parseText(text);
      expect(references).toHaveLength(2);
      expect(references[0]).toMatchObject({ index: 1, pubmedId: '22222222' });
      expect(references[1]).toMatchObject({ index: 2, pubmedId: '11111111' });
    });
  });
});

describe('API Error Formatting', () => {
  describe('formatInvokeError', () => {
    it('should format 401 error', () => {
      const error = formatInvokeError('test-fn', { status: 401 });
      expect(error.message).toBe('Non autorisé (401). Reconnecte-toi puis réessaie.');
    });

    it('should format 401 error from context', () => {
      const error = formatInvokeError('test-fn', { context: { status: 401 } });
      expect(error.message).toBe('Non autorisé (401). Reconnecte-toi puis réessaie.');
    });

    it('should format 404 error with function name', () => {
      const error = formatInvokeError('gene-summary', { status: 404 });
      expect(error.message).toBe('Fonction gene-summary non déployée. Déploie-la sur Supabase.');
    });

    it('should format 422 error (not found)', () => {
      const error = formatInvokeError('gene-summary', { status: 422 });
      expect(error.message).toBe('Gène non trouvé. Vérifie le symbole.');
    });

    it('should format 502 error', () => {
      const error = formatInvokeError('test-fn', { status: 502 });
      expect(error.message).toBe('Erreur serveur (502). Réessaie dans quelques secondes.');
    });

    it('should format generic error with message', () => {
      const error = formatInvokeError('test-fn', { message: 'Something went wrong' });
      expect(error.message).toBe('Erreur: Something went wrong');
    });

    it('should handle string error', () => {
      const error = formatInvokeError('test-fn', 'String error');
      expect(error.message).toBe('Erreur: String error');
    });

    it('should handle undefined error', () => {
      const error = formatInvokeError('test-fn', undefined);
      expect(error.message).toBe('Erreur: undefined');
    });
  });
});
