import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';

import type { Session } from '@supabase/supabase-js';

import { supabaseWithAuth } from '../lib/supabase';
import { LoginScreen } from '../screens/LoginScreen';
import { GeneDetailScreen } from '../screens/GeneDetailScreen';
import { ResearcherDetailScreen } from '../screens/ResearcherDetailScreen';
import { ArticleDetailScreen } from '../screens/ArticleDetailScreen';
import { ConferenceDetailScreen } from '../screens/ConferenceDetailScreen';
import { TagsScreen } from '../screens/TagsScreen';
import { CollectionsScreen } from '../screens/CollectionsScreen';
import { CollectionDetailScreen } from '../screens/CollectionDetailScreen';
import { PrivacyScreen } from '../screens/PrivacyScreen';
import { MyQrScreen } from '../screens/MyQrScreen';
import { ScanQrScreen } from '../screens/ScanQrScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';
import { useTheme } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { theme, isDark } = useTheme();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  const colors = theme.colors;

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.accent,
      background: colors.bg,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  useEffect(() => {
    let mounted = true;

    supabaseWithAuth.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setReady(true);
    });

    const { data: sub } = supabaseWithAuth.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        {!session ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen 
              name="Main" 
              component={MainTabs} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="GeneDetail" 
              component={GeneDetailScreen} 
              options={{ 
                title: '',
                headerBackTitle: 'Retour',
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="ResearcherDetail" 
              component={ResearcherDetailScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="ArticleDetail" 
              component={ArticleDetailScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="ConferenceDetail" 
              component={ConferenceDetailScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Tags" 
              component={TagsScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Collections" 
              component={CollectionsScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="CollectionDetail" 
              component={CollectionDetailScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Privacy" 
              component={PrivacyScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="MyQr" 
              component={MyQrScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="ScanQr" 
              component={ScanQrScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen} 
              options={{ headerShown: false }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
