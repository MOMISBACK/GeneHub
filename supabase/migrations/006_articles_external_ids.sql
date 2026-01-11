-- Migration 006: Add external_source and external_id to articles
-- Required for deduplication and PubMed/Crossref import tracking

-- ============================================
-- 1. ADD COLUMNS
-- ============================================

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS external_source TEXT,
  ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Comment the new columns
COMMENT ON COLUMN public.articles.external_source IS 'Source: pubmed, crossref, manual';
COMMENT ON COLUMN public.articles.external_id IS 'External ID: PMID for pubmed, DOI for crossref';

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_articles_external_source
  ON public.articles (external_source);

CREATE INDEX IF NOT EXISTS idx_articles_external_id
  ON public.articles (external_id);

-- ============================================
-- 3. BACKFILL EXISTING DATA
-- ============================================

-- Backfill external_source/external_id from existing pmid/doi columns
UPDATE public.articles
SET 
  external_source = 'pubmed',
  external_id = pmid
WHERE pmid IS NOT NULL AND external_id IS NULL;

UPDATE public.articles
SET 
  external_source = 'crossref',
  external_id = doi
WHERE doi IS NOT NULL AND external_id IS NULL AND external_source IS NULL;
