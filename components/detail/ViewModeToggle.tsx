/**
 * ViewModeToggle - Switch between Recap and Notes view modes
 * Used in detail screens (Gene, Researcher, Article, Conference)
 */

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme, typography, spacing, radius } from '../../theme';

export type ViewMode = 'recap' | 'notes';

interface Props {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  notesCount?: number;
}

export function ViewModeToggle({ mode, onChange, notesCount = 0 }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
      <Pressable
        style={[
          styles.tab,
          mode === 'recap' && { backgroundColor: colors.accent },
        ]}
        onPress={() => onChange('recap')}
      >
        <Text style={[
          styles.tabLabel,
          { color: mode === 'recap' ? '#000' : colors.text },
        ]}>
          Recap
        </Text>
      </Pressable>

      <Pressable
        style={[
          styles.tab,
          mode === 'notes' && { backgroundColor: colors.accent },
        ]}
        onPress={() => onChange('notes')}
      >
        <Text style={[
          styles.tabLabel,
          { color: mode === 'notes' ? '#000' : colors.text },
        ]}>
          Notes
        </Text>
        {notesCount > 0 && (
          <View style={[
            styles.badge,
            { backgroundColor: mode === 'notes' ? 'rgba(0,0,0,0.2)' : colors.accent },
          ]}>
            <Text style={[
              styles.badgeText,
              { color: mode === 'notes' ? '#000' : '#fff' },
            ]}>
              {notesCount}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    gap: 6,
  },
  tabIcon: {
    fontSize: 14,
  },
  tabLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
  },
});
