import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/theme';
import { I18nProvider } from './src/i18n';
import { SyncStatusBar } from './src/components/SyncStatusBar';
import { initSentry } from './src/lib/monitoring';

// Initialize Sentry on app start
initSentry();

function AppContent() {
  const { isDark } = useTheme();
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
