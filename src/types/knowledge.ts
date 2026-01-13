/**
 * Knowledge Base Types
 * Types for researchers, articles, conferences, notes, and tags
 */

// ============ Researcher ============

export interface Researcher {
  id: string;
  name: string;
  institution?: string;
  city?: string;
  country?: string;
  email?: string;
  specialization?: string;
  orcid?: string;
  created_at: string;
  updated_at: string;
}

export type ResearcherInsert = Omit<Researcher, 'id' | 'created_at' | 'updated_at'>;
export type ResearcherUpdate = Partial<ResearcherInsert>;

// ============ Article ============

export interface Article {
  id: string;
  title: string;
  journal?: string;
  year?: number;
  doi?: string;
  pmid?: string;
  url?: string;
  abstract?: string;
  external_source?: string; // 'pubmed' | 'doi' | 'url' | 'manual'
  external_id?: string;
  created_at: string;
  updated_at: string;
}

export type ArticleInsert = Omit<Article, 'id' | 'created_at' | 'updated_at'>;
export type ArticleUpdate = Partial<ArticleInsert>;

// ============ Conference ============

export interface Conference {
  id: string;
  name: string;
  date?: string;
  end_date?: string;
  location?: string;
  city?: string;
  country?: string;
  website?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export type ConferenceInsert = Omit<Conference, 'id' | 'created_at' | 'updated_at'>;
export type ConferenceUpdate = Partial<ConferenceInsert>;

// ============ Tag ============

export interface Tag {
  id: string;
  user_id: string;           // Owner of the tag (private per user)
  name: string;
  color?: string;
  entity_type?: EntityType | null;  // If set, tag links to an entity
  entity_id?: string | null;        // ID of the linked entity
  created_at: string;
}

export type TagInsert = Omit<Tag, 'id' | 'user_id' | 'created_at'>;

// ============ Note ============

export type EntityType = 'gene' | 'researcher' | 'article' | 'conference';

export interface EntityNote {
  id: string;
  user_id: string;
  entity_type: EntityType;
  entity_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  // Joined data
  tags?: Tag[];
  // Flag: true if this note appears via a tag link (not native to this entity)
  isLinkedViaTag?: boolean;
}

export type EntityNoteInsert = Omit<EntityNote, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'tags'>;
export type EntityNoteUpdate = Partial<Pick<EntityNote, 'content'>>;

// ============ Relations ============

export interface GeneResearcher {
  id: string;
  gene_symbol: string;
  organism: string;
  researcher_id: string;
  role?: string;
  created_at: string;
  // Joined
  researcher?: Researcher;
}

export interface GeneArticle {
  id: string;
  gene_symbol: string;
  organism: string;
  article_id: string;
  created_at: string;
  // Joined
  article?: Article;
}

export interface ArticleResearcher {
  id: string;
  article_id: string;
  researcher_id: string;
  author_position?: number;
  is_corresponding?: boolean;
  created_at: string;
  // Joined
  researcher?: Researcher;
}

export interface ConferenceResearcher {
  id: string;
  conference_id: string;
  researcher_id: string;
  role?: string;
  created_at: string;
  // Joined
  researcher?: Researcher;
}

// ============ With Relations (for detail screens) ============

export interface ResearcherWithRelations extends Researcher {
  genes?: { gene_symbol: string; organism: string; role?: string }[];
  articles?: Article[];
  conferences?: Conference[];
}

export interface ArticleWithRelations extends Article {
  authors?: (Researcher & { author_position?: number; is_corresponding?: boolean })[];
  genes?: { gene_symbol: string; organism: string }[];
}

export interface ConferenceWithRelations extends Conference {
  participants?: (Researcher & { role?: string })[];
  articles?: Article[];
  genes?: { gene_symbol: string; organism: string }[];
}
