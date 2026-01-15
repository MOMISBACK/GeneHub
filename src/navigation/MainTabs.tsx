/**
 * MainTabs - Bottom Tab Navigation
 * Premium "Quiet Luxury" style - Icon-only, no labels
 * 
 * Tabs: Notes | Recherche | Inbox
 */

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NotesScreen } from '../screens/NotesScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { InboxScreen } from '../screens/InboxScreen';
import { useTheme, spacing } from '../theme';
import type { MainTabsParamList } from './types';
import { TabIcon, TabIconMap } from '../components/TabIcons';

const Tab = createBottomTabNavigator<MainTabsParamList>();

export function MainTabs() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, spacing.lg);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false, // Remove labels - icon-only
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.borderHairline,
          height: 60 + bottomPad,
          paddingTop: spacing.md,
          paddingBottom: bottomPad,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ focused, color }) => {
          const tabName = route.name as keyof typeof TabIconMap;
          return (
            <View style={styles.iconContainer}>
              <TabIcon name={tabName} size={22} color={color} focused={focused} />
              {focused && (
                <View style={[styles.activeIndicator, { backgroundColor: colors.accent }]} />
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Notes" component={NotesScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Inbox" component={InboxScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 32,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
