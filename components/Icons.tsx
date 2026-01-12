import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Simple SVG-like icons using Unicode symbols and basic shapes
// Minimaliste, pas de cartoon

type IconProps = {
  size?: number;
  color?: string;
};

// Using minimal unicode/text symbols for icons
export const Icons = {
  // Navigation
  back: '←',
  arrowBack: '←',
  forward: '→',
  up: '↑',
  down: '↓',
  close: '×',
  menu: '≡',
  
  // Actions
  search: '⌕',
  add: '+',
  remove: '−',
  edit: '✎',
  save: '↓',
  delete: '✕',
  share: '↗',
  link: '↗',
  refresh: '↻',
  
  // Status
  check: '✓',
  star: '★',
  starOutline: '☆',
  dot: '•',
  circle: '○',
  circleFilled: '●',
  
  // UI
  expand: '+',
  collapse: '−',
  chevronDown: '▾',
  chevronUp: '▴',
  chevronRight: '▸',
  chevronLeft: '◂',
  
  // Content
  note: '¶',
  copy: '⎘',
  info: 'i',
  warning: '!',
  error: '×',
  
  // Theme
  sun: '○',
  moon: '●',
  settings: '⚙',

  // Identity
  user: '◉',
  people: '◍',
  
  // Science specific
  dna: '⧬',
  protein: '◈',
  structure: '△',
  interaction: '⟷',
  pathway: '⤳',
  publication: '▤',
  
  // Knowledge base
  doc: '▤',
  article: '▤',
  calendar: '▦',
  conference: '▦',
  tag: '#',
  notes: '≡',
  pencil: '✎',
  trash: '✕',
  inbox: '▣',
  archive: '↧',
  checkmark: '✓',
  qr: '⬚',
  camera: '◎',
  document: '▤',
  
} as const;

// Icon component
export function Icon({ 
  name, 
  size = 16, 
  color = '#fff' 
}: { 
  name: keyof typeof Icons; 
  size?: number; 
  color?: string;
}) {
  return (
    <Text style={[styles.icon, { fontSize: size, color, lineHeight: size * 1.2 }]}>
      {Icons[name]}
    </Text>
  );
}

// Badge with icon
export function IconBadge({
  icon,
  label,
  color,
  bgColor,
}: {
  icon?: keyof typeof Icons;
  label: string;
  color: string;
  bgColor: string;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      {icon && <Icon name={icon} size={12} color={color} />}
      <Text style={[styles.badgeText, { color, marginLeft: icon ? 4 : 0 }]}>{label}</Text>
    </View>
  );
}

// Source badge (for data provenance)
export function SourceBadge({
  source,
  verified = false,
  color,
  bgColor,
}: {
  source: string;
  verified?: boolean;
  color: string;
  bgColor: string;
}) {
  return (
    <View style={[styles.sourceBadge, { backgroundColor: bgColor }]}>
      <Text style={[styles.sourceText, { color }]}>{source}</Text>
      {verified && <Icon name="check" size={10} color={color} />}
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontWeight: '400',
    textAlign: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    gap: 3,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
