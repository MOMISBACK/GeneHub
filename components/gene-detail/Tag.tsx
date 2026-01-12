import { View, Text, StyleSheet } from 'react-native';
import type { ThemeColors } from '../../theme';
import { typography, spacing, radius } from '../../theme';

type TagProps = {
  label: string;
  colors: ThemeColors;
  variant?: 'default' | 'accent' | 'success' | 'outline';
};

export function Tag({ label, colors, variant = 'default' }: TagProps) {
  // Premium "outline" style by default for chips
  const isOutline = variant === 'outline' || variant === 'default';
  
  const bgColor = isOutline 
    ? 'transparent'
    : variant === 'accent' 
      ? colors.accentMuted + '30' 
      : variant === 'success' 
        ? colors.success + '15' 
        : colors.bgSecondary;
        
  const borderColor = isOutline 
    ? colors.chipBorder 
    : 'transparent';
    
  const textColor = variant === 'accent' 
    ? colors.accent 
    : variant === 'success' 
      ? colors.success 
      : colors.chipText;

  return (
    <View style={[styles.tag, { backgroundColor: bgColor, borderColor }]}>
      <Text style={[styles.text, { color: textColor }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    maxWidth: 200,
  },
  text: {
    ...typography.caption,
  },
});
