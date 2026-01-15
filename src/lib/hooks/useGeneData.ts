/**
 * useGeneData - Hook for loading and managing gene data
 * 
 * Handles:
 * - Loading gene summary from cache or API
 * - Loading BioCyc data
 * - Refreshing data
 * - Save/unsave functionality
 * 
 * NOTE: API calls (NCBI, UniProt, EcoCyc/BioCyc) are currently DISABLED.
 * The app focuses on manual note-taking and tagging.
 * Set ENABLE_API_FETCH = true to re-enable automatic gene summaries.
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';

import { getGeneSummary, getBiocycData, type GeneSummary, type BiocycGeneData } from '../api';
import { getCachedGene, setCachedGene, saveGene, removeSavedGene, isGeneSaved, getSavedGenes } from '../cache';
import { logGeneView } from '../db';

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE FLAG: Enable/disable automatic API fetching for gene summaries
// Set to true to re-enable NCBI, UniProt, EcoCyc data fetching
// ═══════════════════════════════════════════════════════════════════════════════
const ENABLE_API_FETCH = false;

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

  // Load BioCyc data (DISABLED when ENABLE_API_FETCH is false)
  const loadBiocycData = useCallback(async () => {
    if (!ENABLE_API_FETCH) return; // Skip BioCyc when API disabled
    try {
      const response = await getBiocycData(symbol, organism);
      if (response.success && response.data) {
        setBiocycData(response.data);
      }
    } catch {
      console.log('[BioCyc] Data not available for', symbol);
    }
  }, [symbol, organism]);

  // Refresh data from API (DISABLED when ENABLE_API_FETCH is false)
  const refresh = useCallback(async () => {
    if (!ENABLE_API_FETCH) return; // Skip refresh when API disabled
    try {
      const result = await getGeneSummary(symbol, organism);
      setData(result);
      await setCachedGene(symbol, organism, result);
    } catch {
      // Silently fail on refresh
    }
  }, [symbol, organism]);

  // Load initial data
  // When ENABLE_API_FETCH is false, only loads from saved genes/cache
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try cache first
      const cached = await getCachedGene(symbol, organism);
      if (cached) {
        setData(cached);
        setLoading(false);
        if (ENABLE_API_FETCH) {
          // Background refresh only when API is enabled
          refresh();
          loadBiocycData();
        }
        return;
      }

      // Check if gene is in saved genes
      const savedGenes = await getSavedGenes();
      const normSymbol = symbol.toLowerCase().trim();
      const normOrganism = organism.toLowerCase().trim();
      const savedGene = savedGenes.find(
        g => g.symbol.toLowerCase().trim() === normSymbol && 
             g.organism.toLowerCase().trim() === normOrganism
      );
      
      if (savedGene?.data) {
        setData(savedGene.data);
        setLoading(false);
        return;
      }

      // When API is disabled, create a minimal gene object for new genes
      if (!ENABLE_API_FETCH) {
        const minimalGeneData: GeneSummary = {
          symbol: symbol,
          organism: organism,
          links: {},
          sources: [],
          fetchedAt: new Date().toISOString(),
        };
        setData(minimalGeneData);
        setLoading(false);
        return;
      }

      // Fetch from API (only when ENABLE_API_FETCH is true)
      const result = await getGeneSummary(symbol, organism);
      setData(result);
      await setCachedGene(symbol, organism, result);
      loadBiocycData();
    } catch (e: any) {
      // When API is disabled and we have an error, still show minimal data
      if (!ENABLE_API_FETCH) {
        const minimalGeneData: GeneSummary = {
          symbol: symbol,
          organism: organism,
          links: {},
          sources: [],
          fetchedAt: new Date().toISOString(),
        };
        setData(minimalGeneData);
      } else {
        setError(e?.message ?? t.errors.unknown);
      }
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
