/**
 * Inbox Conversion Service
 * Convert inbox items to Articles, Notes, etc.
 */

import { fetchPubMedArticle, formatAuthors, type PubMedArticle } from '../pubmed';
import { fetchArticleFromDoi } from '../crossref';
import { createArticle, linkArticleToResearcher } from '../knowledge';
import { createNoteForEntity } from '../knowledge/notes.service';
import { markAsConverted, getInboxItem } from './inbox.service';
import type { InboxItem, ConversionResult, InboxConvertedEntityType } from '../../types/inbox';
import type { ArticleInsert } from '../../types/knowledge';

// ============ Types ============

export interface ConvertToPmidOptions {
  /** Link to existing researchers by name matching */
  autoLinkAuthors?: boolean;
  /** Add inbox note as article note */
  includeNote?: boolean;
  /** Add inbox tags to article */
  includeTags?: boolean;
}

export interface ConvertToNoteOptions {
  /** Entity to attach note to (optional - creates standalone note if not provided) */
  entityType?: 'gene' | 'researcher' | 'article' | 'conference';
  entityId?: string;
  /** Use inbox raw as note content */
  useRawAsContent?: boolean;
}

// ============ PMID → Article ============

/**
 * Convert inbox item with PMID to Article
 */
export async function convertPmidToArticle(
  inboxItemId: string,
  options: ConvertToPmidOptions = {}
): Promise<ConversionResult> {
  try {
    // Get inbox item
    const itemResult = await getInboxItem(inboxItemId);
    if (itemResult.error || !itemResult.data) {
      return {
        success: false,
        entityType: 'article',
        entityId: '',
        error: itemResult.error?.message || 'Item non trouvé',
      };
    }

    const item = itemResult.data;
    
    // Validate it's a PMID
    if (item.detected_type !== 'pmid') {
      return {
        success: false,
        entityType: 'article',
        entityId: '',
        error: 'Cet item n\'est pas un PMID',
      };
    }

    const pmid = item.normalized || item.raw;

    // Fetch from PubMed
    const fetchResult = await fetchPubMedArticle(pmid);
    if (!fetchResult.success || !fetchResult.article) {
      return {
        success: false,
        entityType: 'article',
        entityId: '',
        error: fetchResult.error || 'Impossible de récupérer l\'article',
      };
    }

    const pubmedArticle = fetchResult.article;

    // Build article data
    const articleData: ArticleInsert = {
      title: pubmedArticle.title,
      journal: pubmedArticle.journal || undefined,
      year: pubmedArticle.year || undefined,
      doi: pubmedArticle.doi || undefined,
      pmid: pubmedArticle.pmid,
      abstract: pubmedArticle.abstract || undefined,
      // Store additional metadata
      external_source: 'pubmed',
      external_id: pubmedArticle.pmid,
    };

    // Create article
    const article = await createArticle(articleData);

    // Mark inbox item as converted
    await markAsConverted(inboxItemId, 'article', article.id);

    return {
      success: true,
      entityType: 'article',
      entityId: article.id,
      title: article.title,
    };
  } catch (error: any) {
    return {
      success: false,
      entityType: 'article',
      entityId: '',
      error: error.message || 'Erreur lors de la conversion',
    };
  }
}

// ============ DOI → Article ============

/**
 * Convert inbox item with DOI to Article
 * Uses Crossref API for metadata
 */
export async function convertDoiToArticle(
  inboxItemId: string
): Promise<ConversionResult> {
  try {
    const itemResult = await getInboxItem(inboxItemId);
    if (itemResult.error || !itemResult.data) {
      return {
        success: false,
        entityType: 'article',
        entityId: '',
        error: itemResult.error?.message || 'Item non trouvé',
      };
    }

    const item = itemResult.data;
    const doi = item.normalized || item.raw;

    // Try to fetch from Crossref
    let articleData: ArticleInsert;
    try {
      const crossrefArticle = await fetchArticleFromDoi(doi);
      if (crossrefArticle) {
        // Use Crossref metadata
        articleData = {
          ...crossrefArticle,
          title: item.title || crossrefArticle.title, // User title takes precedence
        };
      } else {
        // DOI not found in Crossref, create placeholder
        articleData = {
          title: item.title || `Article DOI: ${doi}`,
          doi: doi,
          external_source: 'doi',
          external_id: doi,
        };
      }
    } catch (crossrefError) {
      // Crossref failed, create placeholder
      console.warn('Crossref fetch failed:', crossrefError);
      articleData = {
        title: item.title || `Article DOI: ${doi}`,
        doi: doi,
        external_source: 'doi',
        external_id: doi,
      };
    }

    const article = await createArticle(articleData);
    await markAsConverted(inboxItemId, 'article', article.id);

    return {
      success: true,
      entityType: 'article',
      entityId: article.id,
      title: article.title,
    };
  } catch (error: any) {
    return {
      success: false,
      entityType: 'article',
      entityId: '',
      error: error.message || 'Erreur lors de la conversion',
    };
  }
}

// ============ Text → Note ============

/**
 * Convert inbox text item to a Note
 */
export async function convertTextToNote(
  inboxItemId: string,
  options: ConvertToNoteOptions = {}
): Promise<ConversionResult> {
  try {
    const itemResult = await getInboxItem(inboxItemId);
    if (itemResult.error || !itemResult.data) {
      return {
        success: false,
        entityType: 'note',
        entityId: '',
        error: itemResult.error?.message || 'Item non trouvé',
      };
    }

    const item = itemResult.data;
    
    // Determine content
    const content = options.useRawAsContent 
      ? item.raw 
      : (item.note || item.raw);

    // For now, notes require an entity. If none provided, we'll need a standalone notes table
    // This is a limitation we'll address in a future update
    if (!options.entityType || !options.entityId) {
      return {
        success: false,
        entityType: 'note',
        entityId: '',
        error: 'Une note doit être attachée à une entité (gène, chercheur, article ou conférence)',
      };
    }

    // Create note
    const note = await createNoteForEntity(
      options.entityType,
      options.entityId,
      content
    );

    await markAsConverted(inboxItemId, 'note', note.id);

    return {
      success: true,
      entityType: 'note',
      entityId: note.id,
      title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
    };
  } catch (error: any) {
    return {
      success: false,
      entityType: 'note',
      entityId: '',
      error: error.message || 'Erreur lors de la conversion',
    };
  }
}

// ============ URL → Article (placeholder) ============

/**
 * Convert URL to Article (scrapes metadata - future implementation)
 */
export async function convertUrlToArticle(
  inboxItemId: string
): Promise<ConversionResult> {
  try {
    const itemResult = await getInboxItem(inboxItemId);
    if (itemResult.error || !itemResult.data) {
      return {
        success: false,
        entityType: 'article',
        entityId: '',
        error: itemResult.error?.message || 'Item non trouvé',
      };
    }

    const item = itemResult.data;
    const url = item.normalized || item.raw;

    // Create article with URL only
    const articleData: ArticleInsert = {
      title: item.title || `Article: ${new URL(url).hostname}`,
      url: url,
      external_source: 'url',
      external_id: url,
    };

    const article = await createArticle(articleData);
    await markAsConverted(inboxItemId, 'article', article.id);

    return {
      success: true,
      entityType: 'article',
      entityId: article.id,
      title: article.title,
    };
  } catch (error: any) {
    return {
      success: false,
      entityType: 'article',
      entityId: '',
      error: error.message || 'Erreur lors de la conversion',
    };
  }
}

// ============ Auto-convert ============

/**
 * Auto-convert inbox item based on detected type
 */
export async function autoConvertInboxItem(
  inboxItemId: string
): Promise<ConversionResult> {
  const itemResult = await getInboxItem(inboxItemId);
  if (itemResult.error || !itemResult.data) {
    return {
      success: false,
      entityType: 'article',
      entityId: '',
      error: itemResult.error?.message || 'Item non trouvé',
    };
  }

  const item = itemResult.data;

  switch (item.detected_type) {
    case 'pmid':
      return convertPmidToArticle(inboxItemId);
    case 'doi':
      return convertDoiToArticle(inboxItemId);
    case 'url':
      return convertUrlToArticle(inboxItemId);
    case 'text':
    default:
      return {
        success: false,
        entityType: 'note',
        entityId: '',
        error: 'Les notes texte nécessitent une entité cible. Utilisez le menu pour choisir où attacher cette note.',
      };
  }
}
