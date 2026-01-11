/**
 * SyncStatusBar - Visual indicator for sync status
 * Shows pending/failed mutations with retry capability
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useSyncStore } from '../lib/syncStore';
import { useTheme, spacing, radius, typography } from '../theme';

export function SyncStatusBar() {
  const { theme } = useTheme();
  const colors = theme.colors;
  
  const { status, pendingMutations, failedMutations, isOnline, retry, clearFailed } = useSyncStore();

  // Don't show if everything is fine
  if (status === 'idle' && failedMutations.length === 0) {
    return null;
  }

  const hasFailed = failedMutations.length > 0;
  const isPending = pendingMutations.length > 0;

  // Background color based on status
  const bgColor = !isOnline 
    ? colors.textMuted 
    : hasFailed 
      ? colors.error 
      : colors.accent;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Offline indicator */}
      {!isOnline && (
        <View style={styles.row}>
          <Text style={styles.icon}>📡</Text>
          <Text style={styles.text}>Mode hors-ligne</Text>
        </View>
      )}

      {/* Syncing indicator */}
      {isPending && isOnline && !hasFailed && (
        <View style={styles.row}>
          <Text style={styles.icon}>↻</Text>
          <Text style={styles.text}>
            Synchronisation ({pendingMutations.length})...
          </Text>
        </View>
      )}

      {/* Failed mutations */}
      {hasFailed && (
        <View style={styles.failedContainer}>
          <View style={styles.row}>
            <Text style={styles.icon}>⚠️</Text>
            <Text style={styles.text}>
              {failedMutations.length} sync échoué{failedMutations.length > 1 ? 's' : ''}
            </Text>
          </View>
          
          <View style={styles.actions}>
            <Pressable
              style={[styles.button, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              onPress={() => failedMutations.forEach((m: { id: string }) => retry(m.id))}
            >
              <Text style={styles.buttonText}>Réessayer</Text>
            </Pressable>
            
            <Pressable
              style={styles.dismissButton}
              onPress={() => failedMutations.forEach((m: { id: string }) => clearFailed(m.id))}
            >
              <Text style={styles.dismissText}>✕</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

/**
 * Compact version for embedding in screens
 */
export function SyncStatusBadge() {
  const { theme } = useTheme();
  const colors = theme.colors;
  
  const { status, failedMutations, isOnline } = useSyncStore();

  if (status === 'idle' && failedMutations.length === 0 && isOnline) {
    return null;
  }

  const hasFailed = failedMutations.length > 0;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: !isOnline
            ? colors.textMuted
            : hasFailed
              ? colors.error
              : colors.accent,
        },
      ]}
    >
      <Text style={styles.badgeText}>
        {!isOnline ? '📡' : hasFailed ? `⚠️ ${failedMutations.length}` : '↻'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  
  icon: {
    fontSize: 14,
  },
  
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  
  failedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  
  button: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  
  dismissButton: {
    padding: spacing.xs,
  },
  
  dismissText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  
  // Badge styles
  badge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
