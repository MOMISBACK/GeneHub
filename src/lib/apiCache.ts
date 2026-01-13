/**
 * API Cache Service
 * 
 * Shared cache for external API results (NCBI, UniProt, Crossref, PubMed).
 * All users benefit from cached responses - reduces API calls and improves performance.
 * 
 * Cache is stored in Supabase with automatic TTL expiration.
 * Uses MD5 hash as cache key for fast lookups and minimal storage.
 */

import { supabaseWithAuth } from './supabase';
import { Platform } from 'react-native';

// Cache TTL in hours by source
const CACHE_TTL_HOURS: Record<string, number> = {
  ncbi: 168,      // 7 days - gene data changes rarely
  uniprot: 168,   // 7 days
  crossref: 72,   // 3 days - DOI metadata stable
  pubmed: 72,     // 3 days
  default: 24,    // 1 day fallback
};

type CacheSource = 'ncbi' | 'uniprot' | 'crossref' | 'pubmed';

/**
 * Generate a simple hash for cache key
 * Uses a fast string hash instead of MD5 for client-side efficiency
 */
function generateCacheKey(source: string, requestId: string): string {
  const input = `${source}:${requestId.toLowerCase().trim()}`;
  
  // Simple djb2 hash - fast and good distribution
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to hex string with source prefix for debugging
  return `${source}_${(hash >>> 0).toString(16)}`;
}

/**
 * Get cached API response
 * Returns null if not found or expired
 */
export async function getApiCache<T>(
  source: CacheSource,
  requestId: string
): Promise<T | null> {
  try {
    const cacheKey = generateCacheKey(source, requestId);
    
    // Try to get from Supabase using the helper function
    const { data, error } = await supabaseWithAuth
      .rpc('get_api_cache', { p_cache_key: cacheKey });
    
    if (error) {
      // Table might not exist yet - silent fail
      if (error.code === '42P01' || error.code === '42883') {
        return null;
      }
      console.warn('[apiCache] Get error:', error.message);
      return null;
    }
    
    if (data) {
      if (__DEV__) {
        console.log(`[apiCache] HIT ${source}:${requestId.substring(0, 20)}`);
      }
      return data as T;
    }
    
    return null;
  } catch (e) {
    // Silent fail - cache miss is not critical
    return null;
  }
}

/**
 * Store API response in cache
 */
export async function setApiCache<T>(
  source: CacheSource,
  requestId: string,
  data: T
): Promise<void> {
  try {
    const cacheKey = generateCacheKey(source, requestId);
    const ttlHours = CACHE_TTL_HOURS[source] || CACHE_TTL_HOURS.default;
    
    // Use the helper function for upsert
    const { error } = await supabaseWithAuth
      .rpc('set_api_cache', {
        p_cache_key: cacheKey,
        p_source: source,
        p_request_id: requestId.substring(0, 100), // Truncate for storage
        p_data: data,
        p_ttl_hours: ttlHours,
      });
    
    if (error) {
      // Table might not exist yet - silent fail
      if (error.code === '42P01' || error.code === '42883') {
        return;
      }
      console.warn('[apiCache] Set error:', error.message);
    } else if (__DEV__) {
      console.log(`[apiCache] STORED ${source}:${requestId.substring(0, 20)} (TTL: ${ttlHours}h)`);
    }
  } catch (e) {
    // Silent fail - cache write failure is not critical
  }
}

/**
 * Wrapper for API calls with automatic caching
 * 
 * @example
 * const geneData = await withApiCache(
 *   'ncbi',
 *   `gene_${symbol}_${organism}`,
 *   () => fetchGeneFromNCBI(symbol, organism)
 * );
 */
export async function withApiCache<T>(
  source: CacheSource,
  requestId: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Try cache first
  const cached = await getApiCache<T>(source, requestId);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch from API
  const data = await fetchFn();
  
  // Store in cache (fire and forget)
  setApiCache(source, requestId, data).catch(() => {});
  
  return data;
}

/**
 * Check if cache table is available
 * Returns true if migrations have been applied
 */
export async function isApiCacheAvailable(): Promise<boolean> {
  try {
    const { error } = await supabaseWithAuth
      .from('api_cache')
      .select('cache_key')
      .limit(0);
    
    return !error;
  } catch {
    return false;
  }
}
