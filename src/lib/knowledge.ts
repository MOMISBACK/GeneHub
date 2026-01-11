/**
 * Knowledge Base API
 * CRUD operations for researchers, articles, conferences, notes, and tags
 */

import { supabaseWithAuth } from './supabase';
import type {
  Researcher,
  ResearcherInsert,
  ResearcherUpdate,
  ResearcherWithRelations,
  Article,
  ArticleInsert,
  ArticleUpdate,
  ArticleWithRelations,
  Conference,
  ConferenceInsert,
  ConferenceUpdate,
  ConferenceWithRelations,
  Tag,
  TagInsert,
  EntityNote,
  EntityNoteInsert,
  EntityType,
} from '../types/knowledge';

// ============ Error Handling ============

function wrapError(action: string, error: unknown): Error {
  const code = String((error as any)?.code ?? '');
  const message = String((error as any)?.message ?? error);

  if (code === '42P01' || (message.includes('relation') && message.includes('does not exist'))) {
    return new Error(
      `Base de données non initialisée pour ${action}. Exécutez la migration 002_knowledge_base.sql dans Supabase.`
    );
  }

  return new Error(message);
}

// ============ Researchers ============

export async function listResearchers(): Promise<Researcher[]> {
  const { data, error } = await supabaseWithAuth
    .from('researchers')
    .select('*')
    .order('name');

  if (error) throw wrapError('chercheurs', error);
  return data ?? [];
}

export async function getResearcher(id: string): Promise<ResearcherWithRelations | null> {
  const { data, error } = await supabaseWithAuth
    .from('researchers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw wrapError('chercheur', error);
  }

  // Get related genes
  const { data: geneRels } = await supabaseWithAuth
    .from('gene_researchers')
    .select('gene_symbol, organism, role')
    .eq('researcher_id', id);

  // Get related articles
  const { data: articleRels } = await supabaseWithAuth
    .from('article_researchers')
    .select('article:articles(*)')
    .eq('researcher_id', id);

  // Get related conferences
  const { data: confRels } = await supabaseWithAuth
    .from('conference_researchers')
    .select('conference:conferences(*)')
    .eq('researcher_id', id);

  return {
    ...data,
    genes: geneRels ?? [],
    articles: articleRels?.map((r: any) => r.article).filter(Boolean) ?? [],
    conferences: confRels?.map((r: any) => r.conference).filter(Boolean) ?? [],
  };
}

export async function createResearcher(researcher: ResearcherInsert): Promise<Researcher> {
  const { data, error } = await supabaseWithAuth
    .from('researchers')
    .insert(researcher)
    .select()
    .single();

  if (error) throw wrapError('création chercheur', error);
  return data;
}

export async function updateResearcher(id: string, updates: ResearcherUpdate): Promise<Researcher> {
  const { data, error } = await supabaseWithAuth
    .from('researchers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw wrapError('mise à jour chercheur', error);
  return data;
}

export async function deleteResearcher(id: string): Promise<void> {
  const { error } = await supabaseWithAuth
    .from('researchers')
    .delete()
    .eq('id', id);

  if (error) throw wrapError('suppression chercheur', error);
}

// ============ Articles ============

export async function listArticles(): Promise<Article[]> {
  const { data, error } = await supabaseWithAuth
    .from('articles')
    .select('*')
    .order('year', { ascending: false });

  if (error) throw wrapError('articles', error);
  return data ?? [];
}

export async function getArticle(id: string): Promise<ArticleWithRelations | null> {
  const { data, error } = await supabaseWithAuth
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw wrapError('article', error);
  }

  // Get authors
  const { data: authorRels } = await supabaseWithAuth
    .from('article_researchers')
    .select('author_position, is_corresponding, researcher:researchers(*)')
    .eq('article_id', id)
    .order('author_position');

  // Get related genes
  const { data: geneRels } = await supabaseWithAuth
    .from('gene_articles')
    .select('gene_symbol, organism')
    .eq('article_id', id);

  return {
    ...data,
    authors: authorRels?.map((r: any) => ({
      ...r.researcher,
      author_position: r.author_position,
      is_corresponding: r.is_corresponding,
    })).filter((a: any) => a.id) ?? [],
    genes: geneRels ?? [],
  };
}

export async function createArticle(article: ArticleInsert): Promise<Article> {
  const { data, error } = await supabaseWithAuth
    .from('articles')
    .insert(article)
    .select()
    .single();

  if (error) throw wrapError('création article', error);
  return data;
}

export async function updateArticle(id: string, updates: ArticleUpdate): Promise<Article> {
  const { data, error } = await supabaseWithAuth
    .from('articles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw wrapError('mise à jour article', error);
  return data;
}

export async function deleteArticle(id: string): Promise<void> {
  const { error } = await supabaseWithAuth
    .from('articles')
    .delete()
    .eq('id', id);

  if (error) throw wrapError('suppression article', error);
}

// ============ Conferences ============

export async function listConferences(): Promise<Conference[]> {
  const { data, error } = await supabaseWithAuth
    .from('conferences')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw wrapError('conférences', error);
  return data ?? [];
}

export async function getConference(id: string): Promise<ConferenceWithRelations | null> {
  const { data, error } = await supabaseWithAuth
    .from('conferences')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw wrapError('conférence', error);
  }

  // Get participants
  const { data: participantRels } = await supabaseWithAuth
    .from('conference_researchers')
    .select('role, researcher:researchers(*)')
    .eq('conference_id', id);

  // Get related articles
  const { data: articleRels } = await supabaseWithAuth
    .from('conference_articles')
    .select('article:articles(*)')
    .eq('conference_id', id);

  // Get related genes
  const { data: geneRels } = await supabaseWithAuth
    .from('conference_genes')
    .select('gene_symbol, organism')
    .eq('conference_id', id);

  return {
    ...data,
    participants: participantRels?.map((r: any) => ({
      ...r.researcher,
      role: r.role,
    })).filter((p: any) => p.id) ?? [],
    articles: articleRels?.map((r: any) => r.article).filter(Boolean) ?? [],
    genes: geneRels ?? [],
  };
}

export async function createConference(conference: ConferenceInsert): Promise<Conference> {
  const { data, error } = await supabaseWithAuth
    .from('conferences')
    .insert(conference)
    .select()
    .single();

  if (error) throw wrapError('création conférence', error);
  return data;
}

export async function updateConference(id: string, updates: ConferenceUpdate): Promise<Conference> {
  const { data, error } = await supabaseWithAuth
    .from('conferences')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw wrapError('mise à jour conférence', error);
  return data;
}

export async function deleteConference(id: string): Promise<void> {
  const { error } = await supabaseWithAuth
    .from('conferences')
    .delete()
    .eq('id', id);

  if (error) throw wrapError('suppression conférence', error);
}

// ============ Tags ============

export async function listTags(): Promise<Tag[]> {
  const { data, error } = await supabaseWithAuth
    .from('tags')
    .select('*')
    .order('name');

  if (error) throw wrapError('tags', error);
  return data ?? [];
}

export async function createTag(tag: TagInsert): Promise<Tag> {
  const { data, error } = await supabaseWithAuth
    .from('tags')
    .insert(tag)
    .select()
    .single();

  if (error) throw wrapError('création tag', error);
  return data;
}

export async function getOrCreateTag(name: string): Promise<Tag> {
  // Try to find existing
  const { data: existing } = await supabaseWithAuth
    .from('tags')
    .select('*')
    .eq('name', name.toLowerCase().trim())
    .single();

  if (existing) return existing;

  // Create new
  return createTag({ name: name.toLowerCase().trim() });
}

export async function deleteTag(tagId: string): Promise<void> {
  // First remove all note_tags associations
  await supabaseWithAuth
    .from('note_tags')
    .delete()
    .eq('tag_id', tagId);

  // Then delete the tag
  const { error } = await supabaseWithAuth
    .from('tags')
    .delete()
    .eq('id', tagId);

  if (error) throw wrapError('suppression tag', error);
}

export async function getNotesForTag(tagId: string): Promise<EntityNote[]> {
  const user = (await supabaseWithAuth.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');

  // Get note IDs that have this tag
  const { data: noteTagRels, error: relError } = await supabaseWithAuth
    .from('note_tags')
    .select('note_id')
    .eq('tag_id', tagId);

  if (relError) throw wrapError('notes du tag', relError);

  const noteIds = noteTagRels?.map((r) => r.note_id) ?? [];
  if (noteIds.length === 0) return [];

  // Get the notes
  const { data: notes, error: notesError } = await supabaseWithAuth
    .from('entity_notes')
    .select('*')
    .in('id', noteIds)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (notesError) throw wrapError('notes', notesError);

  // Get tags for each note
  const result: EntityNote[] = notes ?? [];
  for (const note of result) {
    const { data: tagRels } = await supabaseWithAuth
      .from('note_tags')
      .select('tag:tags(*)')
      .eq('note_id', note.id);
    
    note.tags = tagRels?.map((r: any) => r.tag).filter(Boolean) ?? [];
  }

  return result;
}

// ============ Notes ============

export async function listNotesForEntity(entityType: EntityType, entityId: string): Promise<EntityNote[]> {
  const user = (await supabaseWithAuth.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabaseWithAuth
    .from('entity_notes')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) throw wrapError('notes', error);

  // Get tags for each note
  const notes = data ?? [];
  for (const note of notes) {
    const { data: tagRels } = await supabaseWithAuth
      .from('note_tags')
      .select('tag:tags(*)')
      .eq('note_id', note.id);
    
    note.tags = tagRels?.map((r: any) => r.tag).filter(Boolean) ?? [];
  }

  return notes;
}

export async function createNote(note: EntityNoteInsert): Promise<EntityNote> {
  const user = (await supabaseWithAuth.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabaseWithAuth
    .from('entity_notes')
    .insert({ ...note, user_id: user.id })
    .select()
    .single();

  if (error) throw wrapError('création note', error);
  return { ...data, tags: [] };
}

export async function updateNote(id: string, content: string): Promise<EntityNote> {
  const user = (await supabaseWithAuth.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabaseWithAuth
    .from('entity_notes')
    .update({ content })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw wrapError('mise à jour note', error);
  return data;
}

export async function deleteNote(id: string): Promise<void> {
  const user = (await supabaseWithAuth.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabaseWithAuth
    .from('entity_notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw wrapError('suppression note', error);
}

export async function addTagToNote(noteId: string, tagId: string): Promise<void> {
  const { error } = await supabaseWithAuth
    .from('note_tags')
    .insert({ note_id: noteId, tag_id: tagId });

  if (error && error.code !== '23505') { // Ignore duplicate
    throw wrapError('ajout tag', error);
  }
}

export async function removeTagFromNote(noteId: string, tagId: string): Promise<void> {
  const { error } = await supabaseWithAuth
    .from('note_tags')
    .delete()
    .eq('note_id', noteId)
    .eq('tag_id', tagId);

  if (error) throw wrapError('suppression tag', error);
}

// ============ Relations ============

export async function linkGeneToResearcher(
  geneSymbol: string,
  organism: string,
  researcherId: string,
  role?: string
): Promise<void> {
  const { error } = await supabaseWithAuth
    .from('gene_researchers')
    .insert({ gene_symbol: geneSymbol, organism, researcher_id: researcherId, role });

  if (error && error.code !== '23505') {
    throw wrapError('liaison gène-chercheur', error);
  }
}

export async function unlinkGeneFromResearcher(
  geneSymbol: string,
  organism: string,
  researcherId: string
): Promise<void> {
  const { error } = await supabaseWithAuth
    .from('gene_researchers')
    .delete()
    .eq('gene_symbol', geneSymbol)
    .eq('organism', organism)
    .eq('researcher_id', researcherId);

  if (error) throw wrapError('suppression liaison', error);
}

export async function linkArticleToResearcher(
  articleId: string,
  researcherId: string,
  authorPosition?: number,
  isCorresponding?: boolean
): Promise<void> {
  const { error } = await supabaseWithAuth
    .from('article_researchers')
    .insert({ article_id: articleId, researcher_id: researcherId, author_position: authorPosition, is_corresponding: isCorresponding });

  if (error && error.code !== '23505') {
    throw wrapError('liaison article-chercheur', error);
  }
}

export async function unlinkArticleFromResearcher(
  articleId: string,
  researcherId: string
): Promise<void> {
  const { error } = await supabaseWithAuth
    .from('article_researchers')
    .delete()
    .eq('article_id', articleId)
    .eq('researcher_id', researcherId);

  if (error) throw wrapError('suppression liaison article-chercheur', error);
}

export async function linkConferenceToResearcher(
  conferenceId: string,
  researcherId: string,
  role?: string
): Promise<void> {
  const { error } = await supabaseWithAuth
    .from('conference_researchers')
    .insert({ conference_id: conferenceId, researcher_id: researcherId, role });

  if (error && error.code !== '23505') {
    throw wrapError('liaison conférence-chercheur', error);
  }
}

export async function unlinkConferenceFromResearcher(
  conferenceId: string,
  researcherId: string
): Promise<void> {
  const { error } = await supabaseWithAuth
    .from('conference_researchers')
    .delete()
    .eq('conference_id', conferenceId)
    .eq('researcher_id', researcherId);

  if (error) throw wrapError('suppression liaison conférence-chercheur', error);
}

export async function linkGeneToArticle(
  geneSymbol: string,
  organism: string,
  articleId: string
): Promise<void> {
  const { error } = await supabaseWithAuth
    .from('gene_articles')
    .insert({ gene_symbol: geneSymbol, organism, article_id: articleId });

  if (error && error.code !== '23505') {
    throw wrapError('liaison gène-article', error);
  }
}

export async function linkGeneToConference(
  geneSymbol: string,
  organism: string,
  conferenceId: string
): Promise<void> {
  const { error } = await supabaseWithAuth
    .from('gene_conferences')
    .insert({ gene_symbol: geneSymbol, organism, conference_id: conferenceId });

  if (error && error.code !== '23505') {
    throw wrapError('liaison gène-conférence', error);
  }
}

export async function linkArticleToConference(
  articleId: string,
  conferenceId: string
): Promise<void> {
  const { error } = await supabaseWithAuth
    .from('article_conferences')
    .insert({ article_id: articleId, conference_id: conferenceId });

  if (error && error.code !== '23505') {
    throw wrapError('liaison article-conférence', error);
  }
}

export async function getResearchersForGene(geneSymbol: string, organism: string): Promise<Researcher[]> {
  const { data, error } = await supabaseWithAuth
    .from('gene_researchers')
    .select('researcher:researchers(*)')
    .eq('gene_symbol', geneSymbol)
    .eq('organism', organism);

  if (error) throw wrapError('chercheurs du gène', error);
  return data?.map((r: any) => r.researcher).filter(Boolean) ?? [];
}

export async function getArticlesForGene(geneSymbol: string, organism: string): Promise<Article[]> {
  const { data, error } = await supabaseWithAuth
    .from('gene_articles')
    .select('article:articles(*)')
    .eq('gene_symbol', geneSymbol)
    .eq('organism', organism);

  if (error) throw wrapError('articles du gène', error);
  return data?.map((r: any) => r.article).filter(Boolean) ?? [];
}

// ============ Search ============

export type SearchResult = 
  | { type: 'researcher'; data: Researcher }
  | { type: 'article'; data: Article }
  | { type: 'conference'; data: Conference };

export async function searchAll(query: string): Promise<SearchResult[]> {
  const searchTerm = `%${query.toLowerCase()}%`;
  const results: SearchResult[] = [];

  // Search researchers
  const { data: researchers } = await supabaseWithAuth
    .from('researchers')
    .select('*')
    .or(`name.ilike.${searchTerm},institution.ilike.${searchTerm},specialization.ilike.${searchTerm}`)
    .limit(20);

  if (researchers) {
    results.push(...researchers.map((r) => ({ type: 'researcher' as const, data: r })));
  }

  // Search articles
  const { data: articles } = await supabaseWithAuth
    .from('articles')
    .select('*')
    .or(`title.ilike.${searchTerm},journal.ilike.${searchTerm},abstract.ilike.${searchTerm}`)
    .limit(20);

  if (articles) {
    results.push(...articles.map((a) => ({ type: 'article' as const, data: a })));
  }

  // Search conferences
  const { data: conferences } = await supabaseWithAuth
    .from('conferences')
    .select('*')
    .or(`name.ilike.${searchTerm},city.ilike.${searchTerm},description.ilike.${searchTerm}`)
    .limit(20);

  if (conferences) {
    results.push(...conferences.map((c) => ({ type: 'conference' as const, data: c })));
  }

  return results;
}
