/**
 * Sync Status Store
 * Track pending/failed mutations for UI visibility
 */

import { create } from 'zustand';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface PendingMutation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string; // 'article', 'note', 'tag', etc.
  description: string;
  timestamp: number;
  retryCount: number;
  error?: string;
}

interface SyncState {
  status: SyncStatus;
  pendingMutations: PendingMutation[];
  failedMutations: PendingMutation[];
  lastSyncAt: number | null;
  isOnline: boolean;

  // Actions
  setOnline: (online: boolean) => void;
  addPending: (mutation: Omit<PendingMutation, 'id' | 'timestamp' | 'retryCount'>) => string;
  markSuccess: (id: string) => void;
  markFailed: (id: string, error: string) => void;
  retry: (id: string) => void;
  clearFailed: (id: string) => void;
  clearAllFailed: () => void;
}

let mutationCounter = 0;

export const useSyncStore = create<SyncState>((set, get) => ({
  status: 'idle',
  pendingMutations: [],
  failedMutations: [],
  lastSyncAt: null,
  isOnline: true,

  setOnline: (online) => {
    set({ 
      isOnline: online,
      status: online ? (get().pendingMutations.length > 0 ? 'syncing' : 'idle') : 'offline',
    });
  },

  addPending: (mutation) => {
    const id = `mutation_${++mutationCounter}_${Date.now()}`;
    const newMutation: PendingMutation = {
      ...mutation,
      id,
      timestamp: Date.now(),
      retryCount: 0,
    };

    set((state) => ({
      pendingMutations: [...state.pendingMutations, newMutation],
      status: 'syncing',
    }));

    return id;
  },

  markSuccess: (id) => {
    set((state) => {
      const remaining = state.pendingMutations.filter((m) => m.id !== id);
      return {
        pendingMutations: remaining,
        status: remaining.length === 0 ? 'idle' : 'syncing',
        lastSyncAt: Date.now(),
      };
    });
  },

  markFailed: (id, error) => {
    set((state) => {
      const mutation = state.pendingMutations.find((m) => m.id === id);
      if (!mutation) return state;

      const failed: PendingMutation = {
        ...mutation,
        error,
        retryCount: mutation.retryCount + 1,
      };

      return {
        pendingMutations: state.pendingMutations.filter((m) => m.id !== id),
        failedMutations: [...state.failedMutations, failed],
        status: state.pendingMutations.length <= 1 ? 'error' : 'syncing',
      };
    });
  },

  retry: (id) => {
    set((state) => {
      const mutation = state.failedMutations.find((m) => m.id === id);
      if (!mutation) return state;

      const retrying: PendingMutation = {
        ...mutation,
        error: undefined,
      };

      return {
        failedMutations: state.failedMutations.filter((m) => m.id !== id),
        pendingMutations: [...state.pendingMutations, retrying],
        status: 'syncing',
      };
    });
  },

  clearFailed: (id) => {
    set((state) => ({
      failedMutations: state.failedMutations.filter((m) => m.id !== id),
      status: state.failedMutations.length <= 1 && state.pendingMutations.length === 0 
        ? 'idle' 
        : state.status,
    }));
  },

  clearAllFailed: () => {
    set((state) => ({
      failedMutations: [],
      status: state.pendingMutations.length === 0 ? 'idle' : 'syncing',
    }));
  },
}));

/**
 * Hook for tracking a mutation
 */
export function useTrackedMutation() {
  const { addPending, markSuccess, markFailed } = useSyncStore();

  return async <T>(
    operation: () => Promise<T>,
    meta: { type: PendingMutation['type']; entity: string; description: string }
  ): Promise<T> => {
    const id = addPending(meta);
    try {
      const result = await operation();
      markSuccess(id);
      return result;
    } catch (error: any) {
      markFailed(id, error.message || 'Erreur inconnue');
      throw error;
    }
  };
}
