import { View, Text, StyleSheet } from 'react-native';
import type { ThemeColors } from '../../theme';

type InfoRowProps = {
  label: string;
  value?: string | number | null;
  colors: ThemeColors;
};

export function InfoRow({ label, value, colors }: InfoRowProps) {
  if (!value) return null;
  
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{String(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    flex: 1,
  },
  value: {
    fontSize: 14,
    flex: 2,
    textAlign: 'right',
  },
});
