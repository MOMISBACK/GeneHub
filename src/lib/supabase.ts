import Constants from 'expo-constants';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Expo Go can have `Constants.expoConfig` undefined depending on how the app is loaded.
// Prefer `process.env.EXPO_PUBLIC_*` (Expo replaces these at runtime), then fall back to config extras.
export const supabaseUrl =
  (process.env.EXPO_PUBLIC_SUPABASE_URL as string | undefined) ||
  (Constants.expoConfig?.extra?.supabaseUrl as string | undefined) ||
  ((Constants as any).manifest?.extra?.supabaseUrl as string | undefined) ||
  ((Constants as any).manifest2?.extra?.supabaseUrl as string | undefined);

export const supabaseAnonKey =
  (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
  (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined) ||
  ((Constants as any).manifest?.extra?.supabaseAnonKey as string | undefined) ||
  ((Constants as any).manifest2?.extra?.supabaseAnonKey as string | undefined);

// Flag to check if Supabase is properly configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Log warning instead of crashing if not configured
if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] Missing config. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    'Using placeholder values - auth will not work.',
  );
}

// Use placeholder values to prevent crash, but auth won't work
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(url, key);

// Re-create client with React Native friendly auth persistence.
// Note: this keeps the same public API for imports.
export const supabaseWithAuth = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
