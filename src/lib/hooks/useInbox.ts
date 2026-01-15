/**
 * useInbox - Hook for managing inbox items
 */

import { useState, useEffect, useCallback } from 'react';
import type { InboxItem, InboxStatus } from '../../types/inbox';
import {
  listInboxItems,
  listActiveInbox,
  listAllInbox,
  createInboxItem,
  archiveInboxItem,
  restoreInboxItem,
  deleteInboxItem,
  countInboxByStatus,
} from '../inbox';

export interface UseInboxResult {
  items: InboxItem[];
  loading: boolean;
  error: string | null;
  counts: Record<InboxStatus, number>;
  
  // Actions
  refresh: () => Promise<void>;
  add: (raw: string, options?: { title?: string; note?: string; tags?: string[] }) => Promise<InboxItem | null>;
  archive: (id: string) => Promise<boolean>;
  restore: (id: string) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
}

export interface UseInboxOptions {
  /** Filter by status. If not provided, shows 'inbox' only */
  status?: InboxStatus | 'all';
  /** Auto-refresh on mount */
  autoLoad?: boolean;
}

export function useInbox(options: UseInboxOptions = {}): UseInboxResult {
  const { status = 'inbox', autoLoad = true } = options;
  
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<InboxStatus, number>>({
    inbox: 0,
    archived: 0,
    converted: 0,
  });

  // Load items
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      if (status === 'all') {
        result = await listAllInbox();
      } else {
        result = await listInboxItems({ status });
      }
      
      if (result.error) throw result.error;
      setItems(result.data ?? []);
      
      // Also load counts
      const countsResult = await countInboxByStatus();
      if (countsResult.data) {
        setCounts(countsResult.data);
      }
    } catch (e: any) {
      // Don't show error if table doesn't exist yet
      if (!e.message?.includes('does not exist')) {
        setError(e.message);
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [load, autoLoad]);

  // Add new item
  const add = useCallback(async (
    raw: string,
    opts?: { title?: string; note?: string; tags?: string[] }
  ): Promise<InboxItem | null> => {
    try {
      const result = await createInboxItem(raw, opts);
      if (result.error) throw result.error;
      
      // Optimistic update
      if (result.data) {
        setItems(prev => [result.data!, ...prev]);
        setCounts(prev => ({ ...prev, inbox: prev.inbox + 1 }));
      }
      
      return result.data;
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  }, []);

  // Archive item
  const archive = useCallback(async (id: string): Promise<boolean> => {
    try {
      const result = await archiveInboxItem(id);
      if (result.error) throw result.error;
      
      // Update local state
      setItems(prev => prev.filter(item => item.id !== id));
      setCounts(prev => ({
        ...prev,
        inbox: Math.max(0, prev.inbox - 1),
        archived: prev.archived + 1,
      }));
      
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  }, []);

  // Restore item
  const restore = useCallback(async (id: string): Promise<boolean> => {
    try {
      const result = await restoreInboxItem(id);
      if (result.error) throw result.error;
      
      // Refresh to get updated list
      await load();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  }, [load]);

  // Delete item
  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Find item before deleting to update counts correctly
      const item = items.find(i => i.id === id);
      
      const result = await deleteInboxItem(id);
      if (result.error) throw result.error;
      
      // Update local state
      setItems(prev => prev.filter(i => i.id !== id));
      if (item) {
        setCounts(prev => ({
          ...prev,
          [item.status]: Math.max(0, prev[item.status] - 1),
        }));
      }
      
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  }, [items]);

  return {
    items,
    loading,
    error,
    counts,
    refresh: load,
    add,
    archive,
    restore,
    remove,
  };
}
