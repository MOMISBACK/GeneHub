/**
 * Error Handling - Standardized error format for Edge Functions
 * 
 * Provides consistent error responses across all edge functions
 * with request tracking, categorization, and client-friendly messages.
 */

// Error categories for client-side handling
export type ErrorCategory =
  | 'NOT_FOUND'           // Resource doesn't exist
  | 'VALIDATION'          // Invalid input
  | 'RATE_LIMITED'        // Too many requests
  | 'EXTERNAL_API'        // Third-party API failed
  | 'TIMEOUT'             // Request timed out
  | 'AUTH'                // Authentication required
  | 'INTERNAL';           // Server error

// Standardized error response
export interface ErrorResponse {
  error: {
    code: ErrorCategory;
    message: string;              // User-friendly message
    details?: string;             // Technical details (dev only)
    requestId: string;            // For debugging/support
    retryable: boolean;           // Can client retry?
    retryAfter?: number;          // Seconds to wait before retry
  };
}

// HTTP status codes by error category
const STATUS_CODES: Record<ErrorCategory, number> = {
  NOT_FOUND: 404,
  VALIDATION: 400,
  RATE_LIMITED: 429,
  EXTERNAL_API: 502,
  TIMEOUT: 504,
  AUTH: 401,
  INTERNAL: 500,
};

// Retryable errors
const RETRYABLE: Record<ErrorCategory, boolean> = {
  NOT_FOUND: false,
  VALIDATION: false,
  RATE_LIMITED: true,
  EXTERNAL_API: true,
  TIMEOUT: true,
  AUTH: false,
  INTERNAL: true,
};

/**
 * Generate unique request ID for tracking
 */
export function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  category: ErrorCategory,
  message: string,
  requestId: string,
  options?: {
    details?: string;
    retryAfter?: number;
  }
): Response {
  const body: ErrorResponse = {
    error: {
      code: category,
      message,
      requestId,
      retryable: RETRYABLE[category],
      ...(options?.details && { details: options.details }),
      ...(options?.retryAfter && { retryAfter: options.retryAfter }),
    },
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-Id': requestId,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (options?.retryAfter) {
    headers['Retry-After'] = String(options.retryAfter);
  }

  return new Response(JSON.stringify(body), {
    status: STATUS_CODES[category],
    headers,
  });
}

/**
 * Common error creators
 */
export const errors = {
  notFound: (resource: string, requestId: string) =>
    createErrorResponse('NOT_FOUND', `${resource} not found`, requestId),

  validation: (message: string, requestId: string, details?: string) =>
    createErrorResponse('VALIDATION', message, requestId, { details }),

  rateLimited: (requestId: string, retryAfter = 60) =>
    createErrorResponse(
      'RATE_LIMITED',
      'Too many requests. Please slow down.',
      requestId,
      { retryAfter }
    ),

  externalApi: (api: string, requestId: string, details?: string) =>
    createErrorResponse(
      'EXTERNAL_API',
      `Failed to fetch data from ${api}`,
      requestId,
      { details }
    ),

  timeout: (api: string, requestId: string) =>
    createErrorResponse('TIMEOUT', `Request to ${api} timed out`, requestId),

  auth: (requestId: string) =>
    createErrorResponse('AUTH', 'Authentication required', requestId),

  internal: (requestId: string, details?: string) =>
    createErrorResponse('INTERNAL', 'An internal error occurred', requestId, { details }),
};

/**
 * Wrap async operation with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  let timeoutId: number;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(timeoutMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Custom error types
 */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class RateLimitError extends Error {
  retryAfter: number;
  
  constructor(api: string, retryAfter = 60) {
    super(`Rate limited by ${api}`);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ExternalApiError extends Error {
  api: string;
  statusCode?: number;
  
  constructor(api: string, message: string, statusCode?: number) {
    super(message);
    this.name = 'ExternalApiError';
    this.api = api;
    this.statusCode = statusCode;
  }
}

/**
 * Classify error and create appropriate response
 */
export function handleError(error: unknown, requestId: string): Response {
  console.error(`[${requestId}] Error:`, error);

  if (error instanceof TimeoutError) {
    return errors.timeout('External API', requestId);
  }

  if (error instanceof RateLimitError) {
    return errors.rateLimited(requestId, error.retryAfter);
  }

  if (error instanceof ExternalApiError) {
    return errors.externalApi(error.api, requestId, error.message);
  }

  // Generic error
  const message = error instanceof Error ? error.message : String(error);
  return errors.internal(requestId, message);
}

/**
 * Retry helper for external API calls
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
  } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt >= maxRetries || !shouldRetry(error)) {
        break;
      }

      console.log(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
}
