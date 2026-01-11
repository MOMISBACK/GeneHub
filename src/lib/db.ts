import { supabaseWithAuth } from './supabase';

function wrapDbError(action: string, error: unknown): Error {
  const code = String((error as any)?.code ?? '');
  const message = String((error as any)?.message ?? error);

  // Postgres undefined_table
  if (code === '42P01' || message.toLowerCase().includes('relation') && message.toLowerCase().includes('does not exist')) {
    return new Error(
      `Base de données non initialisée pour ${action}. Exécute le script SQL (supabase/schema.sql) dans Supabase Dashboard → SQL Editor, puis réessaie.`,
    );
  }

  return new Error(message);
}

export type GeneView = {
  id: string;
  symbol: string;
  organism: string;
  summary: string | null;
  accessed_at: string;
};

export async function logGeneView(symbol: string, organism: string, summary: string | null): Promise<void> {
  const user = (await supabaseWithAuth.auth.getUser()).data.user;
  if (!user) return;

  // Upsert: update accessed_at if already exists, otherwise insert
  const { error } = await supabaseWithAuth.from('gene_views').upsert(
    {
      user_id: user.id,
      symbol,
      organism,
      summary,
      accessed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,symbol,organism' },
  );

  if (error) throw wrapDbError('Historique', error);
}

export async function listGeneViews(limit = 50): Promise<GeneView[]> {
  const user = (await supabaseWithAuth.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabaseWithAuth
    .from('gene_views')
    .select('id,symbol,organism,summary,accessed_at')
    .eq('user_id', user.id)
    .order('accessed_at', { ascending: false })
    .limit(limit);

  if (error) throw wrapDbError('Historique', error);
  return (data ?? []) as GeneView[];
}

export async function deleteGeneView(id: string): Promise<void> {
  const user = (await supabaseWithAuth.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabaseWithAuth
    .from('gene_views')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw wrapDbError('Suppression historique', error);
}
