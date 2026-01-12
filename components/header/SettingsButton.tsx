/**
 * SettingsButton - Button to access settings
 * Gear icon positioned in headers
 */

import { Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Icon } from '../Icons';
import { useTheme, spacing, radius } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function SettingsButton() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const navigation = useNavigation<Navigation>();

  return (
    <Pressable
      style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => navigation.navigate('Settings')}
      hitSlop={8}
    >
      <Icon name="settings" size={18} color={colors.textSecondary} />
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
