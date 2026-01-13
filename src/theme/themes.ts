// Theme type definition
// GeneHub Design System - Refonte Visuelle 2026
// GenoDB Atlas v3.2 - Clarity Evolution
import * as tokens from './design-tokens';

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
// Basé sur Inter + IBM Plex Mono
export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '600' as const, lineHeight: 32 },
  h3: { fontSize: 18, fontWeight: '500' as const, lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 25.6 },  // 1.6 ratio
  bodySmall: { fontSize: 15, fontWeight: '400' as const, lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 20.8 },
  overline: { fontSize: 11, fontWeight: '600' as const, lineHeight: 16, letterSpacing: 0.5 },
  metric: { fontSize: 28, fontWeight: '600' as const, lineHeight: 34 },
  metricLabel: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  // Atlas v3.2 additions
  label: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
  labelSmall: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  mono: { fontSize: 14, fontWeight: '400' as const, lineHeight: 22.4 },  // Pour séquences/code
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
  sm: 6,      // Boutons
  md: 8,      // Tags
  lg: 10,     // Cartes
  xl: 12,
  full: 9999,
};

export type Theme = {
  name: string;
  isDark: boolean;
  colors: ThemeColors;
};

// ============================================
// Brand Colors (Nouvelle Identité 2026)
// ============================================
const brand = {
  accentBlue: tokens.baseColors.accentBleu,
  accentCyan: tokens.baseColors.accentCyan,
  mintGreen: tokens.baseColors.vertMenthe,
  amberYellow: tokens.baseColors.jauneAmbre,
  cherryRed: tokens.baseColors.rougeCerise,
  spectrumViolet: tokens.baseColors.violetSpectre,
};

// Source-specific colors for provenance tracking
const sourceColors = {
  ncbi: brand.accentBlue,
  uniprot: brand.amberYellow,
  pdb: brand.mintGreen,
  biocyc: brand.spectrumViolet,
};

// ============================================
// LIGHT THEME - Support futur
// ============================================
export const quietLuxuryLight: Theme = {
  name: 'Light',
  isDark: false,
  colors: {
    // Backgrounds - Clean Lab Grade
    bg: '#FAFAFB',
    bgSecondary: '#FFFFFF',
    bgTertiary: '#F4F6F7',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    card: '#FFFFFF',
    cardHover: '#FAFAFB',
    
    // Text - Refined hierarchy (WCAG AA)
    text: '#111315',
    textSecondary: '#5A5F64',
    textMuted: '#9CA3AF',
    textInverse: '#FFFFFF',
    
    // Accent - Nouvelle palette
    accent: brand.accentBlue,
    accentLight: brand.accentCyan,
    accentDark: '#2A8CD9',
    accentMuted: 'rgba(58, 160, 244, 0.2)',
    
    // Semantic - Clear distinction
    success: '#16A34A',
    warning: '#D97706',
    error: '#DC2626',
    info: brand.accentBlue,
    
    // Borders - Hairline precision
    border: '#E1E4E8',
    borderLight: '#F0F2F4',
    borderHairline: 'rgba(0, 0, 0, 0.08)',
    divider: '#F0F2F4',
    
    // Shadows - Subtle
    shadow: 'rgba(0, 0, 0, 0.08)',
    shadowSoft: 'rgba(0, 0, 0, 0.03)',
    
    // Buttons
    buttonPrimary: brand.accentBlue,
    buttonPrimaryText: '#FFFFFF',
    buttonSecondary: 'transparent',
    buttonSecondaryText: brand.accentBlue,
    buttonDisabled: '#E5E7EB',
    buttonDisabledText: '#9CA3AF',
    
    // Inputs
    inputBg: '#FFFFFF',
    inputBorder: '#E1E4E8',
    inputBorderFocus: brand.accentBlue,
    inputPlaceholder: '#9CA3AF',
    
    // Special elements
    star: brand.amberYellow,
    starMuted: '#D1D5DB',
    link: brand.accentBlue,
    
    // Chips - Outline style
    chipBg: 'transparent',
    chipBorder: '#E5E7EB',
    chipText: '#374151',

    // Chip colors by entity type (pastel primaries)
    chipGeneBg: tokens.entityColors.light.gene.bg,
    chipGeneBorder: tokens.entityColors.light.gene.border,
    chipGeneText: tokens.entityColors.light.gene.text,
    
    chipPersonBg: tokens.entityColors.light.researcher.bg,
    chipPersonBorder: tokens.entityColors.light.researcher.border,
    chipPersonText: tokens.entityColors.light.researcher.text,
    
    chipReferenceBg: tokens.entityColors.light.article.bg,
    chipReferenceBorder: tokens.entityColors.light.article.border,
    chipReferenceText: tokens.entityColors.light.article.text,
    
    chipConferenceBg: tokens.entityColors.light.conference.bg,
    chipConferenceBorder: tokens.entityColors.light.conference.border,
    chipConferenceText: tokens.entityColors.light.conference.text,
    
    chipDateBg: tokens.entityColors.light.temporal.bg,
    chipDateBorder: tokens.entityColors.light.temporal.border,
    chipDateText: tokens.entityColors.light.temporal.text,
    
    // Skeleton loading
    skeleton: '#F3F4F6',
    skeletonHighlight: '#FAFBFC',
    
    // Note surface (inline tinted)
    noteSurface: 'rgba(17, 24, 39, 0.04)',
    
    // Evidence & Curation (Atlas v3.2)
    evidenceCurated: '#16A34A',
    evidenceVerified: brand.accentBlue,
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

// DARK THEME - Nouveau Design 2026
// ============================================
export const quietLuxuryDark: Theme = {
  name: 'Dark',
  isDark: true,
  colors: {
    // Backgrounds - Nouveau design sombre moderne
    bg: tokens.baseColors.nuitProfonde,
    bgSecondary: tokens.baseColors.ardoise,
    bgTertiary: '#131516',
    surface: tokens.baseColors.ardoise,
    surfaceElevated: '#1F2326',
    card: tokens.baseColors.ardoise,
    cardHover: '#1F2326',
    
    // Text - WCAG AA compliant
    text: tokens.baseColors.blancCasse,
    textSecondary: tokens.baseColors.grisBrume,
    textMuted: '#787D80',
    textInverse: tokens.baseColors.nuitProfonde,
    
    // Accent - Nouvelle palette bleue/cyan
    accent: brand.accentBlue,
    accentLight: brand.accentCyan,
    accentDark: '#2A8CD9',
    accentMuted: 'rgba(58, 160, 244, 0.2)',
    
    // Semantic - Couleurs vives pour thème sombre
    success: brand.mintGreen,
    warning: brand.amberYellow,
    error: brand.cherryRed,
    info: brand.accentCyan,
    
    // Borders - Graphite clair
    border: tokens.baseColors.graphiteClair,
    borderLight: '#1F2326',
    borderHairline: 'rgba(255, 255, 255, 0.08)',
    divider: tokens.baseColors.graphiteClair,
    
    // Shadows
    shadow: 'rgba(0, 0, 0, 0.4)',
    shadowSoft: 'rgba(0, 0, 0, 0.2)',
    
    // Buttons
    buttonPrimary: brand.accentBlue,
    buttonPrimaryText: '#FFFFFF',
    buttonSecondary: 'transparent',
    buttonSecondaryText: brand.accentBlue,
    buttonDisabled: tokens.baseColors.graphiteClair,
    buttonDisabledText: '#5C6370',
    
    // Inputs
    inputBg: tokens.baseColors.ardoise,
    inputBorder: tokens.baseColors.graphiteClair,
    inputBorderFocus: brand.accentBlue,
    inputPlaceholder: '#787D80',
    
    // Special elements
    star: brand.amberYellow,
    starMuted: '#4B5563',
    link: brand.accentCyan,
    
    // Chips - Outline style
    chipBg: 'transparent',
    chipBorder: tokens.baseColors.graphiteClair,
    chipText: tokens.baseColors.grisBrume,

    // Chip colors by entity type (nouvelle palette)
    chipGeneBg: tokens.entityColors.dark.gene.bg,
    chipGeneBorder: tokens.entityColors.dark.gene.border,
    chipGeneText: tokens.entityColors.dark.gene.text,
    
    chipPersonBg: tokens.entityColors.dark.researcher.bg,
    chipPersonBorder: tokens.entityColors.dark.researcher.border,
    chipPersonText: tokens.entityColors.dark.researcher.text,
    
    chipReferenceBg: tokens.entityColors.dark.article.bg,
    chipReferenceBorder: tokens.entityColors.dark.article.border,
    chipReferenceText: tokens.entityColors.dark.article.text,
    
    chipConferenceBg: tokens.entityColors.dark.conference.bg,
    chipConferenceBorder: tokens.entityColors.dark.conference.border,
    chipConferenceText: tokens.entityColors.dark.conference.text,
    
    chipDateBg: tokens.entityColors.dark.temporal.bg,
    chipDateBorder: tokens.entityColors.dark.temporal.border,
    chipDateText: tokens.entityColors.dark.temporal.text,
    
    // Skeleton loading
    skeleton: '#1F2326',
    skeletonHighlight: tokens.baseColors.graphiteClair,
    
    // Note surface (nouvelle couleur)
    noteSurface: '#131516',
    
    // Evidence & Curation (Atlas v3.2)
    evidenceCurated: brand.mintGreen,
    evidenceVerified: brand.accentBlue,
    evidenceImported: tokens.baseColors.grisBrume,
    conflictBadgeBg: '#422006',
    conflictBadgeText: brand.amberYellow,
    
    // Source colors
    sourceNcbi: sourceColors.ncbi,
    sourceUniprot: sourceColors.uniprot,
    sourcePdb: sourceColors.pdb,
    sourceBiocyc: sourceColors.biocyc,
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
