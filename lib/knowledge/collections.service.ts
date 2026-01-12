/**
 * Collections Service
 * CRUD operations for collections and collection items
 */

import { supabaseWithAuth, wrapError, requireUserId } from './client';
import type {
  Collection,
  CollectionInsert,
  CollectionUpdate,
  CollectionItem,
  CollectionItemInsert,
  CollectionEntityType,
} from '../../types/collections';

// ============ Collections CRUD ============

/**
 * List all collections for current user
 */
export async function listCollections(): Promise<Collection[]> {
  const userId = await requireUserId();

  const { data, error } = await supabaseWithAuth
    .from('collections')
    .select('*, collection_items(count)')
    .eq('user_id', userId)
    .order('is_pinned', { ascending: false })
    .order('position')
    .order('name');

  if (error) throw wrapError('collections', error);

  // Map count
  return (data ?? []).map((c: any) => ({
    ...c,
    item_count: c.collection_items?.[0]?.count ?? 0,
    collection_items: undefined,
  }));
}

/**
 * Get a single collection by ID
 */
export async function getCollection(id: string): Promise<Collection | null> {
  const userId = await requireUserId();

  const { data, error } = await supabaseWithAuth
    .from('collections')
    .select('*, collection_items(count)')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw wrapError('collection', error);
  }

  return {
    ...data,
    item_count: data.collection_items?.[0]?.count ?? 0,
    collection_items: undefined,
  };
}

/**
 * Create a new collection
 */
export async function createCollection(collection: CollectionInsert): Promise<Collection> {
  const userId = await requireUserId();

  const { data, error } = await supabaseWithAuth
    .from('collections')
    .insert({
      ...collection,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Une collection "${collection.name}" existe déjà`);
    }
    throw wrapError('création collection', error);
  }

  return { ...data, item_count: 0 };
}

/**
 * Update a collection
 */
export async function updateCollection(id: string, updates: CollectionUpdate): Promise<Collection> {
  const userId = await requireUserId();

  const { data, error } = await supabaseWithAuth
    .from('collections')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw wrapError('mise à jour collection', error);
  return data;
}

/**
 * Delete a collection (and all its items via CASCADE)
 */
export async function deleteCollection(id: string): Promise<void> {
  const userId = await requireUserId();

  const { error } = await supabaseWithAuth
    .from('collections')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw wrapError('suppression collection', error);
}

/**
 * Toggle pin status
 */
export async function toggleCollectionPin(id: string): Promise<Collection> {
  const collection = await getCollection(id);
  if (!collection) throw new Error('Collection non trouvée');

  return updateCollection(id, { is_pinned: !collection.is_pinned });
}

// ============ Collection Items ============

/**
 * Get all items in a collection
 */
export async function getCollectionItems(collectionId: string): Promise<CollectionItem[]> {
  const userId = await requireUserId();

  const { data, error } = await supabaseWithAuth
    .from('collection_items')
    .select('*')
    .eq('collection_id', collectionId)
    .eq('user_id', userId)
    .order('position')
    .order('created_at', { ascending: false });

  if (error) throw wrapError('items collection', error);
  return data ?? [];
}

/**
 * Add item to collection
 */
export async function addToCollection(item: CollectionItemInsert): Promise<CollectionItem> {
  const userId = await requireUserId();

  const { data, error } = await supabaseWithAuth
    .from('collection_items')
    .insert({
      ...item,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Cet élément est déjà dans cette collection');
    }
    throw wrapError('ajout à collection', error);
  }

  return data;
}

/**
 * Remove item from collection
 */
export async function removeFromCollection(collectionId: string, entityType: CollectionEntityType, entityId: string): Promise<void> {
  const userId = await requireUserId();

  const { error } = await supabaseWithAuth
    .from('collection_items')
    .delete()
    .eq('collection_id', collectionId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('user_id', userId);

  if (error) throw wrapError('suppression de collection', error);
}

/**
 * Get collections containing a specific entity
 */
export async function getCollectionsForEntity(
  entityType: CollectionEntityType,
  entityId: string
): Promise<Collection[]> {
  const userId = await requireUserId();

  const { data, error } = await supabaseWithAuth
    .from('collection_items')
    .select('collection:collections(*)')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('user_id', userId);

  if (error) throw wrapError('collections de l\'entité', error);

  return (data ?? [])
    .map((d: any) => d.collection)
    .filter(Boolean);
}

/**
 * Check if entity is in any collection
 */
export async function isInAnyCollection(
  entityType: CollectionEntityType,
  entityId: string
): Promise<boolean> {
  const collections = await getCollectionsForEntity(entityType, entityId);
  return collections.length > 0;
}

/**
 * Quick add to collection (create if needed)
 */
export async function quickAddToCollection(
  collectionName: string,
  entityType: CollectionEntityType,
  entityId: string
): Promise<{ collection: Collection; item: CollectionItem }> {
  const userId = await requireUserId();

  // Find or create collection
  let collection: Collection;
  const existing = await supabaseWithAuth
    .from('collections')
    .select('*')
    .eq('user_id', userId)
    .eq('name', collectionName)
    .single();

  if (existing.data) {
    collection = existing.data;
  } else {
    collection = await createCollection({ name: collectionName, position: 0, is_pinned: false });
  }

  // Add item
  const item = await addToCollection({
    collection_id: collection.id,
    entity_type: entityType,
    entity_id: entityId,
  });

  return { collection, item };
}
