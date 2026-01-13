/**
 * Articles Service
 * CRUD operations for scientific articles
 * Each user has their own independent articles (isolated via user_id + RLS)
 */

import { supabaseWithAuth, wrapError, requireUserId } from './client';
import type {
  Article,
  ArticleInsert,
  ArticleUpdate,
  ArticleWithRelations,
} from '../../types/knowledge';

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
  const userId = await requireUserId();
  
  const { data, error } = await supabaseWithAuth
    .from('articles')
    .insert({ ...article, user_id: userId })
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

/**
 * Get articles for a specific gene
 */
export async function getArticlesForGene(geneSymbol: string, organism: string): Promise<Article[]> {
  const { data, error } = await supabaseWithAuth
    .from('gene_articles')
    .select('article:articles(*)')
    .eq('gene_symbol', geneSymbol)
    .eq('organism', organism);

  if (error) throw wrapError('articles du gène', error);
  return data?.map((r: any) => r.article).filter(Boolean) ?? [];
}

/**
 * Link an article to a researcher (authorship)
 */
export async function linkArticleToResearcher(
  articleId: string,
  researcherId: string,
  authorPosition?: number,
  isCorresponding?: boolean
): Promise<void> {
  const userId = await requireUserId();
  
  const { error } = await supabaseWithAuth
    .from('article_researchers')
    .insert({ 
      article_id: articleId, 
      researcher_id: researcherId, 
      author_position: authorPosition, 
      is_corresponding: isCorresponding,
      user_id: userId,
    });

  if (error && error.code !== '23505') {
    throw wrapError('liaison article-chercheur', error);
  }
}

/**
 * Unlink an article from a researcher
 */
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

/**
 * Link an article to a gene
 */
export async function linkGeneToArticle(
  geneSymbol: string,
  organism: string,
  articleId: string
): Promise<void> {
  const userId = await requireUserId();
  
  const { error } = await supabaseWithAuth
    .from('gene_articles')
    .insert({ gene_symbol: geneSymbol, organism, article_id: articleId, user_id: userId });

  if (error && error.code !== '23505') {
    throw wrapError('liaison gène-article', error);
  }
}
