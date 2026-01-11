/**
 * Researcher Card Tests
 * Tests for QR code payload building, parsing, validation
 */

import {
  normalizeEmail,
  normalizeOrcid,
  normalizeUrl,
  normalizeKeywords,
  buildResearcherCard,
  serializeCard,
  parseResearcherCard,
  validateResearcherCard,
  tryParseCard,
} from '../../src/lib/researcherCard';
import type { ResearcherCardV1 } from '../../src/types/researcherCard';

describe('researcherCard', () => {
  // ============================================================================
  // Normalization helpers
  // ============================================================================
  
  describe('normalizeEmail', () => {
    it('should lowercase and trim email', () => {
      expect(normalizeEmail('  Test@Example.COM  ')).toBe('test@example.com');
    });

    it('should return null for invalid email', () => {
      expect(normalizeEmail('invalid')).toBeNull();
      expect(normalizeEmail('')).toBeNull();
      expect(normalizeEmail(null)).toBeNull();
      expect(normalizeEmail(undefined)).toBeNull();
    });

    it('should return null for too short email', () => {
      expect(normalizeEmail('a@b')).toBeNull();
    });
  });

  describe('normalizeOrcid', () => {
    it('should format valid ORCID', () => {
      expect(normalizeOrcid('0000-0002-1234-5678')).toBe('0000-0002-1234-5678');
    });

    it('should handle ORCID without dashes', () => {
      expect(normalizeOrcid('0000000212345678')).toBe('0000-0002-1234-5678');
    });

    it('should handle ORCID URL', () => {
      expect(normalizeOrcid('https://orcid.org/0000-0002-1234-5678')).toBe('0000-0002-1234-5678');
    });

    it('should handle ORCID with prefix', () => {
      expect(normalizeOrcid('ORCID:0000-0002-1234-5678')).toBe('0000-0002-1234-5678');
    });

    it('should handle ORCID ending with X', () => {
      expect(normalizeOrcid('0000-0002-1234-567X')).toBe('0000-0002-1234-567X');
    });

    it('should return null for invalid ORCID', () => {
      expect(normalizeOrcid('invalid')).toBeNull();
      expect(normalizeOrcid('0000-0002-1234')).toBeNull(); // Too short
      expect(normalizeOrcid('')).toBeNull();
      expect(normalizeOrcid(null)).toBeNull();
    });
  });

  describe('normalizeUrl', () => {
    it('should trim URL', () => {
      expect(normalizeUrl('  https://example.com  ')).toBe('https://example.com');
    });

    it('should add https if missing', () => {
      expect(normalizeUrl('example.com')).toBe('https://example.com');
    });

    it('should keep http if provided', () => {
      expect(normalizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('should return null for empty', () => {
      expect(normalizeUrl('')).toBeNull();
      expect(normalizeUrl('   ')).toBeNull();
      expect(normalizeUrl(null)).toBeNull();
    });
  });

  describe('normalizeKeywords', () => {
    it('should trim and filter keywords', () => {
      expect(normalizeKeywords(['  bio  ', '', 'gene'])).toEqual(['bio', 'gene']);
    });

    it('should truncate keywords to max length', () => {
      const longKeyword = 'a'.repeat(50);
      const result = normalizeKeywords([longKeyword]);
      expect(result[0].length).toBe(32);
    });

    it('should limit to 12 keywords', () => {
      const keywords = Array(20).fill('keyword');
      expect(normalizeKeywords(keywords).length).toBe(12);
    });

    it('should handle null/undefined', () => {
      expect(normalizeKeywords(null)).toEqual([]);
      expect(normalizeKeywords(undefined)).toEqual([]);
    });
  });

  // ============================================================================
  // Build card
  // ============================================================================

  describe('buildResearcherCard', () => {
    it('should include required fields', () => {
      const card = buildResearcherCard({ name: 'Dr. Test' });
      
      expect(card.v).toBe(1);
      expect(card.type).toBe('researcher_card');
      expect(card.profile.name).toBe('Dr. Test');
      expect(card.issued_at).toBeDefined();
    });

    it('should include optional fields when present', () => {
      const card = buildResearcherCard({
        name: 'Dr. Test',
        institution: 'MIT',
        email: 'test@mit.edu',
        orcid: '0000-0002-1234-5678',
        url: 'https://lab.mit.edu',
        keywords: ['genetics', 'bacteria'],
      });
      
      expect(card.profile.institution).toBe('MIT');
      expect(card.profile.email).toBe('test@mit.edu');
      expect(card.profile.orcid).toBe('0000-0002-1234-5678');
      expect(card.profile.url).toBe('https://lab.mit.edu');
      expect(card.profile.keywords).toEqual(['genetics', 'bacteria']);
    });

    it('should respect options to exclude fields', () => {
      const card = buildResearcherCard(
        {
          name: 'Dr. Test',
          email: 'test@example.com',
          institution: 'MIT',
        },
        {
          includeEmail: false,
          includeInstitution: false,
        }
      );
      
      expect(card.profile.email).toBeUndefined();
      expect(card.profile.institution).toBeUndefined();
    });

    it('should truncate name to max length', () => {
      const longName = 'Dr. ' + 'A'.repeat(200);
      const card = buildResearcherCard({ name: longName });
      
      expect(card.profile.name.length).toBe(120);
    });
  });

  // ============================================================================
  // Serialize card
  // ============================================================================

  describe('serializeCard', () => {
    it('should serialize to JSON', () => {
      const card = buildResearcherCard({ name: 'Dr. Test' });
      const json = serializeCard(card);
      
      expect(() => JSON.parse(json)).not.toThrow();
      const parsed = JSON.parse(json);
      expect(parsed.profile.name).toBe('Dr. Test');
    });

    it('should truncate to fit size limit', () => {
      const card = buildResearcherCard({
        name: 'Dr. Test',
        keywords: Array(12).fill('verylongkeyword'),
      });
      
      // With a small limit, keywords should be removed
      const json = serializeCard(card, 200);
      const parsed = JSON.parse(json);
      
      expect(json.length).toBeLessThanOrEqual(200);
      // Keywords should be reduced or removed
      expect(parsed.profile.keywords?.length ?? 0).toBeLessThan(12);
    });
  });

  // ============================================================================
  // Parse card
  // ============================================================================

  describe('parseResearcherCard', () => {
    it('should parse valid JSON', () => {
      const input = JSON.stringify({
        v: 1,
        type: 'researcher_card',
        issued_at: '2024-01-01T00:00:00Z',
        profile: { name: 'Dr. Test' },
      });
      
      const card = parseResearcherCard(input);
      expect(card.profile.name).toBe('Dr. Test');
    });

    it('should throw on invalid JSON', () => {
      expect(() => parseResearcherCard('not json')).toThrow('Format JSON invalide');
    });

    it('should throw on missing version', () => {
      const input = JSON.stringify({
        type: 'researcher_card',
        profile: { name: 'Test' },
      });
      expect(() => parseResearcherCard(input)).toThrow('Version non supportée');
    });

    it('should throw on wrong type', () => {
      const input = JSON.stringify({
        v: 1,
        type: 'wrong_type',
        profile: { name: 'Test' },
      });
      expect(() => parseResearcherCard(input)).toThrow('Type invalide');
    });

    it('should throw on missing name', () => {
      const input = JSON.stringify({
        v: 1,
        type: 'researcher_card',
        profile: {},
      });
      expect(() => parseResearcherCard(input)).toThrow('Nom requis');
    });

    it('should normalize optional fields', () => {
      const input = JSON.stringify({
        v: 1,
        type: 'researcher_card',
        profile: {
          name: 'Test',
          email: 'TEST@EXAMPLE.COM',
          orcid: 'https://orcid.org/0000-0002-1234-5678',
        },
      });
      
      const card = parseResearcherCard(input);
      expect(card.profile.email).toBe('test@example.com');
      expect(card.profile.orcid).toBe('0000-0002-1234-5678');
    });
  });

  // ============================================================================
  // Validate card
  // ============================================================================

  describe('validateResearcherCard', () => {
    it('should validate correct card', () => {
      const card: ResearcherCardV1 = {
        v: 1,
        type: 'researcher_card',
        issued_at: new Date().toISOString(),
        profile: { name: 'Dr. Test' },
      };
      
      const result = validateResearcherCard(card);
      expect(result.ok).toBe(true);
    });

    it('should reject invalid version', () => {
      const result = validateResearcherCard({ v: 2, type: 'researcher_card', profile: { name: 'Test' } });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Version');
      }
    });

    it('should reject invalid type', () => {
      const result = validateResearcherCard({ v: 1, type: 'other', profile: { name: 'Test' } });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Type');
      }
    });

    it('should reject missing name', () => {
      const result = validateResearcherCard({ v: 1, type: 'researcher_card', profile: {} });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Nom');
      }
    });

    it('should reject too many keywords', () => {
      const result = validateResearcherCard({
        v: 1,
        type: 'researcher_card',
        profile: { name: 'Test', keywords: Array(20).fill('kw') },
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('keywords');
      }
    });
  });

  // ============================================================================
  // Try parse (safe)
  // ============================================================================

  describe('tryParseCard', () => {
    it('should return card on success', () => {
      const input = JSON.stringify({
        v: 1,
        type: 'researcher_card',
        profile: { name: 'Test' },
      });
      
      const result = tryParseCard(input);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.card.profile.name).toBe('Test');
      }
    });

    it('should return error on failure', () => {
      const result = tryParseCard('invalid');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeDefined();
      }
    });
  });

  // ============================================================================
  // Edge cases & integration scenarios
  // ============================================================================

  describe('edge cases', () => {
    it('should handle card with all optional fields', () => {
      const card = buildResearcherCard({
        name: 'Dr. Complete',
        institution: 'MIT',
        email: 'complete@mit.edu',
        orcid: '0000-0002-1234-5678',
        url: 'https://lab.mit.edu/complete',
        keywords: ['genomics', 'CRISPR', 'bacteria'],
      });
      
      expect(card.profile.name).toBe('Dr. Complete');
      expect(card.profile.institution).toBe('MIT');
      expect(card.profile.email).toBe('complete@mit.edu');
      expect(card.profile.orcid).toBe('0000-0002-1234-5678');
      expect(card.profile.url).toBe('https://lab.mit.edu/complete');
      expect(card.profile.keywords).toEqual(['genomics', 'CRISPR', 'bacteria']);
    });

    it('should handle card with minimal fields', () => {
      const card = buildResearcherCard({ name: 'J. Doe' });
      
      expect(card.profile.name).toBe('J. Doe');
      expect(card.profile.email).toBeUndefined();
      expect(card.profile.institution).toBeUndefined();
      expect(card.profile.orcid).toBeUndefined();
      expect(card.profile.keywords).toBeUndefined();
    });

    it('should serialize and parse roundtrip', () => {
      const original = buildResearcherCard({
        name: 'Dr. Roundtrip',
        institution: 'Stanford',
        email: 'roundtrip@stanford.edu',
        keywords: ['biology'],
      });
      
      const json = serializeCard(original);
      const parsed = parseResearcherCard(json);
      
      expect(parsed.profile.name).toBe(original.profile.name);
      expect(parsed.profile.institution).toBe(original.profile.institution);
      expect(parsed.profile.email).toBe(original.profile.email);
      expect(parsed.profile.keywords).toEqual(original.profile.keywords);
    });

    it('should handle special characters in name', () => {
      const card = buildResearcherCard({
        name: 'Dr. María José García-López',
      });
      
      expect(card.profile.name).toBe('Dr. María José García-López');
      
      // Roundtrip
      const json = serializeCard(card);
      const parsed = parseResearcherCard(json);
      expect(parsed.profile.name).toBe('Dr. María José García-López');
    });

    it('should handle unicode in institution', () => {
      const card = buildResearcherCard({
        name: 'Dr. Test',
        institution: 'Université de Genève',
      });
      
      const json = serializeCard(card);
      const parsed = parseResearcherCard(json);
      expect(parsed.profile.institution).toBe('Université de Genève');
    });

    it('should validate issued_at is recent ISO date', () => {
      const card = buildResearcherCard({ name: 'Test' });
      const issuedDate = new Date(card.issued_at);
      const now = new Date();
      
      // Should be within last minute
      expect(now.getTime() - issuedDate.getTime()).toBeLessThan(60000);
    });

    it('should handle empty string fields as missing', () => {
      const card = buildResearcherCard({
        name: 'Test',
        email: '',
        institution: '   ',
      });
      
      // Empty/whitespace fields should be null or undefined
      expect(card.profile.email).toBeFalsy();
      expect(card.profile.institution).toBeFalsy();
    });
  });

  describe('privacy options', () => {
    it('should exclude all optional fields when all options are false', () => {
      const card = buildResearcherCard(
        {
          name: 'Dr. Private',
          email: 'private@test.com',
          institution: 'MIT',
          orcid: '0000-0002-1234-5678',
          url: 'https://example.com',
          keywords: ['private'],
        },
        {
          includeEmail: false,
          includeInstitution: false,
          includeOrcid: false,
          includeUrl: false,
          includeKeywords: false,
        }
      );
      
      expect(card.profile.name).toBe('Dr. Private');
      expect(card.profile.email).toBeUndefined();
      expect(card.profile.institution).toBeUndefined();
      expect(card.profile.orcid).toBeUndefined();
      expect(card.profile.url).toBeUndefined();
      expect(card.profile.keywords).toBeUndefined();
    });

    it('should include specific fields based on options', () => {
      const card = buildResearcherCard(
        {
          name: 'Dr. Selective',
          email: 'selective@test.com',
          institution: 'Stanford',
          orcid: '0000-0002-1234-5678',
        },
        {
          includeEmail: true,
          includeInstitution: false,
          includeOrcid: true,
        }
      );
      
      expect(card.profile.email).toBe('selective@test.com');
      expect(card.profile.institution).toBeUndefined();
      expect(card.profile.orcid).toBe('0000-0002-1234-5678');
    });

    it('should default to including all fields when options not specified', () => {
      const card = buildResearcherCard({
        name: 'Dr. Default',
        email: 'default@test.com',
        institution: 'Harvard',
      });
      
      expect(card.profile.email).toBe('default@test.com');
      expect(card.profile.institution).toBe('Harvard');
    });
  });

  describe('QR size constraints', () => {
    it('should produce JSON under 2KB for typical card', () => {
      const card = buildResearcherCard({
        name: 'Dr. Typical Researcher Name',
        institution: 'Massachusetts Institute of Technology',
        email: 'researcher@mit.edu',
        orcid: '0000-0002-1234-5678',
        url: 'https://researcher.mit.edu/profile',
        keywords: ['molecular biology', 'genetics', 'CRISPR'],
      });
      
      const json = serializeCard(card);
      expect(json.length).toBeLessThan(2048);
    });

    it('should truncate to fit QR alphanumeric limit', () => {
      // QR version 40 alphanumeric limit is ~4296 chars
      // But we target ~2KB for faster scanning
      const card = buildResearcherCard({
        name: 'A'.repeat(120),
        institution: 'B'.repeat(120),
        keywords: Array(12).fill('keyword123'),
      });
      
      const json = serializeCard(card, 1500);
      expect(json.length).toBeLessThanOrEqual(1500);
    });
  });

  describe('validation edge cases', () => {
    it('should reject card with future version', () => {
      const result = validateResearcherCard({
        v: 99,
        type: 'researcher_card',
        profile: { name: 'Test' },
      });
      expect(result.ok).toBe(false);
    });

    it('should reject card with version 0', () => {
      const result = validateResearcherCard({
        v: 0,
        type: 'researcher_card',
        profile: { name: 'Test' },
      });
      expect(result.ok).toBe(false);
    });

    it('should reject card with empty name', () => {
      const result = validateResearcherCard({
        v: 1,
        type: 'researcher_card',
        profile: { name: '' },
      });
      expect(result.ok).toBe(false);
    });

    it('should reject card with whitespace-only name', () => {
      const result = validateResearcherCard({
        v: 1,
        type: 'researcher_card',
        profile: { name: '   ' },
      });
      expect(result.ok).toBe(false);
    });

    it('should accept card with valid ORCID ending in X', () => {
      const result = validateResearcherCard({
        v: 1,
        type: 'researcher_card',
        profile: { name: 'Test', orcid: '0000-0002-1234-567X' },
      });
      expect(result.ok).toBe(true);
    });
  });
});
