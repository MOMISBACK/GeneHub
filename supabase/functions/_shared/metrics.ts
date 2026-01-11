/**
 * API Metrics Module
 * 
 * Tracks API call performance, errors, and cache hits.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ApiName } from './rate-limiter.ts';

export type MetricStatus = 'success' | 'error' | 'timeout' | 'rate_limited';

export interface ApiMetric {
  api: ApiName | string;
  endpoint?: string;
  status: MetricStatus;
  latencyMs: number;
  cacheHit?: boolean;
  errorMessage?: string;
}

/**
 * Track an API call metric
 */
export async function trackApiCall(
  metric: ApiMetric,
  supabase?: SupabaseClient
): Promise<void> {
  // Skip if no supabase client
  if (!supabase) return;
  
  try {
    const { error } = await supabase.from('api_metrics').insert({
      api: metric.api,
      endpoint: metric.endpoint,
      status: metric.status,
      latency_ms: metric.latencyMs,
      cache_hit: metric.cacheHit ?? false,
      error_message: metric.errorMessage,
    });
    
    // Silently skip if table doesn't exist
    if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
      return;
    }

    // Check for error threshold
    if (metric.status === 'error' || metric.status === 'timeout') {
      await checkErrorThreshold(metric.api, supabase);
    }
  } catch (error) {
    // Don't fail the main request if metrics fail
    console.warn('[Metrics] Failed to track:', error);
  }
}

/**
 * Check if error rate exceeds threshold
 */
async function checkErrorThreshold(
  api: string,
  supabase?: SupabaseClient
): Promise<void> {
  if (!supabase) return;
  
  try {
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

    const { count, error } = await supabase
      .from('api_metrics')
      .select('*', { count: 'exact', head: true })
      .eq('api', api)
      .in('status', ['error', 'timeout'])
      .gte('timestamp', oneHourAgo);
    
    if (error) return; // Silently skip if table doesn't exist

    if (count && count > 10) {
      console.error(`[ALERT] ${api} has ${count} errors in last hour`);
      // TODO: Add webhook/email alerting here
    }
  } catch (err) {
    // Ignore
  }
}

/**
 * Wrap a fetch call with automatic metric tracking
 */
export async function fetchWithMetrics<T>(
  api: ApiName | string,
  endpoint: string,
  fetcher: () => Promise<T>,
  supabase?: SupabaseClient,
  options?: { cacheHit?: boolean }
): Promise<T> {
  const startTime = Date.now();
  let status: MetricStatus = 'success';
  let errorMessage: string | undefined;

  try {
    const result = await fetcher();
    return result;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        status = 'timeout';
        errorMessage = 'Request timed out';
      } else {
        status = 'error';
        errorMessage = error.message;
      }
    } else {
      status = 'error';
      errorMessage = String(error);
    }
    throw error;
  } finally {
    const latencyMs = Date.now() - startTime;
    await trackApiCall(
      {
        api,
        endpoint,
        status,
        latencyMs,
        cacheHit: options?.cacheHit,
        errorMessage,
      },
      supabase
    );
  }
}

/**
 * Get API health summary
 */
export async function getApiHealth(
  supabase: SupabaseClient
): Promise<Record<string, {
  totalCalls: number;
  successRate: number;
  avgLatency: number;
  cacheHitRate: number;
}>> {
  const { data } = await supabase
    .from('api_health')
    .select('*');

  if (!data) return {};

  return data.reduce((acc, row) => {
    acc[row.api] = {
      totalCalls: row.total_calls,
      successRate: (row.success_count / row.total_calls) * 100,
      avgLatency: row.avg_latency_ms,
      cacheHitRate: row.cache_hit_rate,
    };
    return acc;
  }, {} as Record<string, any>);
}
