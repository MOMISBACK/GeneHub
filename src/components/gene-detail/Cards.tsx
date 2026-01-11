/**
 * Gene Detail UI Components
 * 
 * Extracted from GeneDetailScreen for better maintainability.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { spacing, radius } from '../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// Card Component
// ─────────────────────────────────────────────────────────────────────────────

export type CardProps = {
  title: string;
  action?: { label: string; onPress: () => void };
  children: React.ReactNode;
  colors: any;
};

export function Card({ title, action, children, colors }: CardProps) {
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
        </View>
        {action && (
          <Pressable style={[styles.actionBtn, { backgroundColor: colors.accent + '15' }]} onPress={action.onPress}>
            <Text style={[styles.actionBtnText, { color: colors.accent }]}>{action.label}</Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Collapsible Card Component
// ─────────────────────────────────────────────────────────────────────────────

export type CollapsibleCardProps = {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  colors: any;
};

export function CollapsibleCard({ title, expanded, onToggle, children, colors }: CollapsibleCardProps) {
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
      <Pressable style={[styles.cardHeader, !expanded && { marginBottom: 0 }]} onPress={onToggle}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
        </View>
      </Pressable>
      {expanded && children}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Source Item Component
// ─────────────────────────────────────────────────────────────────────────────

export type SourceItemProps = {
  name: string;
  available: boolean;
  url?: string;
  colors: any;
};

export function SourceItem({ name, available, url, colors }: SourceItemProps) {
  const Wrapper: any = url ? Pressable : View;
  return (
    <Wrapper
      style={[styles.sourceItem, { borderBottomColor: colors.borderHairline }]}
      onPress={() => { if (url) Linking.openURL(url); }}
    >
      <View style={styles.sourceLeft}>
        <Text style={[styles.sourceName, { color: colors.text }]}>{name}</Text>
      </View>
      <Text style={[styles.sourceCheck, { color: available ? colors.text : colors.textMuted }]}>
        {available ? '✓' : '—'}
      </Text>
    </Wrapper>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Structure Item Component
// ─────────────────────────────────────────────────────────────────────────────

export type StructureItemProps = {
  id: string;
  method?: string;
  resolution?: number;
  onPress: () => void;
  colors: any;
};

export function StructureItem({ id, method, resolution, onPress, colors }: StructureItemProps) {
  return (
    <Pressable style={[styles.structureItem, { borderBottomColor: colors.borderHairline }]} onPress={onPress}>
      <View style={[styles.structureBadge, { borderColor: colors.borderHairline }]}>
        <Text style={[styles.structureBadgeText, { color: colors.text }]}>{id}</Text>
      </View>
      <View style={styles.structureInfo}>
        <Text style={[styles.structureMethod, { color: colors.textMuted }]}>{method || 'Structure'}</Text>
      </View>
      {resolution && (
        <Text style={[styles.structureResolution, { color: colors.textMuted }]}>{resolution} Å</Text>
      )}
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Card
  card: {
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  actionBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 8 },
  actionBtnText: { fontSize: 12, fontWeight: '500' },

  // Sources
  sourceItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  sourceLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sourceName: { fontSize: 14 },
  sourceCheck: { fontSize: 16, fontWeight: '600' },

  // Structures
  structureItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  structureBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.sm, marginRight: spacing.md, borderWidth: StyleSheet.hairlineWidth, backgroundColor: 'transparent' },
  structureBadgeText: { fontSize: 13, fontWeight: '700' },
  structureInfo: { flex: 1 },
  structureMethod: { fontSize: 13 },
  structureResolution: { fontSize: 13 },
});
