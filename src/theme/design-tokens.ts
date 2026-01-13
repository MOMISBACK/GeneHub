/**
 * GeneHub Design System - Refonte Visuelle 2026
 * 
 * Thème sombre moderne et scientifique
 * Optimisé pour les écrans de laboratoire
 * Support du mode clair pour flexibilité future
 */

// ============================================
// 🎨 PALETTE DE COULEURS PRINCIPALE
// ============================================

/**
 * Couleurs de base - Thème sombre
 */
export const baseColors = {
  // Backgrounds
  nuitProfonde: '#0C0E0F',      // Fond principal
  ardoise: '#1A1C1E',            // Surfaces secondaires
  graphiteClair: '#2C2F33',      // Contours / séparations
  
  // Text
  blancCasse: '#F4F6F7',         // Texte principal
  grisBrume: '#A7B0B5',          // Texte secondaire
  
  // Accents interactifs
  accentBleu: '#3AA0F4',         // Couleur principale interactive
  accentCyan: '#63D2F9',         // Hover links, surbrillance
  
  // Sémantiques
  vertMenthe: '#4FE1B8',         // Succès / validation
  rougeCerise: '#E65C5C',        // Erreurs / alertes
  violetSpectre: '#8F77F4',      // Élément scientifique / tag conf
  jauneAmbre: '#FFC656',         // Attention / notes importantes
} as const;

/**
 * Couleurs de fond spécifiques
 */
export const surfaceColors = {
  dark: {
    primary: baseColors.nuitProfonde,
    secondary: baseColors.ardoise,
    tertiary: '#131516',          // Pour les notes
    elevated: '#1F2326',          // Pour éléments sélectionnés
  },
  light: {
    primary: '#FAFAFB',
    secondary: '#FFFFFF',
    tertiary: '#F4F6F7',
    elevated: '#FFFFFF',
  }
} as const;

/**
 * Couleurs de texte
 */
export const textColors = {
  dark: {
    primary: baseColors.blancCasse,
    secondary: baseColors.grisBrume,
    placeholder: '#787D80',
    disabled: 'rgba(244, 246, 247, 0.5)',
  },
  light: {
    primary: '#111315',
    secondary: '#5A5F64',
    placeholder: '#9CA3AF',
    disabled: 'rgba(17, 19, 21, 0.5)',
  }
} as const;

/**
 * Couleurs de bordures
 */
export const borderColors = {
  dark: {
    default: baseColors.graphiteClair,
    light: '#1F2326',
    subtle: 'rgba(44, 47, 51, 0.5)',
    focus: baseColors.accentBleu,
    focusGlow: 'rgba(58, 160, 244, 0.13)',
  },
  light: {
    default: '#E1E4E8',
    light: '#F0F2F4',
    subtle: 'rgba(225, 228, 232, 0.5)',
    focus: baseColors.accentBleu,
    focusGlow: 'rgba(58, 160, 244, 0.13)',
  }
} as const;

/**
 * Couleurs d'ombres
 */
export const shadowColors = {
  dark: {
    default: 'rgba(0, 0, 0, 0.25)',
    card: 'rgba(0, 0, 0, 0.4)',
    elevated: 'rgba(0, 0, 0, 0.5)',
    glow: 'rgba(58, 160, 244, 0.06)',
  },
  light: {
    default: 'rgba(0, 0, 0, 0.08)',
    card: 'rgba(0, 0, 0, 0.12)',
    elevated: 'rgba(0, 0, 0, 0.16)',
    glow: 'rgba(58, 160, 244, 0.06)',
  }
} as const;

// ============================================
// 🏷️ COULEURS PAR TYPE D'ENTITÉ (Tags/Badges)
// ============================================

export const entityColors = {
  dark: {
    gene: {
      bg: '#173347',
      text: baseColors.accentCyan,
      border: 'rgba(99, 210, 249, 0.3)',
    },
    researcher: {
      bg: '#15392C',
      text: baseColors.vertMenthe,
      border: 'rgba(79, 225, 184, 0.3)',
    },
    conference: {
      bg: '#21164F',
      text: baseColors.violetSpectre,
      border: 'rgba(143, 119, 244, 0.3)',
    },
    organism: {
      bg: '#433B28',
      text: baseColors.jauneAmbre,
      border: 'rgba(255, 198, 86, 0.3)',
    },
    temporal: {
      bg: '#26292B',
      text: baseColors.grisBrume,
      border: 'rgba(167, 176, 181, 0.3)',
    },
    article: {
      bg: '#173347',
      text: baseColors.accentCyan,
      border: 'rgba(99, 210, 249, 0.3)',
    },
  },
  light: {
    gene: {
      bg: '#E0F2FE',
      text: '#0369A1',
      border: '#BAE6FD',
    },
    researcher: {
      bg: '#D1FAE5',
      text: '#047857',
      border: '#A7F3D0',
    },
    conference: {
      bg: '#EDE9FE',
      text: '#6D28D9',
      border: '#DDD6FE',
    },
    organism: {
      bg: '#FEF3C7',
      text: '#B45309',
      border: '#FDE68A',
    },
    temporal: {
      bg: '#F3F4F6',
      text: '#374151',
      border: '#E5E7EB',
    },
    article: {
      bg: '#E0F2FE',
      text: '#0369A1',
      border: '#BAE6FD',
    },
  }
} as const;

// ============================================
// 🎭 ÉTATS INTERACTIFS
// ============================================

export const interactiveStates = {
  hover: {
    bgLift: 0.05,              // Augmentation de luminosité (5%)
    opacity: 0.9,
    cursor: 'pointer',
  },
  active: {
    bg: '#1F2326',
    text: baseColors.accentBleu,
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  loading: {
    color: baseColors.accentBleu,
    duration: '1.2s',
  }
} as const;

// ============================================
// ✍️ TYPOGRAPHIE
// ============================================

/**
 * Familles de polices
 * Inter pour l'UI, IBM Plex Mono pour le code
 */
export const fontFamilies = {
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: '"IBM Plex Mono", "SF Mono", Monaco, "Cascadia Code", monospace',
} as const;

/**
 * Échelle typographique
 */
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    fontFamily: fontFamilies.sans,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    fontFamily: fontFamilies.sans,
  },
  h3: {
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 26,
    fontFamily: fontFamilies.sans,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 25.6,  // 1.6 ratio
    fontFamily: fontFamilies.sans,
  },
  bodySmall: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 24,    // 1.6 ratio
    fontFamily: fontFamilies.sans,
  },
  small: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 20.8,  // 1.6 ratio
    fontFamily: fontFamilies.sans,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    fontFamily: fontFamilies.sans,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    fontFamily: fontFamilies.sans,
  },
  mono: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 22.4,  // 1.6 ratio
    fontFamily: fontFamilies.mono,
  },
} as const;

// ============================================
// 📐 GRILLE & ESPACEMENTS
// ============================================

/**
 * Système d'espacement base 8px
 */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  
  // Espacements sémantiques
  componentPadding: 16,      // Padding standard composants
  sectionGap: 24,            // Entre sections
  cardGap: 16,               // Entre cartes
  titleGap: 8,               // Entre titre et texte
} as const;

/**
 * Border radius
 */
export const borderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  pill: 999,
  
  // Sémantiques
  button: 6,
  input: 6,
  card: 10,
  tag: 8,
} as const;

/**
 * Tailles maximales
 */
export const maxWidths = {
  content: 960,      // Largeur max de contenu
  note: 700,         // Notes
  input: 480,        // Champs de formulaire
} as const;

// ============================================
// 🧩 COMPOSANTS - STYLES
// ============================================

/**
 * Boutons
 */
export const buttonStyles = {
  primary: {
    dark: {
      bg: baseColors.accentBleu,
      bgHover: baseColors.accentCyan,
      text: '#FFFFFF',
      borderRadius: borderRadius.button,
      minHeight: 44,
      shadow: shadowColors.dark.default,
    },
    light: {
      bg: baseColors.accentBleu,
      bgHover: baseColors.accentCyan,
      text: '#FFFFFF',
      borderRadius: borderRadius.button,
      minHeight: 44,
      shadow: shadowColors.light.default,
    }
  },
  secondary: {
    dark: {
      bg: 'transparent',
      bgHover: '#173347',
      text: baseColors.accentBleu,
      border: `1px solid ${baseColors.accentBleu}`,
      borderRadius: borderRadius.button,
      minHeight: 44,
    },
    light: {
      bg: 'transparent',
      bgHover: '#E0F2FE',
      text: baseColors.accentBleu,
      border: `1px solid ${baseColors.accentBleu}`,
      borderRadius: borderRadius.button,
      minHeight: 44,
    }
  },
  ghost: {
    dark: {
      bg: 'transparent',
      bgHover: '#1D2125',
      text: baseColors.grisBrume,
      borderRadius: borderRadius.button,
      minHeight: 44,
    },
    light: {
      bg: 'transparent',
      bgHover: '#F3F4F6',
      text: '#5A5F64',
      borderRadius: borderRadius.button,
      minHeight: 44,
    }
  }
} as const;

/**
 * Champs de saisie
 */
export const inputStyles = {
  dark: {
    bg: baseColors.ardoise,
    text: baseColors.blancCasse,
    placeholder: '#787D80',
    border: borderColors.dark.default,
    borderFocus: baseColors.accentBleu,
    borderRadius: borderRadius.input,
    glow: borderColors.dark.focusGlow,
  },
  light: {
    bg: '#FFFFFF',
    text: '#111315',
    placeholder: '#9CA3AF',
    border: borderColors.light.default,
    borderFocus: baseColors.accentBleu,
    borderRadius: borderRadius.input,
    glow: borderColors.light.focusGlow,
  }
} as const;

/**
 * Cartes
 */
export const cardStyles = {
  dark: {
    bg: baseColors.ardoise,
    border: `1px solid ${baseColors.graphiteClair}`,
    borderRadius: borderRadius.card,
    shadow: `0 2px 8px ${shadowColors.dark.card}`,
    hoverShadow: `0 4px 16px ${shadowColors.dark.elevated}, 0 0 0 1px ${shadowColors.dark.glow}`,
    hoverTransform: 'translateY(-2px)',
  },
  light: {
    bg: '#FFFFFF',
    border: `1px solid ${borderColors.light.default}`,
    borderRadius: borderRadius.card,
    shadow: `0 2px 8px ${shadowColors.light.card}`,
    hoverShadow: `0 4px 16px ${shadowColors.light.elevated}, 0 0 0 1px ${shadowColors.light.glow}`,
    hoverTransform: 'translateY(-2px)',
  }
} as const;

/**
 * Navigation / Tabs
 */
export const navigationStyles = {
  dark: {
    bg: baseColors.nuitProfonde,
    borderTop: `1px solid ${baseColors.graphiteClair}`,
    iconSize: 24,
    labelSize: 12,
    activeColor: baseColors.accentBleu,
    inactiveColor: baseColors.grisBrume,
    transition: '200ms ease',
  },
  light: {
    bg: '#FFFFFF',
    borderTop: `1px solid ${borderColors.light.default}`,
    iconSize: 24,
    labelSize: 12,
    activeColor: baseColors.accentBleu,
    inactiveColor: '#5A5F64',
    transition: '200ms ease',
  }
} as const;

/**
 * Tags / Badges
 */
export const tagStyles = {
  borderRadius: borderRadius.tag,
  padding: '4px 8px',
  fontSize: 13,
  fontWeight: '500' as const,
} as const;

/**
 * Notes
 */
export const noteStyles = {
  dark: {
    bg: '#131516',
    maxWidth: maxWidths.note,
    separator: `1px solid ${baseColors.graphiteClair}`,
    buttonBg: baseColors.accentBleu,
    buttonRadius: 20,
  },
  light: {
    bg: '#FAFBFC',
    maxWidth: maxWidths.note,
    separator: `1px solid ${borderColors.light.default}`,
    buttonBg: baseColors.accentBleu,
    buttonRadius: 20,
  }
} as const;

// ============================================
// 🧠 ICÔNES
// ============================================

export const iconStyles = {
  size: {
    sm: 16,
    md: 20,
    lg: 24,
  },
  strokeWidth: 1.5,
  colors: {
    dark: {
      default: baseColors.grisBrume,
      hover: baseColors.accentBleu,
      active: baseColors.accentBleu,
    },
    light: {
      default: '#5A5F64',
      hover: baseColors.accentBleu,
      active: baseColors.accentBleu,
    }
  }
} as const;

/**
 * Icônes par section
 */
export const sectionIcons = {
  inbox: { name: 'inbox', color: baseColors.accentCyan },
  notes: { name: 'file-text', color: baseColors.grisBrume },
  genes: { name: 'dna', color: baseColors.accentCyan },
  researchers: { name: 'user', color: baseColors.vertMenthe },
  conferences: { name: 'calendar-event', color: baseColors.violetSpectre },
  search: { name: 'search', color: baseColors.grisBrume },
} as const;

// ============================================
// ⚙️ ANIMATIONS & TRANSITIONS
// ============================================

export const animations = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    loading: '1.2s',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
    out: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0.0, 1, 1)',
  }
} as const;

// ============================================
// 📱 RESPONSIVE BREAKPOINTS
// ============================================

export const breakpoints = {
  mobile: 375,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const;
