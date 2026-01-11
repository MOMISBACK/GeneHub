/**
 * Rate Limiter - Token Bucket Algorithm
 * 
 * Shared module for managing API rate limits across Edge Functions.
 * Uses Supabase to persist state across invocations.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// API rate limit configurations
export const API_LIMITS = {
  ncbi: {
    requestsPerSecond: 3,      // 10 with NCBI_API_KEY
    burstLimit: 10,
    timeout: 10000,
  },
  uniprot: {
    requestsPerSecond: 20,     // Fair use policy
    burstLimit: 50,
    timeout: 15000,
  },
  biocyc: {
    requestsPerSecond: 1,      // Strict limit per BioCyc docs
    burstLimit: 1,
    timeout: 30000,
    requiresAuth: true,
  },
  string: {
    requestsPerSecond: 1,
    burstLimit: 5,
    timeout: 10000,
  },
  pdb: {
    requestsPerSecond: 10,
    burstLimit: 20,
    timeout: 10000,
  },
  alphafold: {
    requestsPerSecond: 10,
    burstLimit: 20,
    timeout: 10000,
  },
  kegg: {
    requestsPerSecond: 5,
    burstLimit: 10,
    timeout: 10000,
  },
  pubmed: {
    requestsPerSecond: 3,      // Same as NCBI
    burstLimit: 10,
    timeout: 10000,
  },
} as const;

export type ApiName = keyof typeof API_LIMITS;

interface RateLimitState {
  tokens: number;
  lastRefill: number;
}

// In-memory state for current invocation (fast path)
const memoryState: Map<string, RateLimitState> = new Map();

/**
 * Get current rate limit state from database or memory
 */
async function getState(
  api: ApiName,
  supabase?: SupabaseClient
): Promise<RateLimitState> {
  // Check memory first
  const memState = memoryState.get(api);
  if (memState) {
    return memState;
  }

  // Try to load from database (if available)
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('rate_limit_state')
        .select('tokens, last_refill')
        .eq('api', api)
        .single();

      // If table doesn't exist, use memory only
      if (!error || (error.code !== '42P01' && !error.message?.includes('does not exist'))) {
        if (data) {
          const state = {
            tokens: Number(data.tokens),
            lastRefill: new Date(data.last_refill).getTime(),
          };
          memoryState.set(api, state);
          return state;
        }
      }
    } catch (dbError) {
      console.warn('[RateLimiter] DB unavailable, using memory only');
    }
  }

  // Initialize if not exists
  const config = API_LIMITS[api];
  const initial: RateLimitState = {
    tokens: config.burstLimit,
    lastRefill: Date.now(),
  };
  memoryState.set(api, initial);
  return initial;
}

/**
 * Save rate limit state to database
 */
async function saveState(
  api: ApiName,
  state: RateLimitState,
  supabase?: SupabaseClient
): Promise<void> {
  memoryState.set(api, state);
  
  // Try to save to DB (ignore errors if table doesn't exist)
  if (supabase) {
    try {
      await supabase
        .from('rate_limit_state')
        .upsert({
          api,
          tokens: state.tokens,
          last_refill: new Date(state.lastRefill).toISOString(),
          updated_at: new Date().toISOString(),
        });
    } catch (dbError) {
      // Ignore - using memory only
    }
  }
}

/**
 * Execute a function with rate limiting
 * Uses token bucket algorithm for smooth rate limiting
 */
export async function withRateLimit<T>(
  api: ApiName,
  fn: (signal: AbortSignal) => Promise<T>,
  supabase?: SupabaseClient
): Promise<T> {
  const config = API_LIMITS[api];
  let state = await getState(api, supabase);

  // Refill tokens based on elapsed time
  const now = Date.now();
  const elapsed = (now - state.lastRefill) / 1000; // seconds
  state.tokens = Math.min(
    config.burstLimit,
    state.tokens + elapsed * config.requestsPerSecond
  );
  state.lastRefill = now;

  // Wait if no tokens available
  if (state.tokens < 1) {
    const waitTime = ((1 - state.tokens) / config.requestsPerSecond) * 1000;
    console.log(`[RateLimiter] ${api}: waiting ${Math.round(waitTime)}ms`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    state.tokens = 1;
    state.lastRefill = Date.now();
  }

  // Consume a token
  state.tokens -= 1;
  await saveState(api, state, supabase);

  // Execute with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const result = await fn(controller.signal);
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Check if an API has available tokens without consuming
 */
export async function hasCapacity(
  api: ApiName,
  supabase: SupabaseClient
): Promise<boolean> {
  const config = API_LIMITS[api];
  const state = await getState(api, supabase);

  const now = Date.now();
  const elapsed = (now - state.lastRefill) / 1000;
  const currentTokens = Math.min(
    config.burstLimit,
    state.tokens + elapsed * config.requestsPerSecond
  );

  return currentTokens >= 1;
}

/**
 * Get rate limit info for an API
 */
export function getRateLimitInfo(api: ApiName) {
  return API_LIMITS[api];
}

/**
 * Adjust NCBI rate limit if API key is available
 */
export function configureNcbiWithApiKey(): void {
  const apiKey = Deno.env.get('NCBI_API_KEY');
  if (apiKey) {
    // TypeScript workaround for readonly
    (API_LIMITS.ncbi as { requestsPerSecond: number }).requestsPerSecond = 10;
    (API_LIMITS.pubmed as { requestsPerSecond: number }).requestsPerSecond = 10;
    console.log('[RateLimiter] NCBI API key detected, rate limit increased to 10 req/s');
  }
}
