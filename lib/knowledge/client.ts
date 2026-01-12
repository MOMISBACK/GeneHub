/**
 * Knowledge Base Client
 * Shared Supabase client and error handling for knowledge base services
 */

import { supabaseWithAuth } from '../supabase';

export { supabaseWithAuth };

/**
 * Wrap database errors with user-friendly messages
 */
export function wrapError(action: string, error: unknown): Error {
  const code = String((error as any)?.code ?? '');
  const message = String((error as any)?.message ?? error);

  // Table doesn't exist
  if (code === '42P01' || (message.includes('relation') && message.includes('does not exist'))) {
    return new Error(
      `Base de données non initialisée pour ${action}. Exécutez la migration 002_knowledge_base.sql dans Supabase.`
    );
  }

  // Foreign key violation
  if (code === '23503') {
    return new Error(`Impossible de supprimer: cet élément est référencé ailleurs.`);
  }

  // Unique constraint violation
  if (code === '23505') {
    return new Error(`Cet élément existe déjà.`);
  }

  return new Error(message);
}

/**
 * Get current authenticated user ID
 * Throws if not authenticated
 */
export async function requireUserId(): Promise<string> {
  const { data: { user } } = await supabaseWithAuth.auth.getUser();
  if (!user) {
    throw new Error('Non authentifié');
  }
  return user.id;
}

/**
 * Get current user ID or null if not authenticated
 */
export async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabaseWithAuth.auth.getUser();
  return user?.id ?? null;
}
