// Theme type definition
// GenoDB Atlas v3.1 - Clarity Design System Integration
export type ThemeColors = {
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  surface: string;
  surfaceElevated: string;
  card: string;
  cardHover: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  accentMuted: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  border: string;
  borderLight: string;
  borderHairline: string;
  divider: string;
  shadow: string;
  shadowSoft: string;
  buttonPrimary: string;
  buttonPrimaryText: string;
  buttonSecondary: string;
  buttonSecondaryText: string;
  buttonDisabled: string;
  buttonDisabledText: string;
  inputBg: string;
  inputBorder: string;
  inputBorderFocus: string;
  inputPlaceholder: string;
  star: string;
  starMuted: string;
  link: string;
  chipBg: string;
  chipBorder: string;
  chipText: string;

  // Chip colors by entity type (pastel primaries)
  chipGeneBg: string;
  chipGeneBorder: string;
  chipGeneText: string;
  chipPersonBg: string;
  chipPersonBorder: string;
  chipPersonText: string;
  chipReferenceBg: string;
  chipReferenceBorder: string;
  chipReferenceText: string;
  chipConferenceBg: string;
  chipConferenceBorder: string;
  chipConferenceText: string;
  chipDateBg: string;
  chipDateBorder: string;
  chipDateText: string;
  skeleton: string;
  skeletonHighlight: string;
  // Note surface (inline tinted)
  noteSurface: string;
  // Evidence & Curation colors (Atlas v3.1)
  evidenceCurated: string;
  evidenceVerified: string;
  evidenceImported: string;
  conflictBadgeBg: string;
  conflictBadgeText: string;
  // Source-specific colors
  sourceNcbi: string;
  sourceUniprot: string;
  sourcePdb: string;
  sourceBiocyc: string;
};

// Typography scale (sizes in logical pixels)
export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '600' as const, lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodySmall: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  overline: { fontSize: 11, fontWeight: '600' as const, lineHeight: 16, letterSpacing: 0.5 },
  metric: { fontSize: 28, fontWeight: '600' as const, lineHeight: 34 },
  metricLabel: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  // Atlas v3.1 additions
  label: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
  labelSmall: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
};

// Spacing scale
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Border radius - unified
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  full: 9999,
};

export type Theme = {
  name: string;
  isDark: boolean;
  colors: ThemeColors;
};

// ============================================
// Brand Colors (Clarity Design System)
// ============================================
const brand = {
  petrolBlue: '#4C8B98',
  petrolBlueLight: '#6BA3AE',
  petrolBlueDark: '#3A6D77',
  champagneGold: '#D4AF37',
  champagneGoldLight: '#E5C968',
};

// Source-specific colors for provenance tracking
const sourceColors = {
  ncbi: '#205493',
  uniprot: '#F5A623',
  pdb: '#3AA745',
  biocyc: '#7B68EE',
};

// ============================================
// CLARITY LIGHT THEME (GenoDB Atlas v3.1)
// ============================================
export const quietLuxuryLight: Theme = {
  name: 'Light',
  isDark: false,
  colors: {
    // Backgrounds - Clean Lab Grade
    bg: '#FAFBFC',
    bgSecondary: '#F3F4F6',
    bgTertiary: '#E5E7EB',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    card: '#FFFFFF',
    cardHover: '#F9FAFB',
    
    // Text - Refined hierarchy (WCAG AA)
    text: '#111827',
    textSecondary: '#374151',
    textMuted: '#6B7280',
    textInverse: '#FFFFFF',
    
    // Accent - Monochrome (minimal, quiet)
    // Use sparingly for active states and links.
    accent: '#111827',
    accentLight: '#374151',
    accentDark: '#0B0F16',
    accentMuted: '#9CA3AF',
    
    // Semantic - Clear distinction
    success: '#16A34A',
    warning: '#D97706',
    error: '#DC2626',
    info: '#2563EB',
    
    // Borders - Hairline precision
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    borderHairline: 'rgba(0, 0, 0, 0.08)',
    divider: '#F3F4F6',
    
    // Shadows - Subtle
    shadow: 'rgba(0, 0, 0, 0.05)',
    shadowSoft: 'rgba(0, 0, 0, 0.03)',
    
    // Buttons
    buttonPrimary: '#111827',
    buttonPrimaryText: '#FFFFFF',
    buttonSecondary: '#F3F4F6',
    buttonSecondaryText: '#374151',
    buttonDisabled: '#E5E7EB',
    buttonDisabledText: '#9CA3AF',
    
    // Inputs
    inputBg: '#FFFFFF',
    inputBorder: '#D1D5DB',
    inputBorderFocus: '#111827',
    inputPlaceholder: '#9CA3AF',
    
    // Special elements
    star: '#111827',
    starMuted: '#D1D5DB',
    link: '#111827',
    
    // Chips - Outline style
    chipBg: 'transparent',
    chipBorder: '#E5E7EB',
    chipText: '#374151',

    // Chip colors by entity type (pastel primaries)
    chipGeneBg: 'rgba(59, 130, 246, 0.14)',
    chipGeneBorder: 'rgba(59, 130, 246, 0.28)',
    chipGeneText: '#1D4ED8',
    chipPersonBg: 'rgba(245, 158, 11, 0.16)',
    chipPersonBorder: 'rgba(245, 158, 11, 0.30)',
    chipPersonText: '#B45309',
    chipReferenceBg: 'rgba(244, 63, 94, 0.14)',
    chipReferenceBorder: 'rgba(244, 63, 94, 0.28)',
    chipReferenceText: '#BE123C',
    chipConferenceBg: 'rgba(34, 197, 94, 0.14)',
    chipConferenceBorder: 'rgba(34, 197, 94, 0.28)',
    chipConferenceText: '#15803D',
    chipDateBg: 'rgba(168, 85, 247, 0.14)',
    chipDateBorder: 'rgba(168, 85, 247, 0.28)',
    chipDateText: '#7C3AED',
    
    // Skeleton loading
    skeleton: '#F3F4F6',
    skeletonHighlight: '#FAFBFC',
    
    // Note surface (inline tinted - monochrome)
    noteSurface: 'rgba(17, 24, 39, 0.04)',
    
    // Evidence & Curation (Atlas v3.1)
    evidenceCurated: '#16A34A',
    evidenceVerified: '#2563EB',
    evidenceImported: '#6B7280',
    conflictBadgeBg: '#FEF3C7',
    conflictBadgeText: '#B45309',
    
    // Source colors
    sourceNcbi: sourceColors.ncbi,
    sourceUniprot: sourceColors.uniprot,
    sourcePdb: sourceColors.pdb,
    sourceBiocyc: sourceColors.biocyc,
  },
};

// ============================================
// CLARITY DARK THEME (GenoDB Atlas v3.1)
// ============================================
export const quietLuxuryDark: Theme = {
  name: 'Dark',
  isDark: true,
  colors: {
    // Backgrounds - Deep Lab Grade
    bg: '#0F1419',
    bgSecondary: '#1A1F2E',
    bgTertiary: '#242B3D',
    surface: '#1A1F2E',
    surfaceElevated: '#242B3D',
    card: '#1A1F2E',
    cardHover: '#242B3D',
    
    // Text - WCAG AA compliant
    text: '#F0F4FC',
    textSecondary: '#C9D1E0',
    textMuted: '#8B95A8',
    textInverse: '#0F1419',
    
    // Accent - Monochrome (minimal, quiet)
    accent: '#F0F4FC',
    accentLight: '#FFFFFF',
    accentDark: '#C9D1E0',
    accentMuted: '#8B95A8',
    
    // Semantic - Adjusted for dark
    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',
    
    // Borders - Subtle definition
    border: '#2D3548',
    borderLight: '#242B3D',
    borderHairline: 'rgba(255, 255, 255, 0.08)',
    divider: '#242B3D',
    
    // Shadows
    shadow: 'rgba(0, 0, 0, 0.4)',
    shadowSoft: 'rgba(0, 0, 0, 0.2)',
    
    // Buttons
    buttonPrimary: '#F0F4FC',
    buttonPrimaryText: '#0F1419',
    buttonSecondary: '#242B3D',
    buttonSecondaryText: '#C9D1E0',
    buttonDisabled: '#2D3548',
    buttonDisabledText: '#5C6370',
    
    // Inputs
    inputBg: '#1A1F2E',
    inputBorder: '#3D4663',
    inputBorderFocus: '#F0F4FC',
    inputPlaceholder: '#6B7280',
    
    // Special elements
    star: '#F0F4FC',
    starMuted: '#4B5563',
    link: '#F0F4FC',
    
    // Chips - Outline style
    chipBg: 'transparent',
    chipBorder: '#3D4663',
    chipText: '#C9D1E0',

    // Chip colors by entity type (pastel primaries, tuned for dark)
    chipGeneBg: 'rgba(96, 165, 250, 0.20)',
    chipGeneBorder: 'rgba(96, 165, 250, 0.34)',
    chipGeneText: '#BFDBFE',
    chipPersonBg: 'rgba(251, 191, 36, 0.18)',
    chipPersonBorder: 'rgba(251, 191, 36, 0.32)',
    chipPersonText: '#FDE68A',
    chipReferenceBg: 'rgba(251, 113, 133, 0.18)',
    chipReferenceBorder: 'rgba(251, 113, 133, 0.32)',
    chipReferenceText: '#FECDD3',
    chipConferenceBg: 'rgba(74, 222, 128, 0.18)',
    chipConferenceBorder: 'rgba(74, 222, 128, 0.32)',
    chipConferenceText: '#BBF7D0',
    chipDateBg: 'rgba(192, 132, 252, 0.18)',
    chipDateBorder: 'rgba(192, 132, 252, 0.32)',
    chipDateText: '#E9D5FF',
    
    // Skeleton loading
    skeleton: '#242B3D',
    skeletonHighlight: '#2D3548',
    
    // Note surface (inline tinted - monochrome)
    noteSurface: 'rgba(240, 244, 252, 0.06)',
    
    // Evidence & Curation (Atlas v3.1)
    evidenceCurated: '#4ADE80',
    evidenceVerified: '#60A5FA',
    evidenceImported: '#9CA3AF',
    conflictBadgeBg: '#422006',
    conflictBadgeText: '#FBBF24',
    
    // Source colors (brighter for dark mode)
    sourceNcbi: '#4A7FBF',
    sourceUniprot: '#FFB84D',
    sourcePdb: '#5CC96A',
    sourceBiocyc: '#9B8CFF',
  },
};

// Legacy theme names mapping for compatibility
export const nordDark = quietLuxuryDark;
export const nordLight = quietLuxuryLight;

// Available themes
export const themes = {
  'nord-dark': quietLuxuryDark,
  'nord-light': quietLuxuryLight,
  'quiet-dark': quietLuxuryDark,
  'quiet-light': quietLuxuryLight,
} as const;

export type ThemeKey = keyof typeof themes;
