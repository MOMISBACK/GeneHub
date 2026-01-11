/**
 * Error Monitoring with Sentry
 * 
 * Captures errors, exceptions, and performance data.
 * Enabled in preview/production builds, logs only in development.
 */

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configuration
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

// Track initialization
let isInitialized = false;

/**
 * Initialize Sentry error monitoring
 */
export function initSentry(): void {
  // Skip if no DSN configured
  if (!SENTRY_DSN) {
    console.log('[Monitoring] Sentry DSN not configured, error monitoring disabled');
    return;
  }

  // Skip in development unless explicitly enabled
  if (__DEV__ && !process.env.EXPO_PUBLIC_SENTRY_DEV) {
    console.log('[Monitoring] Sentry disabled in development');
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      
      // Enable native crash reporting
      enableNative: true,
      
      // Enable auto instrumentation
      enableAutoPerformanceTracing: true,
      
      // Sample rate for error events (100%)
      sampleRate: 1.0,
      
      // Sample rate for performance traces (20%)
      tracesSampleRate: 0.2,
      
      // Environment
      environment: __DEV__ ? 'development' : (Constants.expoConfig?.extra?.eas?.releaseChannel || 'production'),
      
      // Release version
      release: `${Constants.expoConfig?.slug || 'genehub-bacteria'}@${Constants.expoConfig?.version || '1.0.0'}`,
      
      // Initial scope
      initialScope: {
        tags: {
          platform: Platform.OS,
          appVersion: Constants.expoConfig?.version || '1.0.0',
        },
      },
      
      // Before send hook for filtering
      beforeSend(event, hint) {
        // Skip certain errors in development
        if (__DEV__) {
          const error = hint.originalException as Error;
          // Skip network errors in dev
          if (error?.message?.includes('Network request failed')) {
            console.log('[Monitoring] Skipped network error in dev');
            return null;
          }
        }
        return event;
      },
      
      // Breadcrumb filtering
      beforeBreadcrumb(breadcrumb) {
        // Filter out noisy console breadcrumbs
        if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
          return null;
        }
        return breadcrumb;
      },
    });

    isInitialized = true;
    console.log('[Monitoring] Sentry initialized successfully');
  } catch (error) {
    console.error('[Monitoring] Failed to initialize Sentry:', error);
  }
}

/**
 * Capture exception with optional context
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>
): void {
  if (isInitialized) {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error('[Exception]', error.message, context);
    if (__DEV__) {
      console.error(error.stack);
    }
  }
}

/**
 * Capture message with severity level
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
): void {
  if (isInitialized) {
    Sentry.captureMessage(message, level);
  } else {
    const logFn = level === 'error' ? console.error : level === 'warning' ? console.warn : console.log;
    logFn(`[${level.toUpperCase()}]`, message);
  }
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string } | null): void {
  if (isInitialized) {
    if (user) {
      Sentry.setUser({ id: user.id, email: user.email });
    } else {
      Sentry.setUser(null);
    }
  }
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
): void {
  if (isInitialized) {
    Sentry.addBreadcrumb({
      category,
      message,
      data,
      level: 'info',
    });
  } else if (__DEV__) {
    console.log(`[Breadcrumb:${category}]`, message, data);
  }
}

/**
 * Set custom tag for filtering in Sentry dashboard
 */
export function setTag(key: string, value: string): void {
  if (isInitialized) {
    Sentry.setTag(key, value);
  }
}

/**
 * Set extra context data
 */
export function setExtra(key: string, value: unknown): void {
  if (isInitialized) {
    Sentry.setExtra(key, value);
  }
}

/**
 * Wrap component with Sentry Error Boundary
 */
export const ErrorBoundary = Sentry.ErrorBoundary;

/**
 * HOC to wrap components with error boundary
 */
export const withErrorBoundary = Sentry.withErrorBoundary;

/**
 * Wrap app with Sentry for performance monitoring
 */
export const wrapWithSentry = Sentry.wrap;

/**
 * Check if Sentry monitoring is enabled
 */
export function isMonitoringEnabled(): boolean {
  return isInitialized;
}

/**
 * Flush pending events (useful before app closes)
 */
export async function flush(timeout: number = 2000): Promise<boolean> {
  if (isInitialized) {
    return await Sentry.flush();
  }
  return true;
}
