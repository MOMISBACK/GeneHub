/**
 * Cache Module - Stale-While-Revalidate Strategy
 * 
 * Provides caching with automatic background refresh for stale data.
 * Uses Supabase api_cache table for persistence.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Cache configuration by category
export const CACHE_CONFIG = {
  'gene-basic': {
    ttl: 86400,                    // 24 hours
    staleWhileRevalidate: 3600,    // 1 hour grace period
  },
  'gene-structure': {
    ttl: 604800,                   // 7 days
    staleWhileRevalidate: 86400,   // 1 day grace period
  },
  'gene-literature': {
    ttl: 3600,                     // 1 hour
    staleWhileRevalidate: 600,     // 10 min grace period
  },
  'biocyc-gene': {
    ttl: 604800,                   // 7 days
    staleWhileRevalidate: 86400,   // 1 day grace period
  },
  'biocyc-pathway': {
    ttl: 604800,                   // 7 days
    staleWhileRevalidate: 86400,   // 1 day grace period
  },
  'biocyc-regulation': {
    ttl: 604800,                   // 7 days
    staleWhileRevalidate: 86400,   // 1 day grace period
  },
  'string-interactions': {
    ttl: 604800,                   // 7 days
    staleWhileRevalidate: 86400,   // 1 day grace period
  },
  'kegg-pathways': {
    ttl: 604800,                   // 7 days
    staleWhileRevalidate: 86400,   // 1 day grace period
  },
} as const;

export type CacheCategory = keyof typeof CACHE_CONFIG;

interface CacheEntry<T> {
  data: T;
  fetched_at: string;
  expires_at: string;
}

interface CacheResult<T> {
  data: T;
  fromCache: boolean;
  isStale: boolean;
}

/**
 * Get data from cache or fetch fresh
 * Implements stale-while-revalidate pattern
 * Falls back to direct fetch if cache table doesn't exist
 */
export async function getCached<T>(
  key: string,
  category: CacheCategory,
  fetcher: () => Promise<T>,
  supabase: SupabaseClient
): Promise<CacheResult<T>> {
  const config = CACHE_CONFIG[category];

  // Try to check cache (gracefully handle if table doesn't exist)
  try {
    const { data: cached, error } = await supabase
      .from('api_cache')
      .select('data, fetched_at, expires_at')
      .eq('cache_key', key)
      .single();

    // If table doesn't exist, just fetch directly
    if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
      console.log('[Cache] Table not found, fetching directly');
      const fresh = await fetcher();
      return {
        data: fresh,
        fromCache: false,
        isStale: false,
      };
    }

    if (cached) {
      const fetchedAt = new Date(cached.fetched_at).getTime();
      const age = Date.now() - fetchedAt;
      const isStale = age > config.ttl * 1000;
      const isExpired = age > (config.ttl + config.staleWhileRevalidate) * 1000;

      if (!isExpired) {
        // Return cached data
        // If stale, trigger background revalidation (fire and forget)
        if (isStale) {
          revalidateInBackground(key, category, fetcher, supabase);
        }

        return {
          data: cached.data as T,
          fromCache: true,
          isStale,
        };
      }
    }
  } catch (cacheError) {
    console.warn('[Cache] Error checking cache, fetching directly:', cacheError);
  }

  // Fetch fresh data
  const fresh = await fetcher();

  // Try to store in cache (ignore errors if table doesn't exist)
  try {
    await setCache(key, category, fresh, supabase);
  } catch (setCacheError) {
    console.warn('[Cache] Error storing in cache:', setCacheError);
  }

  return {
    data: fresh,
    fromCache: false,
    isStale: false,
  };
}

/**
 * Store data in cache
 */
export async function setCache<T>(
  key: string,
  category: CacheCategory,
  data: T,
  supabase: SupabaseClient
): Promise<void> {
  const config = CACHE_CONFIG[category];
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.ttl * 1000);

  await supabase.from('api_cache').upsert(
    {
      cache_key: key,
      category,
      data,
      fetched_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: 'cache_key' }
  );
}

/**
 * Invalidate a cache entry
 */
export async function invalidateCache(
  key: string,
  supabase: SupabaseClient
): Promise<void> {
  await supabase.from('api_cache').delete().eq('cache_key', key);
}

/**
 * Invalidate all cache entries for a category
 */
export async function invalidateCategory(
  category: CacheCategory,
  supabase: SupabaseClient
): Promise<void> {
  await supabase.from('api_cache').delete().eq('category', category);
}

/**
 * Background revalidation (fire and forget)
 */
async function revalidateInBackground<T>(
  key: string,
  category: CacheCategory,
  fetcher: () => Promise<T>,
  supabase: SupabaseClient
): Promise<void> {
  // Use EdgeRuntime.waitUntil if available, otherwise just fire and forget
  const revalidate = async () => {
    try {
      console.log(`[Cache] Background revalidating: ${key}`);
      const fresh = await fetcher();
      await setCache(key, category, fresh, supabase);
      console.log(`[Cache] Revalidated: ${key}`);
    } catch (error) {
      console.error(`[Cache] Revalidation failed for ${key}:`, error);
    }
  };

  // @ts-ignore - EdgeRuntime is available in Deno Deploy
  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
    // @ts-ignore
    EdgeRuntime.waitUntil(revalidate());
  } else {
    // Fire and forget
    revalidate().catch(() => {});
  }
}

/**
 * Generate a cache key from components
 */
export function makeCacheKey(...parts: string[]): string {
  return parts
    .map((p) => p.toLowerCase().trim())
    .filter(Boolean)
    .join(':');
}

/**
 * Check if a key exists in cache (without fetching)
 */
export async function hasCache(
  key: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { data } = await supabase
    .from('api_cache')
    .select('cache_key')
    .eq('cache_key', key)
    .single();

  return !!data;
}

/**
 * Get cache entry age in seconds
 */
export async function getCacheAge(
  key: string,
  supabase: SupabaseClient
): Promise<number | null> {
  const { data } = await supabase
    .from('api_cache')
    .select('fetched_at')
    .eq('cache_key', key)
    .single();

  if (!data) return null;

  const fetchedAt = new Date(data.fetched_at).getTime();
  return Math.floor((Date.now() - fetchedAt) / 1000);
}
