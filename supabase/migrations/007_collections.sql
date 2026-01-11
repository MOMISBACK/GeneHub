-- Migration 007: Collections System
-- Organize genes, articles, researchers, conferences into user collections
-- Depends on: 006_articles_external_ids.sql

-- ============================================
-- 0. ARTICLE DEDUPLICATION (unique external_source + external_id)
-- ============================================

-- Add unique constraint on external_source + external_id
-- This prevents duplicate imports from PubMed/Crossref
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_external_unique 
ON public.articles(external_source, external_id) 
WHERE external_source IS NOT NULL AND external_id IS NOT NULL;

COMMENT ON INDEX idx_articles_external_unique IS 'Prevent duplicate articles from same source (PMID, DOI)';

-- ============================================
-- 1. COLLECTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  color TEXT, -- Hex color for UI
  icon TEXT,  -- Icon name
  
  -- Ordering
  position INTEGER DEFAULT 0,
  
  -- Pinned items appear first
  is_pinned BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique name per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_collections_user_name 
ON public.collections(user_id, name);

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_position ON public.collections(user_id, position);

-- ============================================
-- 2. COLLECTION ITEMS (polymorphic)
-- ============================================

CREATE TABLE IF NOT EXISTS public.collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  
  -- Polymorphic reference
  entity_type TEXT NOT NULL CHECK (entity_type IN ('gene', 'researcher', 'article', 'conference')),
  entity_id TEXT NOT NULL, -- UUID as text, or gene_symbol for genes
  
  -- Display name for UI (cached)
  display_name TEXT,
  
  -- Optional note specific to this item in this collection
  note TEXT,
  
  -- Ordering within collection
  position INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique: one entity per collection
CREATE UNIQUE INDEX IF NOT EXISTS idx_collection_items_unique 
ON public.collection_items(collection_id, entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON public.collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_user ON public.collection_items(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_entity ON public.collection_items(entity_type, entity_id);

-- ============================================
-- 3. TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS trg_collections_updated_at ON public.collections;
CREATE TRIGGER trg_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ============================================
-- 4. RLS POLICIES (Owner-only)
-- ============================================

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- Collections: owner-only
DROP POLICY IF EXISTS collections_select_own ON public.collections;
CREATE POLICY collections_select_own ON public.collections
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS collections_insert_own ON public.collections;
CREATE POLICY collections_insert_own ON public.collections
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS collections_update_own ON public.collections;
CREATE POLICY collections_update_own ON public.collections
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS collections_delete_own ON public.collections;
CREATE POLICY collections_delete_own ON public.collections
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Collection items: owner-only
DROP POLICY IF EXISTS collection_items_select_own ON public.collection_items;
CREATE POLICY collection_items_select_own ON public.collection_items
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS collection_items_insert_own ON public.collection_items;
CREATE POLICY collection_items_insert_own ON public.collection_items
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS collection_items_update_own ON public.collection_items;
CREATE POLICY collection_items_update_own ON public.collection_items
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS collection_items_delete_own ON public.collection_items;
CREATE POLICY collection_items_delete_own ON public.collection_items
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 6. COMMENTS
-- ============================================

COMMENT ON TABLE public.collections IS 'User collections for organizing genes, articles, researchers, conferences';
COMMENT ON TABLE public.collection_items IS 'Items within a collection (polymorphic)';
COMMENT ON COLUMN public.collection_items.entity_type IS 'Type: gene, researcher, article, conference';
COMMENT ON COLUMN public.collection_items.entity_id IS 'ID of entity (UUID or gene_symbol)';
