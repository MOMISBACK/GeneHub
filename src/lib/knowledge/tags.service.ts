/**
 * Tags Service
 * CRUD operations for tags (private per user)
 */

import { supabaseWithAuth, wrapError, requireUserId } from './client';
import type { Tag, TagInsert, EntityNote, EntityType } from '../../types/knowledge';
import { getOrganismCode } from '../../data/organisms';

function normalizeTagName(name: string): string {
  return name.toLowerCase().trim();
}

function getLastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1]?.toLowerCase() ?? fullName.toLowerCase();
}

function getArticleTagName(title: string): string {
  const firstWord = title.trim().split(/\s+/)[0] ?? '';
  const cleanWord = firstWord.replace(/[^a-z]/gi, '');
  return normalizeTagName(cleanWord || title);
}

function getGeneTagNameFromEntity(entityId: string, entityName?: string): string {
  const [symbolRaw, organismRaw] = entityId.includes('_')
    ? entityId.split('_')
    : [entityId, entityName ?? ''];
  const symbol = normalizeTagName(symbolRaw);
  const organismName = organismRaw?.replace(/_/g, ' ').trim();
  const orgCode = organismName ? getOrganismCode(organismName) : 'org';
  return orgCode ? `${symbol}-${orgCode}` : symbol;
}

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
    .eq('name', normalizeTagName(name))
    .single();

  if (existing) return existing;

  // Create new
  return createTag({ name: normalizeTagName(name) });
}

/**
 * Get or create a tag with full data (handles duplicates gracefully)
 */
export async function getOrCreateTagWithData(tagData: TagInsert): Promise<Tag> {
  const userId = await requireUserId();
  const normalizedName = normalizeTagName(tagData.name);
  
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

/**
 * Get or create the tag linked to a specific entity
 * This is used for auto-tagging notes when they're created on an entity
 */
export async function getOrCreateEntityTag(
  entityType: EntityType,
  entityId: string,
  entityName: string
): Promise<Tag> {
  const userId = await requireUserId();
  
  // First try to find an existing tag linked to this entity
  const { data: existing } = await supabaseWithAuth
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .single();

  if (existing) return existing;

  // Create a new tag linked to this entity (convention aligned with TagCreateModal)
  let tagName = normalizeTagName(entityName);
  if (entityType === 'gene') {
    tagName = getGeneTagNameFromEntity(entityId, entityName);
  } else if (entityType === 'researcher') {
    tagName = getLastName(entityName);
  } else if (entityType === 'article') {
    tagName = getArticleTagName(entityName);
  }

  return createTag({
    name: tagName,
    entity_type: entityType,
    entity_id: entityId,
  });
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

  // Get tags for each note (batched)
  const result: EntityNote[] = notes ?? [];
  const allNoteIds = result.map(n => n.id);

  if (allNoteIds.length > 0) {
    const { data: tagRels } = await supabaseWithAuth
      .from('note_tags')
      .select('note_id, tag:tags(*)')
      .in('note_id', allNoteIds)
      .eq('user_id', userId);

    const tagsByNote = new Map<string, any[]>();
    (tagRels ?? []).forEach((r: any) => {
      if (!r.note_id || !r.tag) return;
      const arr = tagsByNote.get(r.note_id) ?? [];
      arr.push(r.tag);
      tagsByNote.set(r.note_id, arr);
    });

    for (const note of result) {
      note.tags = tagsByNote.get(note.id) ?? [];
    }
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

  // Batch counts for all tags (only user's note_tags)
  const { data, error } = await supabaseWithAuth
    .from('note_tags')
    .select('tag_id')
    .eq('user_id', userId);

  if (error) throw wrapError('compte tags', error);

  const counts = new Map<string, number>();
  (data ?? []).forEach((row: { tag_id: string }) => {
    counts.set(row.tag_id, (counts.get(row.tag_id) ?? 0) + 1);
  });

  return tags.map(tag => ({
    ...tag,
    noteCount: counts.get(tag.id) ?? 0,
  }));
}
