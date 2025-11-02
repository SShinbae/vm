/**
 * Typography Utilities
 * 
 * Helper functions for consistent typography throughout the app.
 * 
 * Usage:
 * ```typescript
 * import { getTypography, textStyle } from '@/lib/design-system/utils/typography';
 * 
 * const styles = {
 *   ...getTypography('h1'),
 *   ...textStyle({ size: 'lg', weight: 'bold', color: '#000' }),
 * };
 * ```
 */

import { TextStyle } from 'react-native';
import { typography, type TypographyVariant } from '../theme';
import { tokens, type FontSize, type FontWeight } from '../tokens';

/**
 * Get font size value by token name
 */
export function getFontSize(size: FontSize): number {
  return tokens.fontSize[size];
}

/**
 * Get font weight value by token name
 */
export function getFontWeight(weight: FontWeight): TextStyle['fontWeight'] {
  return tokens.fontWeight[weight] as TextStyle['fontWeight'];
}

/**
 * Get line height value by multiplier
 */
export function getLineHeight(fontSize: number, multiplier: keyof typeof tokens.lineHeight): number {
  return fontSize * tokens.lineHeight[multiplier];
}

/**
 * Get complete typography preset
 */
export function getTypography(variant: TypographyVariant): TextStyle {
  const preset = typography[variant];
  return {
    fontSize: preset.fontSize,
    fontWeight: preset.fontWeight as TextStyle['fontWeight'],
    lineHeight: preset.fontSize * preset.lineHeight,
  };
}

/**
 * Create custom text style
 */
export function textStyle(config: {
  size?: FontSize;
  weight?: FontWeight;
  lineHeight?: keyof typeof tokens.lineHeight;
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}): TextStyle {
  const fontSize = config.size ? getFontSize(config.size) : tokens.fontSize.base;
  
  return {
    fontSize,
    fontWeight: config.weight ? getFontWeight(config.weight) : undefined,
    lineHeight: config.lineHeight ? getLineHeight(fontSize, config.lineHeight) : undefined,
    color: config.color,
    textAlign: config.align,
    textTransform: config.transform,
  };
}

/**
 * Heading Helpers
 * Quick access to heading styles
 */
export const headings = {
  h1: () => getTypography('h1'),
  h2: () => getTypography('h2'),
  h3: () => getTypography('h3'),
  h4: () => getTypography('h4'),
  h5: () => getTypography('h5'),
  h6: () => getTypography('h6'),
} as const;

/**
 * Body Text Helpers
 */
export const body = {
  default: () => getTypography('body'),
  small: () => getTypography('bodySmall'),
  caption: () => getTypography('caption'),
} as const;

/**
 * Label Helpers
 */
export const label = {
  default: () => getTypography('label'),
  small: () => getTypography('labelSmall'),
} as const;

/**
 * Truncate Text Style
 * For single-line text overflow
 */
export function truncate(): TextStyle {
  return {
    overflow: 'hidden',
    // Note: numberOfLines prop should be used on Text component
  };
}

/**
 * Text Shadow Helper
 */
export function textShadow(config?: {
  color?: string;
  offset?: { width: number; height: number };
  radius?: number;
}): TextStyle {
  return {
    textShadowColor: config?.color ?? 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: config?.offset ?? { width: 0, height: 1 },
    textShadowRadius: config?.radius ?? 2,
  };
}

/**
 * Letter Spacing Helper
 */
export function letterSpacing(amount: 'tight' | 'normal' | 'wide' | 'wider'): TextStyle {
  const spacingMap = {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  };
  
  return {
    letterSpacing: spacingMap[amount],
  };
}

/**
 * Monospace Font Helper
 */
export function monospace(): TextStyle {
  return {
    fontFamily: 'monospace',
  };
}
