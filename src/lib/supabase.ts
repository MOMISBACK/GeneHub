import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';
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

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase config. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Re-create client with React Native friendly auth persistence.
// Note: this keeps the same public API for imports.
export const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
