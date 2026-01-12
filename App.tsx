import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/theme';
import { I18nProvider } from './src/i18n';
import { SyncStatusBar } from './src/components/SyncStatusBar';
import { initSentry } from './src/lib/monitoring';
import { supabaseWithAuth } from './src/lib/supabase';

// Initialize Sentry on app start
initSentry();

function AppContent() {
  const { isDark } = useTheme();

  // Handle OAuth callback on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Supabase automatically detects and handles OAuth hash fragments
      // We just need to ensure the session is restored
      supabaseWithAuth.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          console.log('[App] Session detected on web load:', session.user.email);
        }
      });
    }
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <SyncStatusBar />
      <AppNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
