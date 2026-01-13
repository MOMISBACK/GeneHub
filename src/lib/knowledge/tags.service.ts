/**
 * Tags Service
 * CRUD operations for tags (private per user)
 */

import { supabaseWithAuth, wrapError, requireUserId } from './client';
import type { Tag, TagInsert, EntityNote } from '../../types/knowledge';

export async function listTags(): Promise<Tag[]> {
  const userId = await requireUserId();
  
  const { data, error } = await supabaseWithAuth
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .order('name');

  if (error) throw wrapError('tags', error);
  return data ?? [];
}

export async function createTag(tag: TagInsert): Promise<Tag> {
  const userId = await requireUserId();
  
  const { data, error } = await supabaseWithAuth
    .from('tags')
    .insert({ ...tag, user_id: userId })
    .select()
    .single();

  if (error) throw wrapError('création tag', error);
  return data;
}

export async function getOrCreateTag(name: string): Promise<Tag> {
  const userId = await requireUserId();
  
  // Try to find existing for this user
  const { data: existing } = await supabaseWithAuth
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .eq('name', name.toLowerCase().trim())
    .single();

  if (existing) return existing;

  // Create new
  return createTag({ name: name.toLowerCase().trim() });
}

/**
 * Get or create a tag with full data (handles duplicates gracefully)
 */
export async function getOrCreateTagWithData(tagData: TagInsert): Promise<Tag> {
  const userId = await requireUserId();
  const normalizedName = tagData.name.toLowerCase().trim();
  
  // Try to find existing for this user
  const { data: existing } = await supabaseWithAuth
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .eq('name', normalizedName)
    .single();

  if (existing) return existing;

  // Create new with all provided data
  return createTag({ ...tagData, name: normalizedName });
}

export async function deleteTag(tagId: string): Promise<void> {
  const userId = await requireUserId();
  
  // First remove all note_tags associations for this user
  await supabaseWithAuth
    .from('note_tags')
    .delete()
    .eq('tag_id', tagId)
    .eq('user_id', userId);

  // Then delete the tag
  const { error } = await supabaseWithAuth
    .from('tags')
    .delete()
    .eq('id', tagId)
    .eq('user_id', userId);

  if (error) throw wrapError('suppression tag', error);
}

export async function getNotesForTag(tagId: string): Promise<EntityNote[]> {
  const userId = await requireUserId();

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
    .eq('user_id', userId)
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

/**
 * Add a tag to a note
 */
export async function addTagToNote(noteId: string, tagId: string): Promise<void> {
  const userId = await requireUserId();
  
  const { error } = await supabaseWithAuth
    .from('note_tags')
    .insert({ note_id: noteId, tag_id: tagId, user_id: userId });

  if (error && error.code !== '23505') { // Ignore duplicate
    throw wrapError('ajout tag', error);
  }
}

/**
 * Remove a tag from a note
 */
export async function removeTagFromNote(noteId: string, tagId: string): Promise<void> {
  const userId = await requireUserId();
  
  const { error } = await supabaseWithAuth
    .from('note_tags')
    .delete()
    .eq('note_id', noteId)
    .eq('tag_id', tagId)
    .eq('user_id', userId);

  if (error) throw wrapError('suppression tag', error);
}

/**
 * Get tags with usage counts
 */
export async function getTagsWithCounts(): Promise<(Tag & { noteCount: number })[]> {
  const userId = await requireUserId();
  const tags = await listTags();
  
  // Get counts for each tag (only user's note_tags)
  const result = await Promise.all(tags.map(async (tag) => {
    const { count } = await supabaseWithAuth
      .from('note_tags')
      .select('*', { count: 'exact', head: true })
      .eq('tag_id', tag.id)
      .eq('user_id', userId);
    
    return { ...tag, noteCount: count ?? 0 };
  }));
  
  return result;
}
