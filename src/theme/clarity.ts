/**
 * GeneHub Design System - Refonte Visuelle 2026
 * GenoDB Atlas v3.2 - Clarity Evolution
 * 
 * Principes:
 * - Thème sombre moderne et scientifique
 * - Lisible sur écrans de laboratoire
 * - WCAG 2.1 AA compliant (contrast ≥ 4.5:1)
 * - Support mode clair avec tokens CSS
 * - Typographie Inter + IBM Plex Mono
 */

import * as tokens from './design-tokens';

// ============ Color Palette ============

/**
 * Brand Colors - Nouvelle identité visuelle
 */
export const brand = {
  /** Primary accent - actions, active states, focus */
  accentBlue: tokens.baseColors.accentBleu,
  accentCyan: tokens.baseColors.accentCyan,
  
  /** Success/validation color */
  mintGreen: tokens.baseColors.vertMenthe,
  
  /** Warning/attention color */
  amberYellow: tokens.baseColors.jauneAmbre,
  
  /** Error color */
  cherryRed: tokens.baseColors.rougeCerise,
  
  /** Scientific/conference accent */
  spectrumViolet: tokens.baseColors.violetSpectre,
} as const;

/**
 * Semantic Colors - never color alone, always icon + label
 */
export const semantic = {
  // Warning/Conflict - amber
  warning: {
    light: tokens.baseColors.jauneAmbre,
    DEFAULT: '#F59E0B',
    dark: '#B45309',
    bg: '#FEF3C7',
    bgDark: '#422006',
  },
  // Error - red
  error: {
    light: '#EF4444',
    DEFAULT: tokens.baseColors.rougeCerise,
    dark: '#B91C1C',
    bg: '#FEE2E2',
    bgDark: '#450A0A',
  },
  // Success - green
  success: {
    light: tokens.baseColors.vertMenthe,
    DEFAULT: '#16A34A',
    dark: '#15803D',
    bg: '#DCFCE7',
    bgDark: '#052E16',
  },
  // Info - blue/cyan
  info: {
    light: tokens.baseColors.accentCyan,
    DEFAULT: tokens.baseColors.accentBleu,
    dark: '#1D4ED8',
    bg: '#DBEAFE',
    bgDark: '#172554',
  },
} as const;

/**
 * Evidence/Curation Status Colors
 */
export const evidence = {
  curated: tokens.baseColors.vertMenthe,      // Green - human expert
  verified: tokens.baseColors.accentBleu,     // Blue - internal validation
  imported: tokens.baseColors.grisBrume,      // Gray - external, unverified
  experimental: tokens.baseColors.violetSpectre, // Purple - experimental evidence
  computational: tokens.baseColors.accentCyan, // Cyan - computational
} as const;

/**
 * Light Theme - Support futur
 */
export const lightTheme = {
  mode: 'light' as const,
  colors: {
    // Surfaces (3 levels)
    surface0: '#FFFFFF',
    surface1: '#FAFAFB',
    surface2: '#F4F6F7',
    
    // Background
    bg: '#FAFAFB',
    bgSecondary: '#FFFFFF',
    bgTertiary: '#F4F6F7',
    
    // Text (WCAG AA compliant)
    text: '#111315',           // Primary
    textSecondary: '#5A5F64',  // Secondary
    textMuted: '#9CA3AF',      // Muted
    textDisabled: 'rgba(17, 19, 21, 0.5)',   // Disabled
    
    // Borders
    border: '#E1E4E8',
    borderHairline: 'rgba(0, 0, 0, 0.08)',
    borderStrong: '#D1D5DB',
    
    // Interactive
    accent: brand.accentBlue,
    accentHover: brand.accentCyan,
    accentMuted: 'rgba(58, 160, 244, 0.2)',
    
    // Favorites
    star: brand.amberYellow,
    starMuted: '#D1D5DB',
    
    // Semantic
    warning: semantic.warning.DEFAULT,
    warningBg: semantic.warning.bg,
    error: semantic.error.DEFAULT,
    errorBg: semantic.error.bg,
    success: semantic.success.DEFAULT,
    successBg: semantic.success.bg,
    info: semantic.info.DEFAULT,
    infoBg: semantic.info.bg,
    
    // Evidence
    evidenceCurated: evidence.curated,
    evidenceVerified: evidence.verified,
    evidenceImported: evidence.imported,
    evidenceExperimental: evidence.experimental,
    evidenceComputational: evidence.computational,
    
    // Input
    inputBg: '#FFFFFF',
    inputBorder: '#E1E4E8',
    inputPlaceholder: '#9CA3AF',
    inputFocus: brand.accentBlue,
    
    // Button
    buttonPrimaryBg: brand.accentBlue,
    buttonPrimaryText: '#FFFFFF',
    buttonSecondaryBg: 'transparent',
    buttonSecondaryText: brand.accentBlue,
    
    // Card
    cardBg: '#FFFFFF',
    cardBorder: '#E1E4E8',
    cardShadow: 'rgba(0, 0, 0, 0.12)',
    
    // Conflict/Warning badge
    conflictBadgeBg: semantic.warning.bg,
    conflictBadgeText: semantic.warning.dark,
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    
    // Focus ring (accessibility)
    focusRing: 'rgba(58, 160, 244, 0.13)',
    
    // Shadows with glow
    shadowGlow: 'rgba(58, 160, 244, 0.06)',
  },
};

/**
 * Dark Theme - Nouveau Design 2026
 */
export const darkTheme = {
  mode: 'dark' as const,
  colors: {
    // Surfaces (3 levels) - Nouvelle palette
    surface0: tokens.baseColors.nuitProfonde,
    surface1: tokens.baseColors.ardoise,
    surface2: '#1F2326',
    
    // Background
    bg: tokens.baseColors.nuitProfonde,
    bgSecondary: tokens.baseColors.ardoise,
    bgTertiary: '#131516',
    
    // Text (WCAG AA compliant)
    text: tokens.baseColors.blancCasse,           // Primary
    textSecondary: tokens.baseColors.grisBrume,   // Secondary
    textMuted: '#787D80',                         // Muted
    textDisabled: 'rgba(244, 246, 247, 0.5)',     // Disabled
    
    // Borders
    border: tokens.baseColors.graphiteClair,
    borderHairline: 'rgba(255, 255, 255, 0.08)',
    borderStrong: '#3D4663',
    
    // Interactive
    accent: brand.accentBlue,
    accentHover: brand.accentCyan,
    accentMuted: 'rgba(58, 160, 244, 0.2)',
    
    // Favorites
    star: brand.amberYellow,
    starMuted: '#4B5563',
    
    // Semantic
    warning: semantic.warning.light,
    warningBg: semantic.warning.bgDark,
    error: semantic.error.DEFAULT,
    errorBg: semantic.error.bgDark,
    success: semantic.success.light,
    successBg: semantic.success.bgDark,
    info: semantic.info.light,
    infoBg: semantic.info.bgDark,
    
    // Evidence
    evidenceCurated: brand.mintGreen,
    evidenceVerified: brand.accentBlue,
    evidenceImported: tokens.baseColors.grisBrume,
    evidenceExperimental: brand.spectrumViolet,
    evidenceComputational: brand.accentCyan,
    
    // Input
    inputBg: tokens.baseColors.ardoise,
    inputBorder: tokens.baseColors.graphiteClair,
    inputPlaceholder: '#787D80',
    inputFocus: brand.accentBlue,
    
    // Button
    buttonPrimaryBg: brand.accentBlue,
    buttonPrimaryText: '#FFFFFF',
    buttonSecondaryBg: 'transparent',
    buttonSecondaryText: brand.accentBlue,
    
    // Card
    cardBg: tokens.baseColors.ardoise,
    cardBorder: tokens.baseColors.graphiteClair,
    cardShadow: 'rgba(0, 0, 0, 0.4)',
    
    // Conflict/Warning badge
    conflictBadgeBg: semantic.warning.bgDark,
    conflictBadgeText: semantic.warning.light,
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
    
    // Focus ring (accessibility)
    focusRing: 'rgba(58, 160, 244, 0.13)',
    
    // Shadows with glow
    shadowGlow: 'rgba(58, 160, 244, 0.06)',
  },
};

/**
 * High Contrast Theme (Accessibility)
 */
export const highContrastTheme = {
  mode: 'highContrast' as const,
  colors: {
    ...darkTheme.colors,
    // Override with maximum contrast
    text: '#FFFFFF',
    textSecondary: '#E5E7EB',
    textMuted: '#D1D5DB',
    bg: '#000000',
    bgSecondary: '#0A0A0A',
    surface0: '#000000',
    surface1: '#0A0A0A',
    surface2: '#141414',
    border: '#FFFFFF',
    borderHairline: 'rgba(255, 255, 255, 0.3)',
    accent: '#00D4FF',
    focusRing: '#00D4FF',
  },
};

// ============ Typography ============

/**
 * Font Families
 * - Inter: UI + text
 * - JetBrains Mono: identifiers, sequences, accession
 */
export const fontFamily = {
  sans: 'Inter',
  mono: 'JetBrains Mono',
} as const;

/**
 * Typography Scale (4px grid rhythm)
 * Optimized for scientific readability
 */
export const typography = {
  // Display
  displayLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600' as const,
    letterSpacing: -0.25,
  },
  
  // Headings
  h1: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
    letterSpacing: -0.25,
  },
  h2: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  h4: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  
  // Body
  bodyLarge: {
    fontSize: 16,
    lineHeight: 26, // 1.6 ratio for long form
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  bodySmall: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  
  // Labels & UI
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: 0,
  },
  labelSmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
  },
  
  // Caption & Overline
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.1,
  },
  overline: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  
  // Monospace (identifiers, sequences)
  mono: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0,
    fontFamily: fontFamily.mono,
  },
  monoSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0,
    fontFamily: fontFamily.mono,
  },
} as const;

// ============ Spacing ============

/**
 * Spacing scale (4px base grid)
 */
export const spacing = {
  /** 2px */
  xxs: 2,
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 20px */
  xl: 20,
  /** 24px */
  xxl: 24,
  /** 32px */
  xxxl: 32,
  /** 40px */
  huge: 40,
  /** 48px */
  giant: 48,
} as const;

// ============ Radius ============

/**
 * Border radius scale
 */
export const radius = {
  /** 2px - subtle */
  xs: 2,
  /** 4px - small elements */
  sm: 4,
  /** 6px - default */
  md: 6,
  /** 8px - cards */
  lg: 8,
  /** 12px - modals */
  xl: 12,
  /** 16px - large containers */
  xxl: 16,
  /** Full round */
  full: 9999,
} as const;

// ============ Shadows ============

/**
 * Shadow scale for elevation
 */
export const shadows = {
  none: 'none',
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// ============ Animation ============

/**
 * Animation durations (ms)
 */
export const duration = {
  instant: 0,
  fast: 100,
  normal: 200,
  slow: 300,
  slower: 500,
} as const;

/**
 * Easing curves
 */
export const easing = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
} as const;

// ============ Accessibility ============

/**
 * Minimum touch target size (WCAG 2.1)
 */
export const touchTarget = {
  min: 44,
  comfortable: 48,
} as const;

/**
 * Focus ring styles
 */
export const focusRing = {
  width: 2,
  offset: 2,
  style: 'solid' as const,
} as const;

// ============ Theme Type ============

export type ClarityTheme = typeof lightTheme | typeof darkTheme | typeof highContrastTheme;
export type ThemeMode = 'light' | 'dark' | 'auto' | 'highContrast';
export type ThemeColors = typeof lightTheme.colors;

// ============ Export Default ============

export const themes = {
  light: lightTheme,
  dark: darkTheme,
  highContrast: highContrastTheme,
} as const;

export default themes;
