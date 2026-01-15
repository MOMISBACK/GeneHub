import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { supabaseWithAuth } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

const log = (...args: unknown[]) => __DEV__ && console.log(...args);

export async function signInWithGoogle(): Promise<void> {
  log('[auth] ========== STARTING GOOGLE SIGN IN ==========');
  
  // Mobile: Custom scheme for deep linking
  // Web: Don't specify redirectTo, let Supabase handle it automatically
  const options: any = Platform.OS === 'web' 
    
    // For web, we don't need a deep link, Supabase redirects to the current URL.
        // It's crucial that this URL is listed in Supabase's "Site URLs".
    ? {
        redirectTo: window.location.origin,
      }
    : { 
      // For mobile, we need a custom scheme for deep linking.
        redirectTo: 'genehub://auth/callback',
        skipBrowserRedirect: true 
      };
  
  log('[auth] 1. Platform.OS =', Platform.OS);

  // Log Supabase OAuth request
  log('[auth] 2. Calling supabase.auth.signInWithOAuth...');
  const { data, error } = await supabaseWithAuth.auth.signInWithOAuth({
    provider: 'google',
    options,
  });

  if (error) {
    log('[auth] ERROR from signInWithOAuth:', error);
    throw error;
  }
  if (!data?.url) {
    log('[auth] ERROR: Missing OAuth URL, data =', data);
    throw new Error('Missing OAuth URL');
  }
  
  log('[auth] 3. Got OAuth URL (first 100 chars):', data.url.substring(0, 100) + '...');

  // Web: Supabase handles everything automatically
  if (Platform.OS === 'web') {
    log('[auth] 4. Web platform - Supabase handles redirect automatically');
    return;
  }

  // Mobile: Use WebBrowser to handle OAuth flow
  log('[auth] 4. Mobile platform - Opening WebBrowser.openAuthSessionAsync...');
  const result = await WebBrowser.openAuthSessionAsync(data.url, 'genehub://auth/callback');
  
  log('[auth] 5. WebBrowser result type =', result.type);
  if (result.type === 'success') {
    log('[auth] 6. SUCCESS - result.url =', result.url);
  } else if (result.type === 'cancel') {
    log('[auth] 6. CANCELLED by user');
  } else if (result.type === 'dismiss') {
    log('[auth] 6. DISMISSED');
  } else {
    log('[auth] 6. OTHER result =', JSON.stringify(result));
  }

  if (result.type !== 'success' || !result.url) {
    throw new Error(
      `Connexion interrompue (type=${result.type}). Vérifie que "genehub://auth/callback" est bien ajouté dans Supabase → Authentication → URL Configuration → Additional Redirect URLs.`,
    );
  }

  // Parse callback URL
  log('[auth] 7. Parsing callback URL...');
  const parsed = Linking.parse(result.url);
  log('[auth] 8. Parsed result:', JSON.stringify(parsed, null, 2));
  
  const code = (parsed.queryParams?.code as string | undefined) ?? undefined;
  log('[auth] 9. Authorization code present?', !!code);
  
  if (code) {
    log('[auth] 10. Exchanging code for session...');
    const { data: sessionData, error: exchangeError } = await supabaseWithAuth.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      log('[auth] ERROR exchanging code:', exchangeError);
      throw exchangeError;
    }
    log('[auth] 11. Session established! User:', sessionData?.user?.email);
    return;
  }

  // Fallback: implicit flow tokens in URL hash
  log('[auth] 10b. No code found, trying implicit flow (hash tokens)...');
  const hash = result.url.split('#')[1] ?? '';
  const hashParams = new URLSearchParams(hash);
  const access_token = hashParams.get('access_token');
  const refresh_token = hashParams.get('refresh_token');

  log('[auth] 11b. access_token present?', !!access_token);
  log('[auth] 11b. refresh_token present?', !!refresh_token);

  if (!access_token || !refresh_token) {
    log('[auth] ERROR: No code and no tokens in callback');
    throw new Error(
      'OAuth callback missing code/tokens. Check Supabase Additional Redirect URLs and Google redirect URI config.',
    );
  }

  log('[auth] 12b. Setting session from tokens...');
  const { error: setSessionError } = await supabaseWithAuth.auth.setSession({ access_token, refresh_token });
  if (setSessionError) {
    log('[auth] ERROR setting session:', setSessionError);
    throw setSessionError;
  }
  log('[auth] 13b. Session established via implicit flow!');
}

export async function signOut(): Promise<void> {
  log('[auth] Signing out...');

  try {
    // Sign out from Supabase first (scope: global signs out all sessions)
    const { error } = await supabaseWithAuth.auth.signOut({ scope: 'global' });
    if (error) {
      log('[auth] Supabase signOut error (non-blocking):', error.message);
    }

    // Clear local storage after sign-out
    if (Platform.OS === 'web') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      log('[auth] Cleared web localStorage');
    } else {
      const allKeys = await AsyncStorage.getAllKeys();
      const supabaseKeys = allKeys.filter(k => k.includes('supabase') || k.includes('sb-'));
      if (supabaseKeys.length > 0) {
        await AsyncStorage.multiRemove(supabaseKeys);
        log('[auth] Cleared mobile AsyncStorage:', supabaseKeys.length, 'keys');
      }
    }

    log('[auth] Signed out successfully');

    if (Platform.OS === 'web') {
      setTimeout(() => {
        window.location.href = window.location.origin;
      }, 100);
    }
  } catch (e) {
    log('[auth] Error during sign out:', e);
    if (Platform.OS === 'web') {
      localStorage.clear();
      window.location.href = window.location.origin;
    }
    throw e;
  }
}
