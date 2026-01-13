/**
 * Inbox Types
 * Types for the quick capture inbox feature
 */

// ============ Status ============

export type InboxStatus = 'inbox' | 'archived' | 'converted';

// ============ Detected Types ============

export type InboxDetectedType = 'pmid' | 'doi' | 'url' | 'text';

// ============ Converted Entity Types ============

export type InboxConvertedEntityType = 'article' | 'note' | 'researcher' | 'conference';

// ============ Main Entity ============

export interface InboxItem {
  id: string;
  user_id: string;
  status: InboxStatus;
  raw: string;
  detected_type: InboxDetectedType | null;
  normalized: string | null;
  title: string | null;
  note: string | null;
  source_url: string | null;
  tags: string[];
  converted_entity_type: InboxConvertedEntityType | null;
  converted_entity_id: string | null;
  created_at: string;
  updated_at: string;
}

// ============ Insert/Update Types ============

export type InboxItemInsert = {
  raw: string;
  user_id: string;
  detected_type?: InboxDetectedType | null;
  normalized?: string | null;
  title?: string | null;
  note?: string | null;
  source_url?: string | null;
  tags?: string[];
};

export type InboxItemUpdate = Partial<Omit<InboxItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

// ============ Parse Result ============

export interface ParseResult {
  type: InboxDetectedType;
  normalized: string;
  /** Original matched portion */
  match: string;
}

// ============ Conversion Result ============

export interface ConversionResult {
  success: boolean;
  entityType: InboxConvertedEntityType;
  entityId: string;
  title?: string;
  error?: string;
}
