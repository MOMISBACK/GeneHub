/**
 * useNotes - Hook for loading and managing notes for an entity
 */

import { useState, useEffect, useCallback } from 'react';
import type { EntityNote, EntityType } from '../../types/knowledge';
import { listNotesForEntity } from '../../lib/knowledge';

export function useNotes(entityType: EntityType, entityId: string) {
  const [notes, setNotes] = useState<EntityNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!entityId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await listNotesForEntity(entityType, entityId);
      setNotes(data);
    } catch (e: any) {
      // Don't show error if table doesn't exist yet
      if (!e.message?.includes('does not exist')) {
        setError(e.message);
      }
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    notes,
    loading,
    error,
    refresh: load,
  };
}
