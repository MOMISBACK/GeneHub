import type { ExpoConfig } from 'expo/config';

// Only enable Sentry source map uploads when credentials are available
const sentryConfig = process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
  ? {
      organization: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
    }
  : {
      // Disable source map uploads when Sentry is not configured
      organization: '',
      project: '',
      url: 'https://sentry.io/',
    };

const config: ExpoConfig = {
  name: 'GeneHub Bacteria',
  slug: 'genehub-bacteria',
  owner: 'momisback',
  scheme: 'genehub',
  version: '1.0.0',
  plugins: [
    'expo-web-browser',
    'expo-localization',
    [
      '@sentry/react-native',
      sentryConfig,
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'Allow GeneHub to access camera to scan QR codes.',
      },
    ],
  ],
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.momisback.genehubbacteria',
    supportsTablet: true,
  },
  android: {
    package: 'com.momisback.genehubbacteria',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    eas: {
      projectId: 'ddfbaa26-00a3-4713-b473-19d5e231642e',
    },
  },
};

export default config;
