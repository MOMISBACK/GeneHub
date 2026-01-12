/**
 * ScanQrScreen - Scan and import researcher cards
 * TEMPORARILY DISABLED - Camera functionality causes crashes
 */

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { useTheme, typography, spacing, radius } from '../theme';
import { Icon } from '../components/Icons';

type Props = NativeStackScreenProps<RootStackParamList, 'ScanQr'>;

export function ScanQrScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevronLeft" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Scanner QR</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <View style={styles.content}>
        <View style={[styles.disabledCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Icon name="camera" size={64} color={colors.textMuted} />
          <Text style={[styles.disabledTitle, { color: colors.text }]}>
            Fonctionnalité temporairement désactivée
          </Text>
          <Text style={[styles.disabledText, { color: colors.textSecondary }]}>
            Le scan de QR codes sera disponible dans une prochaine mise à jour.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  disabledCard: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    maxWidth: 320,
  },
  disabledTitle: {
    ...typography.h3,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  disabledText: {
    ...typography.bodySmall,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
