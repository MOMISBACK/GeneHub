/**
 * Search Service
 * Global search across all knowledge base entities
 */

import { supabaseWithAuth, wrapError } from './client';
import type {
  Researcher,
  Article,
  Conference,
} from '../../types/knowledge';

export type SearchResult = 
  | { type: 'researcher'; data: Researcher }
  | { type: 'article'; data: Article }
  | { type: 'conference'; data: Conference };

/**
 * Search across all entities
 */
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

/**
 * Search only researchers
 */
export async function searchResearchers(query: string, limit = 20): Promise<Researcher[]> {
  const searchTerm = `%${query.toLowerCase()}%`;
  
  const { data, error } = await supabaseWithAuth
    .from('researchers')
    .select('*')
    .or(`name.ilike.${searchTerm},institution.ilike.${searchTerm},specialization.ilike.${searchTerm}`)
    .limit(limit);

  if (error) throw wrapError('recherche chercheurs', error);
  return data ?? [];
}

/**
 * Search only articles
 */
export async function searchArticles(query: string, limit = 20): Promise<Article[]> {
  const searchTerm = `%${query.toLowerCase()}%`;
  
  const { data, error } = await supabaseWithAuth
    .from('articles')
    .select('*')
    .or(`title.ilike.${searchTerm},journal.ilike.${searchTerm},abstract.ilike.${searchTerm}`)
    .limit(limit);

  if (error) throw wrapError('recherche articles', error);
  return data ?? [];
}

/**
 * Search only conferences
 */
export async function searchConferences(query: string, limit = 20): Promise<Conference[]> {
  const searchTerm = `%${query.toLowerCase()}%`;
  
  const { data, error } = await supabaseWithAuth
    .from('conferences')
    .select('*')
    .or(`name.ilike.${searchTerm},city.ilike.${searchTerm},description.ilike.${searchTerm}`)
    .limit(limit);

  if (error) throw wrapError('recherche conférences', error);
  return data ?? [];
}

export type SearchFilter = {
  types?: ('researcher' | 'article' | 'conference')[];
  limit?: number;
};

/**
 * Search with filters
 */
export async function searchWithFilters(
  query: string,
  filters: SearchFilter = {}
): Promise<SearchResult[]> {
  const types = filters.types ?? ['researcher', 'article', 'conference'];
  const limit = filters.limit ?? 20;
  const results: SearchResult[] = [];

  const promises: Promise<void>[] = [];

  if (types.includes('researcher')) {
    promises.push(
      searchResearchers(query, limit).then(data => {
        results.push(...data.map(r => ({ type: 'researcher' as const, data: r })));
      })
    );
  }

  if (types.includes('article')) {
    promises.push(
      searchArticles(query, limit).then(data => {
        results.push(...data.map(a => ({ type: 'article' as const, data: a })));
      })
    );
  }

  if (types.includes('conference')) {
    promises.push(
      searchConferences(query, limit).then(data => {
        results.push(...data.map(c => ({ type: 'conference' as const, data: c })));
      })
    );
  }

  await Promise.all(promises);
  return results;
}
