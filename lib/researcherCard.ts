/**
 * Researcher Card Service
 * Build, parse, and validate researcher card payloads for QR sharing
 */

import type {
  ResearcherCardV1,
  ResearcherCardOptions,
  ProfileData,
  ValidationResult,
} from '../types/researcherCard';

export type { ResearcherCardOptions };

// ============================================================================
// Constants
// ============================================================================

const MAX_NAME_LENGTH = 120;
const MAX_KEYWORDS = 12;
const MAX_KEYWORD_LENGTH = 32;
const MAX_QR_PAYLOAD_SIZE = 2000; // Approximate safe limit for QR codes

// ============================================================================
// Normalization Helpers
// ============================================================================

/**
 * Normalize email (lowercase, trim)
 */
export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const normalized = email.toLowerCase().trim();
  // Basic validation
  if (!normalized.includes('@') || normalized.length < 5) return null;
  return normalized;
}

/**
 * Normalize ORCID (remove spaces, dashes variations, validate format)
 * ORCID format: 0000-0000-0000-000X (16 digits with optional X at end)
 */
export function normalizeOrcid(orcid: string | null | undefined): string | null {
  if (!orcid) return null;
  
  // Remove common prefixes and clean
  let cleaned = orcid
    .replace(/https?:\/\/orcid\.org\//i, '')
    .replace(/orcid\.org\//i, '')
    .replace(/orcid:/i, '')
    .replace(/\s+/g, '')
    .toUpperCase();
  
  // Extract digits and X
  const digits = cleaned.replace(/[^0-9X]/gi, '');
  
  // Must be 16 characters
  if (digits.length !== 16) return null;
  
  // Format as XXXX-XXXX-XXXX-XXXX
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}-${digits.slice(12, 16)}`;
}

/**
 * Normalize URL (trim, ensure protocol)
 */
export function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  let normalized = url.trim();
  if (!normalized) return null;
  
  // Add https if no protocol
  if (!normalized.match(/^https?:\/\//i)) {
    normalized = `https://${normalized}`;
  }
  
  return normalized;
}

/**
 * Truncate and clean keywords
 */
export function normalizeKeywords(keywords: string[] | null | undefined): string[] {
  if (!keywords || !Array.isArray(keywords)) return [];
  
  return keywords
    .map(k => k.trim().slice(0, MAX_KEYWORD_LENGTH))
    .filter(k => k.length > 0)
    .slice(0, MAX_KEYWORDS);
}

// ============================================================================
// Build Card
// ============================================================================

/**
 * Build a researcher card payload from profile data
 */
export function buildResearcherCard(
  profile: ProfileData,
  options: ResearcherCardOptions = {}
): ResearcherCardV1 {
  const {
    includeInstitution = true,
    includeEmail = true,
    includeOrcid = true,
    includeUrl = true,
    includeKeywords = true,
  } = options;

  const card: ResearcherCardV1 = {
    v: 1,
    type: 'researcher_card',
    issued_at: new Date().toISOString(),
    profile: {
      name: (profile.name || '').trim().slice(0, MAX_NAME_LENGTH),
    },
  };

  // Add optional fields based on options
  if (includeInstitution && profile.institution) {
    card.profile.institution = profile.institution.trim() || null;
  }

  if (includeEmail && profile.email) {
    card.profile.email = normalizeEmail(profile.email);
  }

  if (includeOrcid && profile.orcid) {
    card.profile.orcid = normalizeOrcid(profile.orcid);
  }

  if (includeUrl && profile.url) {
    card.profile.url = normalizeUrl(profile.url);
  }

  if (includeKeywords && profile.keywords && profile.keywords.length > 0) {
    card.profile.keywords = normalizeKeywords(profile.keywords);
  }

  return card;
}

/**
 * Serialize card to JSON string, optionally truncating to fit QR limits
 */
export function serializeCard(card: ResearcherCardV1, maxSize: number = MAX_QR_PAYLOAD_SIZE): string {
  let json = JSON.stringify(card);
  
  // If fits, return as is
  if (json.length <= maxSize) {
    return json;
  }
  
  // Try removing keywords progressively
  const reduced = { ...card, profile: { ...card.profile } };
  
  if (reduced.profile.keywords && reduced.profile.keywords.length > 0) {
    // Remove keywords one by one
    while (reduced.profile.keywords.length > 0) {
      reduced.profile.keywords = reduced.profile.keywords.slice(0, -1);
      json = JSON.stringify(reduced);
      if (json.length <= maxSize) return json;
    }
    delete reduced.profile.keywords;
    json = JSON.stringify(reduced);
    if (json.length <= maxSize) return json;
  }
  
  // Remove optional fields in order
  const optionalFields: (keyof typeof reduced.profile)[] = ['url', 'orcid', 'institution'];
  for (const field of optionalFields) {
    if (reduced.profile[field]) {
      delete reduced.profile[field];
      json = JSON.stringify(reduced);
      if (json.length <= maxSize) return json;
    }
  }
  
  // Last resort: truncate name
  if (reduced.profile.name.length > 50) {
    reduced.profile.name = reduced.profile.name.slice(0, 50) + '...';
  }
  
  return JSON.stringify(reduced);
}

// ============================================================================
// Parse Card
// ============================================================================

/**
 * Parse a researcher card from JSON string
 * @throws Error if parsing fails
 */
export function parseResearcherCard(input: string): ResearcherCardV1 {
  let parsed: unknown;
  
  try {
    parsed = JSON.parse(input.trim());
  } catch (e) {
    throw new Error('Format JSON invalide');
  }
  
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Le payload doit être un objet JSON');
  }
  
  const obj = parsed as Record<string, unknown>;
  
  // Validate required fields
  if (obj.v !== 1) {
    throw new Error(`Version non supportée: ${obj.v}`);
  }
  
  if (obj.type !== 'researcher_card') {
    throw new Error(`Type invalide: ${obj.type}`);
  }
  
  if (!obj.profile || typeof obj.profile !== 'object') {
    throw new Error('Profil manquant');
  }
  
  const profile = obj.profile as Record<string, unknown>;
  
  if (!profile.name || typeof profile.name !== 'string' || !profile.name.trim()) {
    throw new Error('Nom requis');
  }
  
  // Build validated card
  const card: ResearcherCardV1 = {
    v: 1,
    type: 'researcher_card',
    issued_at: typeof obj.issued_at === 'string' ? obj.issued_at : new Date().toISOString(),
    profile: {
      name: profile.name.trim().slice(0, MAX_NAME_LENGTH),
    },
  };
  
  // Add optional fields if present and valid
  if (typeof profile.institution === 'string' && profile.institution.trim()) {
    card.profile.institution = profile.institution.trim();
  }
  
  if (typeof profile.email === 'string') {
    card.profile.email = normalizeEmail(profile.email);
  }
  
  if (typeof profile.orcid === 'string') {
    card.profile.orcid = normalizeOrcid(profile.orcid);
  }
  
  if (typeof profile.url === 'string') {
    card.profile.url = normalizeUrl(profile.url);
  }
  
  if (Array.isArray(profile.keywords)) {
    const keywords = profile.keywords
      .filter((k): k is string => typeof k === 'string')
      .map(k => k.trim().slice(0, MAX_KEYWORD_LENGTH))
      .filter(k => k.length > 0)
      .slice(0, MAX_KEYWORDS);
    
    if (keywords.length > 0) {
      card.profile.keywords = keywords;
    }
  }
  
  return card;
}

// ============================================================================
// Validate Card
// ============================================================================

/**
 * Validate a researcher card object
 */
export function validateResearcherCard(card: unknown): ValidationResult {
  if (!card || typeof card !== 'object') {
    return { ok: false, error: 'Payload invalide', details: 'Le payload doit être un objet' };
  }
  
  const obj = card as Record<string, unknown>;
  
  if (obj.v !== 1) {
    return { ok: false, error: 'Version non supportée', details: `Version: ${obj.v}` };
  }
  
  if (obj.type !== 'researcher_card') {
    return { ok: false, error: 'Type invalide', details: `Type: ${obj.type}` };
  }
  
  if (!obj.profile || typeof obj.profile !== 'object') {
    return { ok: false, error: 'Profil manquant' };
  }
  
  const profile = obj.profile as Record<string, unknown>;
  
  if (!profile.name || typeof profile.name !== 'string' || !profile.name.trim()) {
    return { ok: false, error: 'Nom requis', details: 'Le champ name est obligatoire' };
  }
  
  if (profile.name.length > MAX_NAME_LENGTH) {
    return { ok: false, error: 'Nom trop long', details: `Max ${MAX_NAME_LENGTH} caractères` };
  }
  
  // Optional field validations
  if (profile.email !== undefined && profile.email !== null && typeof profile.email !== 'string') {
    return { ok: false, error: 'Email invalide', details: 'Le champ email doit être une chaîne' };
  }
  
  if (profile.keywords !== undefined && !Array.isArray(profile.keywords)) {
    return { ok: false, error: 'Keywords invalides', details: 'Le champ keywords doit être un tableau' };
  }
  
  if (Array.isArray(profile.keywords) && profile.keywords.length > MAX_KEYWORDS) {
    return { ok: false, error: 'Trop de keywords', details: `Max ${MAX_KEYWORDS} keywords` };
  }
  
  return { ok: true };
}

/**
 * Try to parse and validate a string, returning a safe result
 */
export function tryParseCard(input: string): { ok: true; card: ResearcherCardV1 } | { ok: false; error: string; details?: string } {
  try {
    const card = parseResearcherCard(input);
    const validation = validateResearcherCard(card);
    
    if (!validation.ok) {
      return validation;
    }
    
    return { ok: true, card };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur de parsing',
      details: e instanceof Error ? e.stack : undefined,
    };
  }
}
