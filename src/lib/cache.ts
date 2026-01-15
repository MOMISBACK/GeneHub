import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GeneSummary } from './api';
import { cachedStorage, storage } from './storage';

const FAVORITES_KEY = 'saved_genes';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export type SavedGene = {
  id: string;
  symbol: string;
  organism: string;
  proteinName?: string;
  savedAt: string;
  // Cached summary for quick display
  data?: GeneSummary;
};

/**
 * Normalize gene symbol for consistent storage/lookup
 * dnaA, DnaA, DNAA -> dnaa
 */
function normalizeSymbol(symbol: string): string {
  return symbol.toLowerCase().trim();
}

/**
 * Normalize organism name
 * E. coli, e.coli, E.Coli -> e. coli
 */
function normalizeOrganism(organism: string): string {
  return organism.toLowerCase().trim();
}

// ============ Cache Functions ============

function getCacheKey(symbol: string, organism: string): string {
  return `genes:${normalizeSymbol(symbol)}:${normalizeOrganism(organism)}`;
}

export async function getCachedGene(symbol: string, organism: string): Promise<GeneSummary | null> {
  try {
    const key = getCacheKey(symbol, organism);
    return await cachedStorage.get<GeneSummary>(key);
  } catch {
    return null;
  }
}

export async function setCachedGene(symbol: string, organism: string, data: GeneSummary): Promise<void> {
  try {
    const key = getCacheKey(symbol, organism);
    await cachedStorage.set(key, data, CACHE_DURATION_MS);
  } catch {
    // Ignore cache errors
  }
}

// ============ Saved Genes (Favorites) ============

export async function getSavedGenes(): Promise<SavedGene[]> {
  try {
    const data = await AsyncStorage.getItem(FAVORITES_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveGene(symbol: string, organism: string, data?: GeneSummary): Promise<void> {
  const genes = await getSavedGenes();
  
  // Normalize for comparison
  const normSymbol = normalizeSymbol(symbol);
  const normOrganism = normalizeOrganism(organism);
  
  // Check if already saved (case-insensitive)
  const existingIndex = genes.findIndex(
    (g) => normalizeSymbol(g.symbol) === normSymbol && normalizeOrganism(g.organism) === normOrganism
  );
  
  // Store with normalized symbol but original casing for display
  const displaySymbol = data?.symbol || symbol;
  
  const savedGene: SavedGene = {
    id: `${normSymbol}_${normOrganism}_${Date.now()}`,
    symbol: displaySymbol,
    organism: data?.organism || organism,
    proteinName: data?.proteinName ?? data?.name,
    savedAt: new Date().toISOString(),
    data,
  };

  if (existingIndex >= 0) {
    // Update existing
    genes[existingIndex] = { ...genes[existingIndex], ...savedGene, id: genes[existingIndex].id };
  } else {
    // Add new at the beginning
    genes.unshift(savedGene);
  }

  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(genes));
}

export async function removeSavedGene(symbol: string, organism: string): Promise<void> {
  const genes = await getSavedGenes();
  const normSymbol = normalizeSymbol(symbol);
  const normOrganism = normalizeOrganism(organism);
  const filtered = genes.filter(
    (g) => !(normalizeSymbol(g.symbol) === normSymbol && normalizeOrganism(g.organism) === normOrganism)
  );
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
}

export async function isGeneSaved(symbol: string, organism: string): Promise<boolean> {
  const genes = await getSavedGenes();
  const normSymbol = normalizeSymbol(symbol);
  const normOrganism = normalizeOrganism(organism);
  return genes.some(
    (g) => normalizeSymbol(g.symbol) === normSymbol && normalizeOrganism(g.organism) === normOrganism
  );
}

export async function clearAllCache(): Promise<void> {
  try {
    const keys = await storage.getAllKeys();
    const legacyKeys = keys.filter((k) => k.startsWith('gene_cache_'));
    const newKeys = keys.filter((k) => k.startsWith('genes:'));
    const allKeys = [...legacyKeys, ...newKeys];
    if (allKeys.length > 0) {
      await storage.multiRemove(allKeys);
    }
  } catch {
    // Ignore
  }
}
