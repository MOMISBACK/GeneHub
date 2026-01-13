-- Migration 010: Shared API Cache
-- Efficient shared cache for external API results (NCBI, UniProt, Crossref, PubMed)
-- All users benefit from cached API calls - no duplicate requests
-- Optimized for low storage and fast lookups

-- ============================================================================
-- DROP EXISTING TABLE IF EXISTS (clean slate approach)
-- ============================================================================

DROP TABLE IF EXISTS public.api_cache CASCADE;

-- ============================================================================
-- API CACHE TABLE
-- ============================================================================

CREATE TABLE public.api_cache (
  -- Use hash of (source + endpoint) as primary key for fast lookup
  -- This avoids storing long URLs
  cache_key TEXT PRIMARY KEY,
  
  -- Source identifier (ncbi, uniprot, crossref, pubmed)
  source TEXT NOT NULL,
  
  -- Original request identifier (gene symbol, DOI, PMID, etc.)
  -- Stored for debugging/inspection only
  request_id TEXT NOT NULL,
  
  -- Response data as JSONB (compressed by PostgreSQL)
  data JSONB NOT NULL,
  
  -- TTL management
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Hit counter for analytics (optional, lightweight)
  hit_count INTEGER NOT NULL DEFAULT 0
);

-- Index for cleanup job (expired entries)
CREATE INDEX idx_api_cache_expires ON public.api_cache(expires_at);

-- Index for source-based queries
CREATE INDEX idx_api_cache_source ON public.api_cache(source);

-- ============================================================================
-- RLS: Readable by all authenticated, writable by all authenticated
-- ============================================================================

ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "api_cache_select" ON public.api_cache;
DROP POLICY IF EXISTS "api_cache_insert" ON public.api_cache;
DROP POLICY IF EXISTS "api_cache_update" ON public.api_cache;

-- Everyone can read cache
CREATE POLICY "api_cache_select" ON public.api_cache
  FOR SELECT TO authenticated USING (true);

-- Everyone can insert (upsert)
CREATE POLICY "api_cache_insert" ON public.api_cache
  FOR INSERT TO authenticated WITH CHECK (true);

-- Everyone can update (increment hit_count)
CREATE POLICY "api_cache_update" ON public.api_cache
  FOR UPDATE TO authenticated USING (true);

-- Only service role can delete (cleanup job)
-- No delete policy for authenticated = they can't delete

-- ============================================================================
-- HELPER FUNCTION: Get from cache with auto-increment hit count
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_api_cache(p_cache_key TEXT)
RETURNS JSONB AS $$
DECLARE
  v_data JSONB;
BEGIN
  -- Get data if not expired
  UPDATE public.api_cache
  SET hit_count = hit_count + 1
  WHERE cache_key = p_cache_key
    AND expires_at > NOW()
  RETURNING data INTO v_data;
  
  RETURN v_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION: Set cache with TTL
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_api_cache(
  p_cache_key TEXT,
  p_source TEXT,
  p_request_id TEXT,
  p_data JSONB,
  p_ttl_hours INTEGER DEFAULT 24
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.api_cache (cache_key, source, request_id, data, expires_at)
  VALUES (
    p_cache_key,
    p_source,
    p_request_id,
    p_data,
    NOW() + (p_ttl_hours || ' hours')::INTERVAL
  )
  ON CONFLICT (cache_key) DO UPDATE SET
    data = EXCLUDED.data,
    expires_at = NOW() + (p_ttl_hours || ' hours')::INTERVAL,
    hit_count = public.api_cache.hit_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CLEANUP FUNCTION: Remove expired entries (run periodically)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_api_cache()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM public.api_cache
  WHERE expires_at < NOW()
  RETURNING 1 INTO v_count;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.api_cache IS 'Shared cache for external API responses (NCBI, UniProt, etc.). All users benefit.';
COMMENT ON COLUMN public.api_cache.cache_key IS 'MD5 hash of source + request for fast lookup';
COMMENT ON COLUMN public.api_cache.data IS 'JSONB response data - automatically compressed by PostgreSQL';
COMMENT ON COLUMN public.api_cache.expires_at IS 'TTL expiration timestamp';
COMMENT ON COLUMN public.api_cache.hit_count IS 'Number of cache hits - useful for analytics';
