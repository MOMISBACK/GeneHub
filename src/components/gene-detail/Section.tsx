import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { ThemeColors } from '../../theme';
import { typography, spacing, radius } from '../../theme';

type SectionProps = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  colors: ThemeColors;
};

export function Section({ title, children, defaultOpen = true, colors }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
      <Pressable onPress={() => setOpen(!open)} style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.chevron, { color: colors.textMuted }]}>{open ? '−' : '+'}</Text>
      </Pressable>
      {open && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: radius.lg,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 18,
    fontWeight: '300',
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
