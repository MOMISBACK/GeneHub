/**
 * Notes Service
 * CRUD operations for entity notes (with tags)
 * 
 * Notes can appear on an entity's page if:
 * 1. Created directly for the entity (entity_type + entity_id match)
 * 2. Has a tag linking to the entity (tag.entity_type + tag.entity_id match)
 */

import { supabaseWithAuth, wrapError, requireUserId } from './client';
import type {
  EntityNote,
  EntityNoteInsert,
  EntityType,
} from '../../types/knowledge';

/**
 * List notes for an entity, including notes linked via tags.
 * Notes linked via tags have isLinkedViaTag=true flag.
 */
export async function listNotesForEntity(
  entityType: EntityType,
  entityId: string
): Promise<EntityNote[]> {
  const userId = await requireUserId();

  // 1. Get notes directly created for this entity
  const { data: directNotes, error: directError } = await supabaseWithAuth
    .from('entity_notes')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (directError) throw wrapError('notes', directError);

  // 2. Get notes linked via tags
  const { data: linkedTags } = await supabaseWithAuth
    .from('tags')
    .select('id')
    .eq('user_id', userId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);

  const tagIds = linkedTags?.map(t => t.id) ?? [];
  
  let linkedNotes: EntityNote[] = [];
  if (tagIds.length > 0) {
    const { data: noteTagRels } = await supabaseWithAuth
      .from('note_tags')
      .select('note_id')
      .in('tag_id', tagIds);

    const linkedNoteIds = noteTagRels?.map(r => r.note_id) ?? [];
    const directNoteIds = (directNotes ?? []).map(n => n.id);
    const uniqueLinkedIds = linkedNoteIds.filter(id => !directNoteIds.includes(id));

    if (uniqueLinkedIds.length > 0) {
      const { data: linkedData } = await supabaseWithAuth
        .from('entity_notes')
        .select('*')
        .in('id', uniqueLinkedIds)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      linkedNotes = (linkedData ?? []).map(note => ({
        ...note,
        isLinkedViaTag: true,
        tags: [],
      }));
    }
  }

  // Combine and get tags for each note
  const allNotes: EntityNote[] = [...(directNotes ?? []).map(n => ({ ...n, tags: [] })), ...linkedNotes];
  
  for (const note of allNotes) {
    const { data: tagRels } = await supabaseWithAuth
      .from('note_tags')
      .select('tag:tags(*)')
      .eq('note_id', note.id);
    
    note.tags = tagRels?.map((r: any) => r.tag).filter(Boolean) ?? [];
  }

  // Sort by updated_at descending
  allNotes.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  return allNotes;
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
