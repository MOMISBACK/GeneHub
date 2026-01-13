/**
 * Researchers Service
 * CRUD operations for researchers
 * Each user has their own independent researchers (isolated via user_id + RLS)
 */

import { supabaseWithAuth, wrapError, requireUserId } from './client';
import type {
  Researcher,
  ResearcherInsert,
  ResearcherUpdate,
  ResearcherWithRelations,
} from '../../types/knowledge';

export async function listResearchers(): Promise<Researcher[]> {
  const { data, error } = await supabaseWithAuth
    .from('researchers')
    .select('*')
    .order('name');

  if (error) throw wrapError('chercheurs', error);
  return data ?? [];
}

export async function getResearcher(id: string): Promise<ResearcherWithRelations | null> {
  const { data, error } = await supabaseWithAuth
    .from('researchers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw wrapError('chercheur', error);
  }

  // Get related genes
  const { data: geneRels } = await supabaseWithAuth
    .from('gene_researchers')
    .select('gene_symbol, organism, role')
    .eq('researcher_id', id);

  // Get related articles
  const { data: articleRels } = await supabaseWithAuth
    .from('article_researchers')
    .select('article:articles(*)')
    .eq('researcher_id', id);

  // Get related conferences
  const { data: confRels } = await supabaseWithAuth
    .from('conference_researchers')
    .select('conference:conferences(*)')
    .eq('researcher_id', id);

  return {
    ...data,
    genes: geneRels ?? [],
    articles: articleRels?.map((r: any) => r.article).filter(Boolean) ?? [],
    conferences: confRels?.map((r: any) => r.conference).filter(Boolean) ?? [],
  };
}

export async function createResearcher(researcher: ResearcherInsert): Promise<Researcher> {
  const userId = await requireUserId();
  
  const { data, error } = await supabaseWithAuth
    .from('researchers')
    .insert({ ...researcher, user_id: userId })
    .select()
    .single();

  if (error) throw wrapError('création chercheur', error);
  return data;
}

export async function updateResearcher(id: string, updates: ResearcherUpdate): Promise<Researcher> {
  const { data, error } = await supabaseWithAuth
    .from('researchers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw wrapError('mise à jour chercheur', error);
  return data;
}

export async function deleteResearcher(id: string): Promise<void> {
  const { error } = await supabaseWithAuth
    .from('researchers')
    .delete()
    .eq('id', id);

  if (error) throw wrapError('suppression chercheur', error);
}

/**
 * Get researchers for a specific gene
 */
export async function getResearchersForGene(geneSymbol: string, organism: string): Promise<Researcher[]> {
  const { data, error } = await supabaseWithAuth
    .from('gene_researchers')
    .select('researcher:researchers(*)')
    .eq('gene_symbol', geneSymbol)
    .eq('organism', organism);

  if (error) throw wrapError('chercheurs du gène', error);
  return data?.map((r: any) => r.researcher).filter(Boolean) ?? [];
}

/**
 * Link a researcher to a gene
 */
export async function linkGeneToResearcher(
  geneSymbol: string,
  organism: string,
  researcherId: string,
  role?: string
): Promise<void> {
  const userId = await requireUserId();
  
  const { error } = await supabaseWithAuth
    .from('gene_researchers')
    .insert({ gene_symbol: geneSymbol, organism, researcher_id: researcherId, role, user_id: userId });

  if (error && error.code !== '23505') {
    throw wrapError('liaison gène-chercheur', error);
  }
}

/**
 * Unlink a researcher from a gene
 */
export async function unlinkGeneFromResearcher(
  geneSymbol: string,
  organism: string,
  researcherId: string
): Promise<void> {
  const { error } = await supabaseWithAuth
    .from('gene_researchers')
    .delete()
    .eq('gene_symbol', geneSymbol)
    .eq('organism', organism)
    .eq('researcher_id', researcherId);

  if (error) throw wrapError('suppression liaison', error);
}

// ============================================================================
// Researcher Card Import (QR Code)
// ============================================================================

import type { ResearcherCardV1, MergeResult } from '../../types/researcherCard';

/**
 * Find existing researcher by ORCID or email
 */
async function findExistingResearcher(
  orcid: string | null | undefined,
  email: string | null | undefined
): Promise<Researcher | null> {
  // Priority 1: Match by ORCID
  if (orcid) {
    const { data, error } = await supabaseWithAuth
      .from('researchers')
      .select('*')
      .eq('orcid', orcid)
      .maybeSingle();
    
    if (!error && data) return data;
  }

  // Priority 2: Match by email (case-insensitive)
  if (email) {
    const normalizedEmail = email.toLowerCase().trim();
    const { data, error } = await supabaseWithAuth
      .from('researchers')
      .select('*')
      .ilike('email', normalizedEmail)
      .maybeSingle();
    
    if (!error && data) return data;
  }

  return null;
}

/**
 * Merge researcher card data into existing researcher
 * Strategy: don't overwrite non-empty existing fields with empty values
 */
function mergeResearcherData(
  existing: Researcher,
  card: ResearcherCardV1['profile']
): { updates: ResearcherUpdate; conflicts: string[] } {
  const updates: ResearcherUpdate = {};
  const conflicts: string[] = [];

  // Name: always update if different (it's required)
  if (card.name && card.name !== existing.name) {
    // Keep existing name but log conflict
    conflicts.push('name');
  }

  // Institution
  if (card.institution) {
    if (!existing.institution) {
      updates.institution = card.institution;
    } else if (card.institution !== existing.institution) {
      conflicts.push('institution');
    }
  }

  // Email
  if (card.email) {
    const normalizedEmail = card.email.toLowerCase().trim();
    if (!existing.email) {
      updates.email = normalizedEmail;
    } else if (normalizedEmail !== existing.email.toLowerCase().trim()) {
      conflicts.push('email');
    }
  }

  // ORCID
  if (card.orcid) {
    if (!existing.orcid) {
      updates.orcid = card.orcid;
    } else if (card.orcid !== existing.orcid) {
      conflicts.push('orcid');
    }
  }

  // Keywords -> specialization (map to existing field)
  if (card.keywords && card.keywords.length > 0) {
    const newKeywords = card.keywords.join(', ');
    if (!existing.specialization) {
      updates.specialization = newKeywords;
    } else {
      // Merge keywords: union of existing + new, max 20
      const existingKeywords = existing.specialization.split(',').map(k => k.trim()).filter(Boolean);
      const merged = [...new Set([...existingKeywords, ...card.keywords])].slice(0, 20);
      const mergedStr = merged.join(', ');
      if (mergedStr !== existing.specialization) {
        updates.specialization = mergedStr;
      }
    }
  }

  // URL -> we don't have a URL field in researchers, skip for now
  // Could add to notes or a future field

  return { updates, conflicts };
}

/**
 * Import a researcher from a QR card payload
 * Creates new or merges with existing based on ORCID/email match
 */
export async function importResearcherFromCard(card: ResearcherCardV1): Promise<MergeResult> {
  try {
    const { profile } = card;

    // Try to find existing researcher
    const existing = await findExistingResearcher(profile.orcid, profile.email);

    if (existing) {
      // Merge with existing
      const { updates, conflicts } = mergeResearcherData(existing, profile);

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        const updated = await updateResearcher(existing.id, updates);
        return {
          action: 'updated',
          researcher: { id: updated.id, name: updated.name },
          conflicts: conflicts.length > 0 ? conflicts : undefined,
        };
      }

      // No changes needed
      return {
        action: 'updated',
        researcher: { id: existing.id, name: existing.name },
        conflicts: conflicts.length > 0 ? conflicts : undefined,
      };
    }

    // Create new researcher
    const insertData: ResearcherInsert = {
      name: profile.name,
      institution: profile.institution || undefined,
      email: profile.email || undefined,
      orcid: profile.orcid || undefined,
      specialization: profile.keywords?.join(', ') || undefined,
    };

    const created = await createResearcher(insertData);
    return {
      action: 'created',
      researcher: { id: created.id, name: created.name },
    };
  } catch (error: any) {
    console.error('Import researcher error:', error);
    return {
      action: 'error',
      error: error.message || 'Erreur lors de l\'import',
    };
  }
}

