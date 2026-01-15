/**
 * GlobalSearchButton - Button to access global search
 * Floating button positioned in headers
 */

import { Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Icon } from '../Icons';
import { useTheme, spacing, radius } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function GlobalSearchButton() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const navigation = useNavigation<Navigation>();

  return (
    <Pressable
      style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => navigation.navigate('Main', { screen: 'Search' })}
      hitSlop={8}
    >
      <Icon name="search" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
