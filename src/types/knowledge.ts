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
  authors?: string;          // Formatted: "Smith J., Doe A., ..."
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

/**
 * Get first author's last name from article
 */
export function getFirstAuthorLastName(article: Article): string | null {
  if (!article.authors) return null;
  
  // Parse "LastName FirstInitial., ..." or "LastName, FirstName, ..."
  const firstAuthor = article.authors.split(',')[0].trim();
  
  // Extract last name (before any initial or space)
  const parts = firstAuthor.split(' ');
  return parts[0] || null;
}

/**
 * Generate citation tag for article (e.g., "Smith 2024")
 */
export function getArticleCitationTag(article: Article): string {
  const firstName = getFirstAuthorLastName(article);
  const year = article.year;
  
  if (firstName && year) {
    return `${firstName} ${year}`;
  } else if (firstName) {
    return firstName;
  } else if (year) {
    return `Article ${year}`;
  }
  return article.title.substring(0, 20);
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
  /** Linked researchers (from article_researchers table) */
  linkedResearchers?: (Researcher & { author_position?: number; is_corresponding?: boolean })[];
  genes?: { gene_symbol: string; organism: string }[];
}

export interface ConferenceWithRelations extends Conference {
  participants?: (Researcher & { role?: string })[];
  articles?: Article[];
  genes?: { gene_symbol: string; organism: string }[];
}
