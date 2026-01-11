/**
 * Conferences Service
 * CRUD operations for scientific conferences
 */

import { supabaseWithAuth, wrapError } from './client';
import type {
  Conference,
  ConferenceInsert,
  ConferenceUpdate,
  ConferenceWithRelations,
} from '../../types/knowledge';

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

/**
 * Link a conference to a researcher (participation)
 */
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

/**
 * Unlink a conference from a researcher
 */
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

/**
 * Link a gene to a conference
 */
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

/**
 * Link an article to a conference
 */
export async function linkArticleToConference(
  articleId: string,
  conferenceId: string
): Promise<void> {
  const { error } = await supabaseWithAuth
    .from('conference_articles')
    .insert({ article_id: articleId, conference_id: conferenceId });

  if (error && error.code !== '23505') {
    throw wrapError('liaison article-conférence', error);
  }
}
