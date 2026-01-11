-- API Management Tables for GeneHub Bacteria
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. API Cache Table
-- ============================================
-- Stores cached API responses with TTL support

CREATE TABLE IF NOT EXISTS public.api_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_api_cache_key ON public.api_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_api_cache_expires ON public.api_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_cache_category ON public.api_cache(category);

-- Auto-cleanup of expired cache entries (run periodically via cron or pg_cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.api_cache 
  WHERE expires_at < NOW() - INTERVAL '1 day';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. API Metrics Table
-- ============================================
-- Tracks API call performance and errors

CREATE TABLE IF NOT EXISTS public.api_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api TEXT NOT NULL,
  endpoint TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'timeout', 'rate_limited')),
  latency_ms INTEGER,
  cache_hit BOOLEAN DEFAULT false,
  error_message TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Indexes for monitoring queries
CREATE INDEX IF NOT EXISTS idx_api_metrics_api_ts ON public.api_metrics(api, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_metrics_status ON public.api_metrics(status, timestamp DESC);

-- Partition by time for better performance (optional, for high volume)
-- CREATE INDEX IF NOT EXISTS idx_api_metrics_timestamp ON public.api_metrics(timestamp DESC);

-- ============================================
-- 3. Rate Limit State Table (Optional)
-- ============================================
-- Persistent rate limit state across Edge Function invocations

CREATE TABLE IF NOT EXISTS public.rate_limit_state (
  api TEXT PRIMARY KEY,
  tokens DECIMAL NOT NULL DEFAULT 10,
  last_refill TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Initialize rate limit state for known APIs
INSERT INTO public.rate_limit_state (api, tokens) VALUES
  ('ncbi', 10),
  ('uniprot', 50),
  ('biocyc', 1),
  ('string', 5),
  ('pdb', 20),
  ('alphafold', 20),
  ('kegg', 10)
ON CONFLICT (api) DO NOTHING;

-- ============================================
-- 4. BioCyc Session Cache
-- ============================================
-- Store BioCyc session cookies

CREATE TABLE IF NOT EXISTS public.biocyc_session (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- singleton
  cookies TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 5. RLS Policies
-- ============================================

-- api_cache: service role only (Edge Functions)
ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "api_cache_service_role" ON public.api_cache;
CREATE POLICY "api_cache_service_role"
ON public.api_cache
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- api_metrics: service role only
ALTER TABLE public.api_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "api_metrics_service_role" ON public.api_metrics;
CREATE POLICY "api_metrics_service_role"
ON public.api_metrics
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- rate_limit_state: service role only
ALTER TABLE public.rate_limit_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rate_limit_service_role" ON public.rate_limit_state;
CREATE POLICY "rate_limit_service_role"
ON public.rate_limit_state
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- biocyc_session: service role only
ALTER TABLE public.biocyc_session ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "biocyc_session_service_role" ON public.biocyc_session;
CREATE POLICY "biocyc_session_service_role"
ON public.biocyc_session
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 6. Helper Views for Monitoring
-- ============================================

-- API health overview (last hour)
CREATE OR REPLACE VIEW public.api_health AS
SELECT 
  api,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE status = 'success') as success_count,
  COUNT(*) FILTER (WHERE status = 'error') as error_count,
  COUNT(*) FILTER (WHERE status = 'timeout') as timeout_count,
  COUNT(*) FILTER (WHERE status = 'rate_limited') as rate_limited_count,
  ROUND(AVG(latency_ms)::numeric, 2) as avg_latency_ms,
  ROUND(100.0 * COUNT(*) FILTER (WHERE cache_hit) / NULLIF(COUNT(*), 0), 2) as cache_hit_rate
FROM public.api_metrics
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY api
ORDER BY total_calls DESC;

-- Cache stats
CREATE OR REPLACE VIEW public.cache_stats AS
SELECT 
  category,
  COUNT(*) as entries,
  COUNT(*) FILTER (WHERE expires_at > NOW()) as valid_entries,
  COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_entries,
  MIN(fetched_at) as oldest_entry,
  MAX(fetched_at) as newest_entry
FROM public.api_cache
GROUP BY category
ORDER BY entries DESC;

-- Grant access to views for authenticated users (read-only monitoring)
GRANT SELECT ON public.api_health TO authenticated;
GRANT SELECT ON public.cache_stats TO authenticated;
