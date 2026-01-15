/**
 * Knowledge Base API - Facade
 * 
 * Re-exports all services for backward compatibility.
 * New code should import from specific services directly.
 * 
 * @example
 * // Legacy (still works)
 * import { listResearchers, createArticle } from '@/lib/knowledge';
 * 
 * // Recommended
 * import { listResearchers } from '@/lib/knowledge/researchers.service';
 * import { createArticle } from '@/lib/knowledge/articles.service';
 */

// Researchers
export {
  listResearchers,
  getResearcher,
  createResearcher,
  updateResearcher,
  deleteResearcher,
  getResearchersForGene,
  linkGeneToResearcher,
  unlinkGeneFromResearcher,
  linkResearcherCollaborator,
  unlinkResearcherCollaborator,
  importResearcherFromCard,
} from './researchers.service';

// Articles
export {
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  getArticlesForGene,
  linkArticleToResearcher,
  unlinkArticleFromResearcher,
  linkGeneToArticle,
} from './articles.service';

// Conferences
export {
  listConferences,
  getConference,
  createConference,
  updateConference,
  deleteConference,
  linkConferenceToResearcher,
  unlinkConferenceFromResearcher,
  linkGeneToConference,
  linkArticleToConference,
} from './conferences.service';

// Notes
export {
  listNotesForEntity,
  createNote,
  updateNote,
  deleteNote,
  listAllNotes,
  createNoteForEntity,
  getNotesCountByEntityType,
} from './notes.service';

// Tags
export {
  listTags,
  createTag,
  getOrCreateTag,
  getOrCreateTagWithData,
  getOrCreateEntityTag,
  deleteTag,
  getNotesForTag,
  addTagToNote,
  removeTagFromNote,
  getTagsWithCounts,
} from './tags.service';

// Search
export {
  searchAll,
  searchResearchers,
  searchArticles,
  searchConferences,
  searchWithFilters,
} from './search.service';

// Re-export types
export type { SearchResult, SearchFilter } from './search.service';
