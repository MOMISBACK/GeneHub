/**
 * Inbox module exports
 */

// Parser
export {
  detectInboxType,
  isPmid,
  isDoi,
  isUrl,
  extractPmid,
  extractDoi,
  getTypeLabel,
  getTypeColor,
} from './parse';

// Service
export {
  createInboxItem,
  listInboxItems,
  listActiveInbox,
  getInboxItem,
  countInboxByStatus,
  updateInboxItem,
  archiveInboxItem,
  restoreInboxItem,
  markAsConverted,
  addNoteToInboxItem,
  updateInboxTags,
  deleteInboxItem,
  purgeArchivedItems,
  searchInboxItems,
} from './inbox.service';

export type { InboxServiceResult, InboxListOptions } from './inbox.service';

// Conversion
export {
  convertPmidToArticle,
  convertDoiToArticle,
  convertTextToNote,
  convertUrlToArticle,
  autoConvertInboxItem,
} from './convert';

export type { ConvertToPmidOptions, ConvertToNoteOptions } from './convert';
