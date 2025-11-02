/**
 * Design System Theme
 * 
 * Enhanced theme system that extends the existing Colors theme
 * and adds semantic tokens for consistent theming across the app.
 * 
 * Usage:
 * ```typescript
 * import { theme, getThemeColors } from '@/lib/design-system/theme';
 * import { useColorScheme } from '@/hooks/use-color-scheme';
 * 
 * const colorScheme = useColorScheme();
 * const colors = getThemeColors(colorScheme);
 * ```
 */

import { Colors } from '@/constants/theme';
import { tokens } from './tokens';

/**
 * Semantic Token Mapping
 * Maps generic semantic names to actual theme colors
 */
export const semanticTokens = {
  // Surface Hierarchy
  surface: {
    base: 'background',
    raised: 'card',
    overlay: 'surface',
    elevated: 'cardSecondary',
  },

  // Text Hierarchy
  text: {
    primary: 'text',
    secondary: 'textSecondary',
    tertiary: 'textTertiary',
    inverse: 'background', // For text on dark backgrounds
    link: 'link',
  },

  // Interactive States
  interactive: {
    default: 'buttonPrimary',
    hover: 'tint',
    active: 'tint',
    disabled: 'textTertiary',
    focus: 'tint',
  },

  // Feedback States
  feedback: {
    success: 'success',
    warning: 'warning',
    error: 'error',
    info: 'info',
  },

  // Border & Dividers
  border: {
    default: 'border',
    subtle: 'divider',
    strong: 'cardBorder',
    focus: 'tint',
  },
} as const;

/**
 * Component-Specific Theme Tokens
 * Pre-defined theme configurations for common components
 */
export const componentTokens = {
  button: {
    primary: {
      background: 'buttonPrimary',
      text: '#FFFFFF',
      border: 'buttonPrimary',
    },
    secondary: {
      background: 'buttonSecondary',
      text: 'text',
      border: 'border',
    },
    outline: {
      background: 'transparent',
      text: 'buttonPrimary',
      border: 'buttonPrimary',
    },
    ghost: {
      background: 'transparent',
      text: 'text',
      border: 'transparent',
    },
    danger: {
      background: 'error',
      text: '#FFFFFF',
      border: 'error',
    },
  },

  card: {
    default: {
      background: 'card',
      border: 'cardBorder',
      shadow: tokens.shadows.sm,
    },
    elevated: {
      background: 'card',
      border: 'transparent',
      shadow: tokens.shadows.md,
    },
    outlined: {
      background: 'card',
      border: 'border',
      shadow: tokens.shadows.none,
    },
    filled: {
      background: 'surface',
      border: 'transparent',
      shadow: tokens.shadows.none,
    },
  },

  input: {
    default: {
      background: 'background',
      border: 'border',
      text: 'text',
      placeholder: 'textTertiary',
    },
    focused: {
      background: 'background',
      border: 'tint',
      text: 'text',
      placeholder: 'textTertiary',
    },
    error: {
      background: 'background',
      border: 'error',
      text: 'text',
      placeholder: 'textTertiary',
    },
    disabled: {
      background: 'surface',
      border: 'divider',
      text: 'textTertiary',
      placeholder: 'textTertiary',
    },
  },

  badge: {
    success: {
      background: 'success',
      text: '#FFFFFF',
    },
    warning: {
      background: 'warning',
      text: '#FFFFFF',
    },
    error: {
      background: 'error',
      text: '#FFFFFF',
    },
    info: {
      background: 'info',
      text: '#FFFFFF',
    },
    neutral: {
      background: 'surface',
      text: 'text',
    },
  },
} as const;

/**
 * Typography Presets
 * Pre-configured text styles for common use cases
 */
export const typography = {
  display: {
    fontSize: tokens.fontSize.xxxxxl,
    fontWeight: tokens.fontWeight.bold,
    lineHeight: tokens.lineHeight.tight,
  },
  h1: {
    fontSize: tokens.fontSize.xxxxl,
    fontWeight: tokens.fontWeight.bold,
    lineHeight: tokens.lineHeight.tight,
  },
  h2: {
    fontSize: tokens.fontSize.xxxl,
    fontWeight: tokens.fontWeight.semibold,
    lineHeight: tokens.lineHeight.snug,
  },
  h3: {
    fontSize: tokens.fontSize.xxl,
    fontWeight: tokens.fontWeight.semibold,
    lineHeight: tokens.lineHeight.snug,
  },
  h4: {
    fontSize: tokens.fontSize.xl,
    fontWeight: tokens.fontWeight.semibold,
    lineHeight: tokens.lineHeight.normal,
  },
  h5: {
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.medium,
    lineHeight: tokens.lineHeight.normal,
  },
  h6: {
    fontSize: tokens.fontSize.base,
    fontWeight: tokens.fontWeight.medium,
    lineHeight: tokens.lineHeight.normal,
  },
  body: {
    fontSize: tokens.fontSize.base,
    fontWeight: tokens.fontWeight.regular,
    lineHeight: tokens.lineHeight.normal,
  },
  bodySmall: {
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.regular,
    lineHeight: tokens.lineHeight.normal,
  },
  caption: {
    fontSize: tokens.fontSize.xs,
    fontWeight: tokens.fontWeight.regular,
    lineHeight: tokens.lineHeight.snug,
  },
  label: {
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
    lineHeight: tokens.lineHeight.normal,
  },
  labelSmall: {
    fontSize: tokens.fontSize.xs,
    fontWeight: tokens.fontWeight.medium,
    lineHeight: tokens.lineHeight.normal,
  },
  button: {
    fontSize: tokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    lineHeight: tokens.lineHeight.tight,
  },
  buttonSmall: {
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.semibold,
    lineHeight: tokens.lineHeight.tight,
  },
} as const;

/**
 * Spacing Presets
 * Common spacing patterns for layouts
 */
export const spacingPresets = {
  // Component spacing
  componentGap: tokens.spacing.md,
  sectionGap: tokens.spacing.xxl,
  
  // Padding presets
  paddingSmall: tokens.spacing.sm,
  paddingMedium: tokens.spacing.md,
  paddingLarge: tokens.spacing.xl,
  
  // Container spacing
  containerPadding: tokens.spacing.md,
  containerGap: tokens.spacing.lg,
  
  // Form spacing
  formFieldGap: tokens.spacing.md,
  formSectionGap: tokens.spacing.xl,
} as const;

/**
 * Helper function to get theme colors based on color scheme
 */
export function getThemeColors(colorScheme: 'light' | 'dark' | null | undefined) {
  return Colors[colorScheme ?? 'light'];
}

/**
 * Helper function to resolve semantic token to actual color
 */
export function resolveSemanticColor(
  colorScheme: 'light' | 'dark' | null | undefined,
  semanticKey: string
): string {
  const colors = getThemeColors(colorScheme);
  
  // Try to resolve from semantic tokens first
  const parts = semanticKey.split('.');
  let current: any = semanticTokens;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      // Fallback to direct color lookup
      return (colors as any)[semanticKey] || semanticKey;
    }
  }
  
  // If we found a semantic token, resolve it to actual color
  if (typeof current === 'string') {
    return (colors as any)[current] || current;
  }
  
  return semanticKey;
}

/**
 * Combined Theme Export
 */
export const theme = {
  tokens,
  semanticTokens,
  componentTokens,
  typography,
  spacingPresets,
  getThemeColors,
  resolveSemanticColor,
} as const;

/**
 * Type Exports
 */
export type ColorScheme = 'light' | 'dark';
export type SemanticToken = keyof typeof semanticTokens;
export type ComponentToken = keyof typeof componentTokens;
export type TypographyVariant = keyof typeof typography;
