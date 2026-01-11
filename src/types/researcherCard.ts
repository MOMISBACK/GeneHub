/**
 * Researcher Card Types
 * Payload format for QR code sharing
 */

/**
 * Researcher Card payload v1
 * Contains profile data to share via QR code
 */
export interface ResearcherCardV1 {
  v: 1;
  type: 'researcher_card';
  issued_at: string; // ISO date
  profile: {
    name: string; // required, max 120 chars
    institution?: string | null;
    email?: string | null;
    orcid?: string | null;
    url?: string | null; // personal/lab page
    keywords?: string[]; // max 12 items, each max 32 chars
  };
}

/**
 * Options for building a researcher card
 */
export interface ResearcherCardOptions {
  includeInstitution?: boolean;
  includeEmail?: boolean;
  includeOrcid?: boolean;
  includeUrl?: boolean;
  includeKeywords?: boolean;
}

/**
 * Profile data source (from ProfileScreen or DB)
 */
export interface ProfileData {
  name: string;
  institution?: string | null;
  email?: string | null;
  orcid?: string | null;
  url?: string | null;
  keywords?: string[];
}

/**
 * Validation result
 */
export type ValidationResult = 
  | { ok: true }
  | { ok: false; error: string; details?: string };

/**
 * Merge result
 */
export type MergeResult = 
  | { action: 'created'; researcher: { id: string; name: string } }
  | { action: 'updated'; researcher: { id: string; name: string }; conflicts?: string[] }
  | { action: 'error'; error: string };
