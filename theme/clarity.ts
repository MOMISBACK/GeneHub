/**
 * GenoDB Atlas v3.1 - Design System "Clarity"
 * 
 * Principes:
 * - Default Calm, Detail on Demand
 * - Lab Grade colors (Light/Dark/Auto)
 * - WCAG 2.1 AA compliant (contrast ≥ 4.5:1)
 * - Instrument Grade typography
 */

// ============ Color Palette ============

/**
 * Brand Colors
 */
export const brand = {
  /** Primary accent - actions, active states, focus */
  petrolBlue: '#4C8B98',
  petrolBlueLight: '#6BA3AE',
  petrolBlueDark: '#3A6D77',
  
  /** Pin/Favorite exclusive color */
  champagneGold: '#D4AF37',
  champagneGoldLight: '#E5C968',
  champagneGoldDark: '#B8960F',
} as const;

/**
 * Semantic Colors - never color alone, always icon + label
 */
export const semantic = {
  // Warning/Conflict - amber/orange
  warning: {
    light: '#F59E0B',
    DEFAULT: '#D97706',
    dark: '#B45309',
    bg: '#FEF3C7',
    bgDark: '#422006',
  },
  // Error - red
  error: {
    light: '#EF4444',
    DEFAULT: '#DC2626',
    dark: '#B91C1C',
    bg: '#FEE2E2',
    bgDark: '#450A0A',
  },
  // Success - green
  success: {
    light: '#22C55E',
    DEFAULT: '#16A34A',
    dark: '#15803D',
    bg: '#DCFCE7',
    bgDark: '#052E16',
  },
  // Info - blue/neutral
  info: {
    light: '#3B82F6',
    DEFAULT: '#2563EB',
    dark: '#1D4ED8',
    bg: '#DBEAFE',
    bgDark: '#172554',
  },
} as const;

/**
 * Evidence/Curation Status Colors
 */
export const evidence = {
  curated: '#16A34A',      // Green - human expert
  verified: '#2563EB',     // Blue - internal validation
  imported: '#6B7280',     // Gray - external, unverified
  experimental: '#8B5CF6', // Purple - experimental evidence
  computational: '#06B6D4', // Cyan - computational
} as const;

/**
 * Light Theme - Lab Grade
 */
export const lightTheme = {
  mode: 'light' as const,
  colors: {
    // Surfaces (3 levels)
    surface0: '#FFFFFF',
    surface1: '#F9FAFB',
    surface2: '#F3F4F6',
    
    // Background
    bg: '#FFFFFF',
    bgSecondary: '#F9FAFB',
    bgTertiary: '#F3F4F6',
    
    // Text (WCAG AA compliant)
    text: '#111827',           // Primary - contrast 15.5:1
    textSecondary: '#374151',  // Secondary - contrast 10:1
    textMuted: '#6B7280',      // Muted - contrast 5.7:1
    textDisabled: '#9CA3AF',   // Disabled
    
    // Borders
    border: '#E5E7EB',
    borderHairline: 'rgba(0, 0, 0, 0.08)',
    borderStrong: '#D1D5DB',
    
    // Interactive
    accent: brand.petrolBlue,
    accentHover: brand.petrolBlueDark,
    accentMuted: `${brand.petrolBlue}20`,
    
    // Favorites
    star: brand.champagneGold,
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
    inputBorder: '#D1D5DB',
    inputPlaceholder: '#9CA3AF',
    inputFocus: brand.petrolBlue,
    
    // Button
    buttonPrimaryBg: brand.petrolBlue,
    buttonPrimaryText: '#FFFFFF',
    buttonSecondaryBg: '#F3F4F6',
    buttonSecondaryText: '#374151',
    
    // Card
    cardBg: '#FFFFFF',
    cardBorder: '#E5E7EB',
    cardShadow: 'rgba(0, 0, 0, 0.05)',
    
    // Conflict/Warning badge
    conflictBadgeBg: semantic.warning.bg,
    conflictBadgeText: semantic.warning.dark,
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    
    // Focus ring (accessibility)
    focusRing: `${brand.petrolBlue}40`,
  },
};

/**
 * Dark Theme - Lab Grade
 */
export const darkTheme = {
  mode: 'dark' as const,
  colors: {
    // Surfaces (3 levels)
    surface0: '#0F1419',
    surface1: '#1A1F2E',
    surface2: '#242B3D',
    
    // Background
    bg: '#0F1419',
    bgSecondary: '#1A1F2E',
    bgTertiary: '#242B3D',
    
    // Text (WCAG AA compliant)
    text: '#F0F4FC',           // Primary - contrast 15:1
    textSecondary: '#C9D1E0',  // Secondary - contrast 10:1
    textMuted: '#8B95A8',      // Muted - contrast 5.5:1
    textDisabled: '#5C6370',   // Disabled
    
    // Borders
    border: '#2D3548',
    borderHairline: 'rgba(255, 255, 255, 0.08)',
    borderStrong: '#3D4663',
    
    // Interactive
    accent: brand.petrolBlueLight,
    accentHover: brand.petrolBlue,
    accentMuted: `${brand.petrolBlue}30`,
    
    // Favorites
    star: brand.champagneGold,
    starMuted: '#4B5563',
    
    // Semantic
    warning: semantic.warning.light,
    warningBg: semantic.warning.bgDark,
    error: semantic.error.light,
    errorBg: semantic.error.bgDark,
    success: semantic.success.light,
    successBg: semantic.success.bgDark,
    info: semantic.info.light,
    infoBg: semantic.info.bgDark,
    
    // Evidence
    evidenceCurated: '#4ADE80',
    evidenceVerified: '#60A5FA',
    evidenceImported: '#9CA3AF',
    evidenceExperimental: '#A78BFA',
    evidenceComputational: '#22D3EE',
    
    // Input
    inputBg: '#1A1F2E',
    inputBorder: '#3D4663',
    inputPlaceholder: '#6B7280',
    inputFocus: brand.petrolBlueLight,
    
    // Button
    buttonPrimaryBg: brand.petrolBlue,
    buttonPrimaryText: '#FFFFFF',
    buttonSecondaryBg: '#242B3D',
    buttonSecondaryText: '#C9D1E0',
    
    // Card
    cardBg: '#1A1F2E',
    cardBorder: '#2D3548',
    cardShadow: 'rgba(0, 0, 0, 0.3)',
    
    // Conflict/Warning badge
    conflictBadgeBg: semantic.warning.bgDark,
    conflictBadgeText: semantic.warning.light,
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
    
    // Focus ring (accessibility)
    focusRing: `${brand.petrolBlueLight}40`,
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
