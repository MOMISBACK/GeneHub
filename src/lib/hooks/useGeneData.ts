/**
 * useGeneData - Hook for loading and managing gene data
 * 
 * Handles:
 * - Loading gene summary from cache or API
 * - Loading BioCyc data
 * - Refreshing data
 * - Save/unsave functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';

import { getGeneSummary, getBiocycData, type GeneSummary, type BiocycGeneData } from '../api';
import { getCachedGene, setCachedGene, saveGene, removeSavedGene, isGeneSaved } from '../cache';
import { logGeneView } from '../db';

export type UseGeneDataResult = {
  // State
  loading: boolean;
  data: GeneSummary | null;
  biocycData: BiocycGeneData | null;
  error: string | null;
  isSaved: boolean;
  
  // Actions
  refresh: () => Promise<void>;
  toggleSave: () => Promise<void>;
};

export function useGeneData(
  symbol: string,
  organism: string,
  t: { common: { error: string }; errors: { unknown: string } }
): UseGeneDataResult {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GeneSummary | null>(null);
  const [biocycData, setBiocycData] = useState<BiocycGeneData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Check if gene is saved
  const checkIfSaved = useCallback(async () => {
    const saved = await isGeneSaved(symbol, organism);
    setIsSaved(saved);
  }, [symbol, organism]);

  // Load BioCyc data
  const loadBiocycData = useCallback(async () => {
    try {
      const response = await getBiocycData(symbol, organism);
      if (response.success && response.data) {
        setBiocycData(response.data);
      }
    } catch {
      console.log('[BioCyc] Data not available for', symbol);
    }
  }, [symbol, organism]);

  // Refresh data from API
  const refresh = useCallback(async () => {
    try {
      const result = await getGeneSummary(symbol, organism);
      setData(result);
      await setCachedGene(symbol, organism, result);
    } catch {
      // Silently fail on refresh
    }
  }, [symbol, organism]);

  // Load initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try cache first
      const cached = await getCachedGene(symbol, organism);
      if (cached) {
        setData(cached);
        setLoading(false);
        // Background refresh
        refresh();
        loadBiocycData();
        return;
      }

      // Fetch from API
      const result = await getGeneSummary(symbol, organism);
      setData(result);
      await setCachedGene(symbol, organism, result);
      loadBiocycData();
    } catch (e: any) {
      setError(e?.message ?? t.errors.unknown);
    } finally {
      setLoading(false);
    }
  }, [symbol, organism, t.errors.unknown, refresh, loadBiocycData]);

  // Toggle save status
  const toggleSave = useCallback(async () => {
    try {
      if (isSaved) {
        await removeSavedGene(symbol, organism);
        setIsSaved(false);
      } else if (data) {
        await saveGene(symbol, organism, data);
        setIsSaved(true);
      }
    } catch (e: any) {
      Alert.alert(t.common.error, e?.message ?? String(e));
    }
  }, [isSaved, symbol, organism, data, t.common.error]);

  // Initial load
  useEffect(() => {
    loadData();
    checkIfSaved();
    logGeneView(symbol, organism, null).catch(console.error);
  }, [symbol, organism, loadData, checkIfSaved]);

  return {
    loading,
    data,
    biocycData,
    error,
    isSaved,
    refresh,
    toggleSave,
  };
}
