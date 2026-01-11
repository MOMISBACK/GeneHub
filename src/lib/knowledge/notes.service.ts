/**
 * Notes Service
 * CRUD operations for entity notes (with tags)
 */

import { supabaseWithAuth, wrapError, requireUserId } from './client';
import type {
  EntityNote,
  EntityNoteInsert,
  EntityType,
} from '../../types/knowledge';

export async function listNotesForEntity(
  entityType: EntityType,
  entityId: string
): Promise<EntityNote[]> {
  const userId = await requireUserId();

  const { data, error } = await supabaseWithAuth
    .from('entity_notes')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('user_id', userId)
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
  const userId = await requireUserId();

  const { data, error } = await supabaseWithAuth
    .from('entity_notes')
    .insert({ ...note, user_id: userId })
    .select()
    .single();

  if (error) throw wrapError('création note', error);
  return { ...data, tags: [] };
}

export async function updateNote(id: string, content: string): Promise<EntityNote> {
  const userId = await requireUserId();

  const { data, error } = await supabaseWithAuth
    .from('entity_notes')
    .update({ content })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw wrapError('mise à jour note', error);
  return data;
}

export async function deleteNote(id: string): Promise<void> {
  const userId = await requireUserId();

  const { error } = await supabaseWithAuth
    .from('entity_notes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw wrapError('suppression note', error);
}

/**
 * List all notes for the current user (across all entities)
 */
export async function listAllNotes(): Promise<EntityNote[]> {
  const userId = await requireUserId();

  const { data, error } = await supabaseWithAuth
    .from('entity_notes')
    .select('*')
    .eq('user_id', userId)
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

/**
 * Create a note for a specific entity
 */
export async function createNoteForEntity(
  entityType: EntityType,
  entityId: string,
  content: string
): Promise<EntityNote> {
  return createNote({
    entity_type: entityType,
    entity_id: entityId,
    content,
  });
}

/**
 * Get notes count by entity type
 */
export async function getNotesCountByEntityType(): Promise<Record<EntityType, number>> {
  const userId = await requireUserId();

  const { data, error } = await supabaseWithAuth
    .from('entity_notes')
    .select('entity_type')
    .eq('user_id', userId);

  if (error) throw wrapError('notes', error);

  const counts: Record<EntityType, number> = {
    gene: 0,
    researcher: 0,
    article: 0,
    conference: 0,
  };

  (data ?? []).forEach((item: { entity_type: EntityType }) => {
    counts[item.entity_type]++;
  });

  return counts;
}
