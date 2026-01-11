-- Migration 004: Inbox (Capture Rapide)
-- Table pour collecter rapidement des items à traiter plus tard

-- ============================================
-- Table inbox_items
-- ============================================
CREATE TABLE IF NOT EXISTS public.inbox_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Statut du workflow
  status TEXT NOT NULL DEFAULT 'inbox' CHECK (status IN ('inbox', 'archived', 'converted')),
  
  -- Contenu brut capturé
  raw TEXT NOT NULL,
  
  -- Détection automatique du type
  detected_type TEXT CHECK (detected_type IN ('pmid', 'doi', 'url', 'text')),
  
  -- Valeur normalisée (ex: PMID sans préfixe, DOI clean)
  normalized TEXT,
  
  -- Métadonnées enrichies (après fetch ou manuel)
  title TEXT,
  note TEXT,
  source_url TEXT,
  
  -- Tags (array de strings pour simplicité)
  tags TEXT[] DEFAULT '{}',
  
  -- Lien vers l'entité convertie
  converted_entity_type TEXT CHECK (converted_entity_type IN ('article', 'note', 'researcher', 'conference')),
  converted_entity_id UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_inbox_user_id ON public.inbox_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inbox_status ON public.inbox_items(status);
CREATE INDEX IF NOT EXISTS idx_inbox_user_status ON public.inbox_items(user_id, status);
CREATE INDEX IF NOT EXISTS idx_inbox_detected_type ON public.inbox_items(detected_type);
CREATE INDEX IF NOT EXISTS idx_inbox_created_at ON public.inbox_items(created_at DESC);

-- ============================================
-- Trigger pour updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_inbox_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_inbox_updated_at ON public.inbox_items;
CREATE TRIGGER trigger_inbox_updated_at
  BEFORE UPDATE ON public.inbox_items
  FOR EACH ROW
  EXECUTE FUNCTION update_inbox_updated_at();

-- ============================================
-- RLS Policies (Owner-only)
-- ============================================
ALTER TABLE public.inbox_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own items
DROP POLICY IF EXISTS inbox_select_own ON public.inbox_items;
CREATE POLICY inbox_select_own ON public.inbox_items
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own items
DROP POLICY IF EXISTS inbox_insert_own ON public.inbox_items;
CREATE POLICY inbox_insert_own ON public.inbox_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own items
DROP POLICY IF EXISTS inbox_update_own ON public.inbox_items;
CREATE POLICY inbox_update_own ON public.inbox_items
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own items
DROP POLICY IF EXISTS inbox_delete_own ON public.inbox_items;
CREATE POLICY inbox_delete_own ON public.inbox_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE public.inbox_items IS 'Capture rapide - items à traiter (PMID, DOI, URL, texte libre)';
COMMENT ON COLUMN public.inbox_items.raw IS 'Texte brut capturé par l''utilisateur';
COMMENT ON COLUMN public.inbox_items.detected_type IS 'Type détecté automatiquement: pmid, doi, url, text';
COMMENT ON COLUMN public.inbox_items.normalized IS 'Valeur nettoyée (ex: 12345678 pour PMID:12345678)';
COMMENT ON COLUMN public.inbox_items.converted_entity_type IS 'Type d''entité après conversion';
COMMENT ON COLUMN public.inbox_items.converted_entity_id IS 'ID de l''entité créée après conversion';
