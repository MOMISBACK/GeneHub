/**
 * Data Layer - Centralized data management with clear cache policies
 * 
 * Source of Truth by Data Type:
 * - Gene data: NCBI/UniProt (external APIs) → cached locally (24h TTL)
 * - Knowledge Base: Supabase (researchers, articles, conferences, notes)
 * - User preferences: AsyncStorage (local only)
 * - Auth state: Supabase Auth
 * 
 * Cache Strategy: Stale-While-Revalidate (SWR)
 * - Show cached data immediately (even if stale)
 * - Refresh in background
 * - Update UI when fresh data arrives
 */

import { cachedStorage, createNamespacedStorage, storage } from './storage';
import type { GeneSummary } from './api';

// ============ Cache Configuration ============

export const CACHE_TTL = {
  /** Gene data from external APIs - 24 hours */
  GENE_DATA: 24 * 60 * 60 * 1000,
  /** Gene list/search results - 1 hour */
  GENE_SEARCH: 60 * 60 * 1000,
  /** Knowledge base list queries - 5 minutes (invalidated on mutation) */
  KB_LIST: 5 * 60 * 1000,
  /** User preferences - no expiry (local only) */
  USER_PREFS: Infinity,
  /** Network status cache - 30 seconds */
  NETWORK: 30 * 1000,
} as const;

// ============ Data State Types ============

export type DataState<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'refreshing'; data: T }
  | { status: 'success'; data: T; isStale: boolean }
  | { status: 'error'; error: Error; cachedData?: T };

export function createIdleState<T>(): DataState<T> {
  return { status: 'idle' };
}

export function createLoadingState<T>(): DataState<T> {
  return { status: 'loading' };
}

export function createRefreshingState<T>(data: T): DataState<T> {
  return { status: 'refreshing', data };
}

export function createSuccessState<T>(data: T, isStale = false): DataState<T> {
  return { status: 'success', data, isStale };
}

export function createErrorState<T>(error: Error, cachedData?: T): DataState<T> {
  return { status: 'error', error, cachedData };
}

// ============ Gene Data Layer ============

export type GeneCacheKey = `${string}:${string}`; // symbol:organism

function getGeneCacheKey(symbol: string, organism: string): GeneCacheKey {
  return `genes:${symbol.toLowerCase()}:${organism.toLowerCase()}` as GeneCacheKey;
}

export const geneDataLayer = {
  /**
   * Get gene data with SWR strategy
   */
  async get(
    symbol: string,
    organism: string,
    fetcher: () => Promise<GeneSummary>
  ): Promise<{ data: GeneSummary | null; state: DataState<GeneSummary> }> {
    const key = getGeneCacheKey(symbol, organism);
    
    // Try cache first
    const cached = await cachedStorage.getWithMetadata<GeneSummary>(key);
    
    if (cached && !cached.isStale) {
      return {
        data: cached.data,
        state: createSuccessState(cached.data, false),
      };
    }
    
    // Stale or no cache - need to fetch
    if (cached) {
      // Return stale data, trigger refresh
      fetcher()
        .then(data => cachedStorage.set(key, data, CACHE_TTL.GENE_DATA))
        .catch(console.error);
      
      return {
        data: cached.data,
        state: createRefreshingState(cached.data),
      };
    }
    
    // No cache - must wait for fetch
    try {
      const data = await fetcher();
      await cachedStorage.set(key, data, CACHE_TTL.GENE_DATA);
      return {
        data,
        state: createSuccessState(data, false),
      };
    } catch (error) {
      return {
        data: null,
        state: createErrorState(error as Error),
      };
    }
  },

  /**
   * Get cached gene data without fetching
   */
  async getCached(symbol: string, organism: string): Promise<GeneSummary | null> {
    const key = getGeneCacheKey(symbol, organism);
    return cachedStorage.get<GeneSummary>(key);
  },

  /**
   * Invalidate gene cache
   */
  async invalidate(symbol: string, organism: string): Promise<void> {
    const key = getGeneCacheKey(symbol, organism);
    await storage.removeItem(key);
  },

  /**
   * Clear all gene cache
   */
  async clearAll(): Promise<void> {
    const keys = await storage.getAllKeys();
    const geneKeys = keys.filter(k => k.startsWith('genes:'));
    if (geneKeys.length > 0) {
      await storage.multiRemove([...geneKeys]);
    }
  },

  /**
   * Get cache age
   */
  async getCacheAge(symbol: string, organism: string): Promise<number | null> {
    const key = getGeneCacheKey(symbol, organism);
    const cached = await cachedStorage.getWithMetadata<GeneSummary>(key);
    return cached?.age ?? null;
  },
};

// ============ Knowledge Base Cache ============

const kbStore = createNamespacedStorage('kb');

type KBCacheKey = 
  | 'researchers:list'
  | 'articles:list'
  | 'conferences:list'
  | 'tags:list'
  | `researcher:${string}`
  | `article:${string}`
  | `conference:${string}`
  | `notes:${string}:${string}`; // entity_type:entity_id

export const kbDataLayer = {
  /**
   * Get list with cache
   */
  async getList<T>(
    type: 'researchers' | 'articles' | 'conferences' | 'tags',
    fetcher: () => Promise<T[]>
  ): Promise<{ data: T[]; isStale: boolean }> {
    const key = `${type}:list` as KBCacheKey;
    
    const result = await cachedStorage.getStaleWhileRevalidate<T[]>(
      key,
      fetcher,
      CACHE_TTL.KB_LIST
    );
    
    return { data: result.data ?? [], isStale: result.isStale };
  },

  /**
   * Get single entity with cache
   */
  async getEntity<T>(
    type: 'researcher' | 'article' | 'conference',
    id: string,
    fetcher: () => Promise<T | null>
  ): Promise<{ data: T | null; isStale: boolean }> {
    const key = `${type}:${id}` as KBCacheKey;
    
    const cached = await cachedStorage.getWithMetadata<T>(key);
    
    if (cached && !cached.isStale) {
      return { data: cached.data, isStale: false };
    }
    
    // Fetch fresh
    const data = await fetcher();
    if (data) {
      await cachedStorage.set(key, data, CACHE_TTL.KB_LIST);
    }
    
    return { data, isStale: false };
  },

  /**
   * Invalidate list cache (call after mutations)
   */
  async invalidateList(type: 'researchers' | 'articles' | 'conferences' | 'tags'): Promise<void> {
    const key = `${type}:list` as KBCacheKey;
    await kbStore.remove(key);
  },

  /**
   * Invalidate entity cache
   */
  async invalidateEntity(type: 'researcher' | 'article' | 'conference', id: string): Promise<void> {
    const key = `${type}:${id}` as KBCacheKey;
    await kbStore.remove(key);
    // Also invalidate the list
    await this.invalidateList(`${type}s` as 'researchers' | 'articles' | 'conferences');
  },

  /**
   * Clear all KB cache
   */
  async clearAll(): Promise<void> {
    await kbStore.clear();
  },
};

// ============ Offline Queue ============

interface QueuedMutation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'researcher' | 'article' | 'conference' | 'note' | 'tag';
  data: unknown;
  timestamp: number;
  retries: number;
}

const mutationQueue = createNamespacedStorage('mutation_queue');

export const offlineQueue = {
  /**
   * Add mutation to queue (for offline support)
   */
  async enqueue(mutation: Omit<QueuedMutation, 'id' | 'timestamp' | 'retries'>): Promise<string> {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const queued: QueuedMutation = {
      ...mutation,
      id,
      timestamp: Date.now(),
      retries: 0,
    };
    
    const current = await mutationQueue.get<QueuedMutation[]>('pending') ?? [];
    current.push(queued);
    await mutationQueue.set('pending', current);
    
    return id;
  },

  /**
   * Get pending mutations
   */
  async getPending(): Promise<QueuedMutation[]> {
    return await mutationQueue.get<QueuedMutation[]>('pending') ?? [];
  },

  /**
   * Remove mutation from queue (after successful sync)
   */
  async dequeue(id: string): Promise<void> {
    const current = await mutationQueue.get<QueuedMutation[]>('pending') ?? [];
    const filtered = current.filter(m => m.id !== id);
    await mutationQueue.set('pending', filtered);
  },

  /**
   * Increment retry count
   */
  async markRetry(id: string): Promise<void> {
    const current = await mutationQueue.get<QueuedMutation[]>('pending') ?? [];
    const updated = current.map(m => 
      m.id === id ? { ...m, retries: m.retries + 1 } : m
    );
    await mutationQueue.set('pending', updated);
  },

  /**
   * Clear queue
   */
  async clear(): Promise<void> {
    await mutationQueue.remove('pending');
  },

  /**
   * Get queue size
   */
  async size(): Promise<number> {
    const pending = await this.getPending();
    return pending.length;
  },
};

// ============ Export unified data layer ============

export const dataLayer = {
  gene: geneDataLayer,
  kb: kbDataLayer,
  offline: offlineQueue,
  
  /** Clear all caches */
  async clearAllCaches(): Promise<void> {
    await Promise.all([
      geneDataLayer.clearAll(),
      kbDataLayer.clearAll(),
    ]);
  },
};
