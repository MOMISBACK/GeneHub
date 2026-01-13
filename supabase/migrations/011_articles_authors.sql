-- Migration 011: Add authors field to articles
-- Stores author names for display and tag generation

-- ============================================================================
-- ADD authors COLUMN TO ARTICLES
-- ============================================================================

ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS authors TEXT;

-- Index for author search
CREATE INDEX IF NOT EXISTS idx_articles_authors ON public.articles USING gin(to_tsvector('english', coalesce(authors, '')));

-- Comment
COMMENT ON COLUMN public.articles.authors IS 'Formatted author names (e.g., "Smith J., Doe A., ..."). First author used for citation tags.';
