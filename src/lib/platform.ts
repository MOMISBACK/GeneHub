/**
 * Platform-aware utilities
 * Provides fallbacks for web platform and guards for native-only features
 */

import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

/**
 * Features that require native platform
 */
export const nativeOnlyFeatures = {
  /** expo-web-browser doesn't work reliably on web */
  webBrowser: isNative,
  /** Google OAuth only works on dev builds (native) */
  googleAuth: isNative,
  /** expo-clipboard has web fallback but it's limited */
  clipboard: true, // Works on both but behavior differs
  /** Background tasks only on native */
  backgroundTasks: isNative,
  /** Push notifications */
  pushNotifications: isNative,
  /** Biometric auth (FaceID/TouchID) */
  biometrics: isNative,
} as const;

/**
 * Execute a function only on native platforms
 */
export function onNativeOnly<T>(fn: () => T, fallback?: T): T | undefined {
  if (isNative) {
    return fn();
  }
  return fallback;
}

/**
 * Execute a function only on web platform
 */
export function onWebOnly<T>(fn: () => T, fallback?: T): T | undefined {
  if (isWeb) {
    return fn();
  }
  return fallback;
}

/**
 * Get platform-specific value
 */
export function platformSelect<T>(config: {
  native?: T;
  web?: T;
  ios?: T;
  android?: T;
  default: T;
}): T {
  if (isIOS && config.ios !== undefined) return config.ios;
  if (isAndroid && config.android !== undefined) return config.android;
  if (isNative && config.native !== undefined) return config.native;
  if (isWeb && config.web !== undefined) return config.web;
  return config.default;
}

/**
 * Open URL in browser
 * Uses window.open on web, expo-web-browser on native
 */
export async function openURL(url: string): Promise<void> {
  if (isWeb) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  // Dynamic import to avoid loading on web
  const WebBrowser = await import('expo-web-browser');
  await WebBrowser.openBrowserAsync(url);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (isWeb) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        return true;
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }

  // Native
  const Clipboard = await import('expo-clipboard');
  await Clipboard.setStringAsync(text);
  return true;
}

/**
 * Check if a native module is available
 * Useful for graceful degradation
 *
 * IMPORTANT: Metro (Expo Web) cannot handle `require(moduleName)` where
 * `moduleName` is dynamic. We therefore whitelist known modules with static
 * requires so the bundler can resolve them at build time.
 */
export type KnownModule =
  | 'expo-web-browser'
  | 'expo-clipboard'
  | '@react-native-async-storage/async-storage'
  | '@react-native-community/netinfo';

export function isModuleAvailable(moduleName: KnownModule): boolean {
  try {
    switch (moduleName) {
      case 'expo-web-browser':
        require('expo-web-browser');
        return true;
      case 'expo-clipboard':
        require('expo-clipboard');
        return true;
      case '@react-native-async-storage/async-storage':
        require('@react-native-async-storage/async-storage');
        return true;
      case '@react-native-community/netinfo':
        require('@react-native-community/netinfo');
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Storage abstraction that works on both platforms
 * AsyncStorage works on web via localStorage polyfill
 */
export const storage = {
  isWeb,

  // Note: AsyncStorage from @react-native-async-storage/async-storage
  // has web support via localStorage, so no fallback needed
  supportsLargeStorage: isNative, // Web localStorage has ~5MB limit
  maxStorageSize: isWeb ? 5 * 1024 * 1024 : Infinity,
};

/**
 * Network info abstraction
 * @react-native-community/netinfo works on web but with limited features
 */
export const networkFeatures = {
  /** Can detect connection type (wifi, cellular, etc.) */
  connectionType: isNative,
  /** Can detect if connection is expensive (metered) */
  isExpensive: isNative,
  /** Can detect actual connectivity (not just interface up) */
  isInternetReachable: true, // Works on both
};
