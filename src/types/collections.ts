/**
 * Collection Types
 */

export type CollectionEntityType = 'gene' | 'researcher' | 'article' | 'conference';

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  position: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  // Computed
  item_count?: number;
}

export type CollectionInsert = Omit<Collection, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'item_count'>;
export type CollectionUpdate = Partial<Pick<Collection, 'name' | 'description' | 'color' | 'icon' | 'position' | 'is_pinned'>>;

export interface CollectionItem {
  id: string;
  user_id: string;
  collection_id: string;
  entity_type: CollectionEntityType;
  entity_id: string;
  display_name?: string;
  note?: string;
  position: number;
  created_at: string;
  // Joined data (optional)
  collection?: Collection;
}

export type CollectionItemInsert = Pick<CollectionItem, 'collection_id' | 'entity_type' | 'entity_id'> & 
  Partial<Pick<CollectionItem, 'display_name' | 'note'>>;

/**
 * Default collection colors
 */
export const COLLECTION_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#3b82f6', // Blue
  '#64748b', // Slate
] as const;

/**
 * Default collection icons
 */
export const COLLECTION_ICONS = [
  'folder',
  'star',
  'bookmark',
  'flag',
  'heart',
  'lightning',
  'beaker',
  'book',
] as const;
