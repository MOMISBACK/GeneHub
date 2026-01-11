import { Pressable, Text, StyleSheet, Linking } from 'react-native';
import type { ThemeColors } from '../../theme';

type LinkPillProps = {
  label: string;
  url: string;
  colors: ThemeColors;
};

export function LinkPill({ label, url, colors }: LinkPillProps) {
  return (
    <Pressable 
      onPress={() => Linking.openURL(url)} 
      style={[styles.pill, { backgroundColor: colors.accent + '15' }]}
    >
      <Text style={[styles.text, { color: colors.accent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
});
