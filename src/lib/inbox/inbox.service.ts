/**
 * Inbox Service - CRUD operations for inbox items
 */

import { supabaseWithAuth } from '../supabase';
import type {
  InboxItem,
  InboxItemInsert,
  InboxItemUpdate,
  InboxStatus,
  InboxConvertedEntityType,
} from '../../types/inbox';
import { detectInboxType } from './parse';

// ============ Helpers ============

function wrapError(action: string, error: unknown): Error {
  const code = String((error as any)?.code ?? '');
  const message = String((error as any)?.message ?? error);

  if (code === '42P01' || (message.includes('relation') && message.includes('does not exist'))) {
    return new Error(
      `Base de données non initialisée pour ${action}. Exécutez la migration 004_inbox.sql dans Supabase.`
    );
  }

  return new Error(message);
}

// ============ Types ============

export interface InboxServiceResult<T> {
  data: T | null;
  error: Error | null;
}

export interface InboxListOptions {
  status?: InboxStatus;
  limit?: number;
  offset?: number;
}

// ============ Create ============

/**
 * Create a new inbox item with auto-detection
 */
export async function createInboxItem(
  raw: string,
  options?: {
    title?: string;
    note?: string;
    tags?: string[];
  }
): Promise<InboxServiceResult<InboxItem>> {
  try {
    // Get current user
    const { data: { user } } = await supabaseWithAuth.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Auto-detect type
    const parseResult = detectInboxType(raw);
    
    const insertData: InboxItemInsert = {
      raw,
      detected_type: parseResult.type,
      normalized: parseResult.normalized,
      title: options?.title,
      note: options?.note,
      tags: options?.tags ?? [],
      user_id: user.id,
    };

    const { data, error } = await supabaseWithAuth
      .from('inbox_items')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return { data: data as InboxItem, error: null };
  } catch (err) {
    return { data: null, error: wrapError('createInboxItem', err) };
  }
}

// ============ Read ============

/**
 * List inbox items with optional filtering
 */
export async function listInboxItems(
  options: InboxListOptions = {}
): Promise<InboxServiceResult<InboxItem[]>> {
  try {
    const { status, limit = 50, offset = 0 } = options;

    let query = supabaseWithAuth
      .from('inbox_items')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: (data as InboxItem[]) ?? [], error: null };
  } catch (err) {
    return { data: null, error: wrapError('listInboxItems', err) };
  }
}

/**
 * Get active (non-archived) inbox items
 */
export async function listActiveInbox(): Promise<InboxServiceResult<InboxItem[]>> {
  try {
    const { data, error } = await supabaseWithAuth
      .from('inbox_items')
      .select('*')
      .in('status', ['inbox', 'converted'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data as InboxItem[]) ?? [], error: null };
  } catch (err) {
    return { data: null, error: wrapError('listActiveInbox', err) };
  }
}

/**
 * List all inbox items (including archived)
 */
export async function listAllInbox(): Promise<InboxServiceResult<InboxItem[]>> {
  try {
    const { data, error } = await supabaseWithAuth
      .from('inbox_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data as InboxItem[]) ?? [], error: null };
  } catch (err) {
    return { data: null, error: wrapError('listAllInbox', err) };
  }
}

/**
 * Get a single inbox item by ID
 */
export async function getInboxItem(
  id: string
): Promise<InboxServiceResult<InboxItem>> {
  try {
    const { data, error } = await supabaseWithAuth
      .from('inbox_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data: data as InboxItem, error: null };
  } catch (err) {
    return { data: null, error: wrapError('getInboxItem', err) };
  }
}

/**
 * Count inbox items by status
 */
export async function countInboxByStatus(): Promise<
  InboxServiceResult<Record<InboxStatus, number>>
> {
  try {
    const { data, error } = await supabaseWithAuth
      .from('inbox_items')
      .select('status');

    if (error) throw error;

    const counts: Record<InboxStatus, number> = {
      inbox: 0,
      archived: 0,
      converted: 0,
    };

    (data ?? []).forEach((item: { status: InboxStatus }) => {
      counts[item.status]++;
    });

    return { data: counts, error: null };
  } catch (err) {
    return { data: null, error: wrapError('countInboxByStatus', err) };
  }
}

// ============ Update ============

/**
 * Update an inbox item
 */
export async function updateInboxItem(
  id: string,
  updates: InboxItemUpdate
): Promise<InboxServiceResult<InboxItem>> {
  try {
    const { data, error } = await supabaseWithAuth
      .from('inbox_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: data as InboxItem, error: null };
  } catch (err) {
    return { data: null, error: wrapError('updateInboxItem', err) };
  }
}

/**
 * Archive an inbox item
 */
export async function archiveInboxItem(
  id: string
): Promise<InboxServiceResult<InboxItem>> {
  return updateInboxItem(id, { status: 'archived' });
}

/**
 * Restore an archived item to inbox
 */
export async function restoreInboxItem(
  id: string
): Promise<InboxServiceResult<InboxItem>> {
  return updateInboxItem(id, { status: 'inbox' });
}

/**
 * Mark item as converted (after creating Article/Note/etc)
 */
export async function markAsConverted(
  id: string,
  entityType: InboxConvertedEntityType,
  entityId: string
): Promise<InboxServiceResult<InboxItem>> {
  return updateInboxItem(id, {
    status: 'converted',
    converted_entity_type: entityType,
    converted_entity_id: entityId,
  });
}

/**
 * Add/update note on inbox item
 */
export async function addNoteToInboxItem(
  id: string,
  note: string
): Promise<InboxServiceResult<InboxItem>> {
  return updateInboxItem(id, { note });
}

/**
 * Update tags on inbox item
 */
export async function updateInboxTags(
  id: string,
  tags: string[]
): Promise<InboxServiceResult<InboxItem>> {
  return updateInboxItem(id, { tags });
}

// ============ Delete ============

/**
 * Delete an inbox item permanently
 */
export async function deleteInboxItem(
  id: string
): Promise<InboxServiceResult<boolean>> {
  try {
    const { error } = await supabaseWithAuth
      .from('inbox_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { data: true, error: null };
  } catch (err) {
    return { data: null, error: wrapError('deleteInboxItem', err) };
  }
}

/**
 * Delete all archived items (cleanup)
 */
export async function purgeArchivedItems(): Promise<InboxServiceResult<number>> {
  try {
    const { data, error } = await supabaseWithAuth
      .from('inbox_items')
      .delete()
      .eq('status', 'archived')
      .select('id');

    if (error) throw error;
    return { data: data?.length ?? 0, error: null };
  } catch (err) {
    return { data: null, error: wrapError('purgeArchivedItems', err) };
  }
}

// ============ Search ============

/**
 * Search inbox items by raw content or title
 */
export async function searchInboxItems(
  query: string
): Promise<InboxServiceResult<InboxItem[]>> {
  try {
    const searchTerm = `%${query}%`;

    const { data, error } = await supabaseWithAuth
      .from('inbox_items')
      .select('*')
      .or(`raw.ilike.${searchTerm},title.ilike.${searchTerm},note.ilike.${searchTerm}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data as InboxItem[]) ?? [], error: null };
  } catch (err) {
    return { data: null, error: wrapError('searchInboxItems', err) };
  }
}
