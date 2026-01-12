/**
 * Storage abstraction layer
 * Handles platform differences and provides consistent API
 * 
 * Web: localStorage (5MB limit, synchronous under the hood)
 * Native: AsyncStorage (unlimited, truly async)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { isWeb, storage as platformStorage } from './platform';

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
  multiGet(keys: string[]): Promise<readonly [string, string | null][]>;
  multiRemove(keys: string[]): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Primary storage adapter using AsyncStorage
 * Works on both web (via localStorage polyfill) and native
 */
export const storage: StorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn(`[Storage] Failed to get "${key}":`, error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      // Check size limit on web
      if (isWeb && value.length > platformStorage.maxStorageSize) {
        console.warn(`[Storage] Value too large for web storage: ${value.length} bytes`);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.warn(`[Storage] Failed to set "${key}":`, error);
      // On web, might be QuotaExceededError
      if (isWeb && (error as Error)?.name === 'QuotaExceededError') {
        console.warn('[Storage] Web storage quota exceeded');
      }
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn(`[Storage] Failed to remove "${key}":`, error);
    }
  },

  async getAllKeys(): Promise<readonly string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.warn('[Storage] Failed to get all keys:', error);
      return [];
    }
  },

  async multiGet(keys: string[]): Promise<readonly [string, string | null][]> {
    try {
      return await AsyncStorage.multiGet(keys);
    } catch (error) {
      console.warn('[Storage] Failed to multi-get:', error);
      return keys.map(k => [k, null]);
    }
  },

  async multiRemove(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.warn('[Storage] Failed to multi-remove:', error);
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.warn('[Storage] Failed to clear:', error);
    }
  },
};

/**
 * Typed storage helpers with JSON serialization
 */
export const typedStorage = {
  async get<T>(key: string): Promise<T | null> {
    const value = await storage.getItem(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      console.warn(`[Storage] Failed to parse JSON for "${key}"`);
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    await storage.setItem(key, JSON.stringify(value));
  },

  async remove(key: string): Promise<void> {
    await storage.removeItem(key);
  },

  async update<T>(key: string, updater: (current: T | null) => T): Promise<void> {
    const current = await typedStorage.get<T>(key);
    const updated = updater(current);
    await typedStorage.set(key, updated);
  },
};

/**
 * Storage with TTL (Time To Live) support
 */
interface CachedValue<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
}

export const cachedStorage = {
  async get<T>(key: string): Promise<T | null> {
    const cached = await typedStorage.get<CachedValue<T>>(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiresAt) {
      await storage.removeItem(key);
      return null;
    }
    
    return cached.data;
  },

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    const now = Date.now();
    const cached: CachedValue<T> = {
      data: value,
      cachedAt: now,
      expiresAt: now + ttlMs,
    };
    await typedStorage.set(key, cached);
  },

  async getWithMetadata<T>(key: string): Promise<{ data: T; age: number; isStale: boolean } | null> {
    const cached = await typedStorage.get<CachedValue<T>>(key);
    if (!cached) return null;
    
    const now = Date.now();
    const age = now - cached.cachedAt;
    const isStale = now > cached.expiresAt;
    
    return { data: cached.data, age, isStale };
  },

  /**
   * Get stale data while revalidating
   * Returns cached data immediately (even if stale), triggers revalidation in background
   */
  async getStaleWhileRevalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number
  ): Promise<{ data: T | null; isStale: boolean; isRevalidating: boolean }> {
    const cached = await this.getWithMetadata<T>(key);
    
    if (!cached) {
      // No cache, must fetch
      const data = await fetcher();
      await this.set(key, data, ttlMs);
      return { data, isStale: false, isRevalidating: false };
    }
    
    if (cached.isStale) {
      // Return stale data, revalidate in background
      fetcher().then(data => this.set(key, data, ttlMs)).catch(console.error);
      return { data: cached.data, isStale: true, isRevalidating: true };
    }
    
    return { data: cached.data, isStale: false, isRevalidating: false };
  },
};

/**
 * Namespace storage to avoid key collisions
 */
export function createNamespacedStorage(namespace: string) {
  const prefix = `${namespace}:`;
  
  return {
    async get<T>(key: string): Promise<T | null> {
      return typedStorage.get<T>(prefix + key);
    },
    
    async set<T>(key: string, value: T): Promise<void> {
      return typedStorage.set(prefix + key, value);
    },
    
    async remove(key: string): Promise<void> {
      return storage.removeItem(prefix + key);
    },
    
    async clear(): Promise<void> {
      const allKeys = await storage.getAllKeys();
      const namespacedKeys = allKeys.filter(k => k.startsWith(prefix));
      if (namespacedKeys.length > 0) {
        await storage.multiRemove([...namespacedKeys]);
      }
    },
    
    async getAllKeys(): Promise<string[]> {
      const allKeys = await storage.getAllKeys();
      return allKeys
        .filter(k => k.startsWith(prefix))
        .map(k => k.slice(prefix.length));
    },
  };
}

// Pre-configured namespaced storage instances
export const geneCache = createNamespacedStorage('gene_cache');
export const userPrefs = createNamespacedStorage('user_prefs');
export const authStorage = createNamespacedStorage('auth');
