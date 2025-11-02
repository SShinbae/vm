/**
 * Design Tokens
 * 
 * Centralized design primitives for the Vehicle Management App.
 * All spacing, typography, colors, and other design decisions are defined here.
 * 
 * Usage:
 * ```typescript
 * import { tokens } from '@/lib/design-system/tokens';
 * 
 * const styles = {
 *   padding: tokens.spacing.md,
 *   fontSize: tokens.fontSize.base,
 * };
 * ```
 */

/**
 * Spacing Scale
 * Based on 4px grid system for consistent spacing throughout the app
 */
export const spacing = {
  xxxs: 2,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  xxxxl: 48,
  xxxxxl: 64,
} as const;

/**
 * Typography Scale
 * Responsive font sizes following a modular scale
 */
export const fontSize = {
  xxxs: 10,
  xxs: 11,
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  xxxxl: 36,
  xxxxxl: 48,
} as const;

/**
 * Font Weight Scale
 * Standard weights for typography hierarchy
 */
export const fontWeight = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

/**
 * Line Height Scale
 * For optimal readability across different font sizes
 */
export const lineHeight = {
  tight: 1.2,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

/**
 * Border Radius Scale
 * Consistent rounding for UI elements
 */
export const radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  full: 9999,
} as const;

/**
 * Border Width Scale
 */
export const borderWidth = {
  none: 0,
  thin: 0.5,
  base: 1,
  thick: 2,
  heavy: 4,
} as const;

/**
 * Shadow Presets
 * Platform-aware shadows for depth and hierarchy
 */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  xxl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 16,
  },
} as const;

/**
 * Animation Durations (in milliseconds)
 * Consistent timing for transitions and animations
 */
export const animation = {
  instant: 0,
  fastest: 100,
  fast: 150,
  normal: 200,
  slow: 300,
  slower: 400,
  slowest: 500,
} as const;

/**
 * Animation Easing Functions
 * Native easing curves for smooth animations
 */
export const easing = {
  linear: 'linear',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
} as const;

/**
 * Z-Index Scale
 * Layering system for managing stacking context
 */
export const zIndex = {
  base: 0,
  raised: 1,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  overlay: 40,
  modal: 50,
  popover: 60,
  toast: 70,
  tooltip: 80,
} as const;

/**
 * Breakpoints for Responsive Design
 * Mobile-first approach
 */
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
} as const;

/**
 * Icon Sizes
 * Standardized sizing for icons throughout the app
 */
export const iconSize = {
  xxs: 12,
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
  xxl: 48,
  xxxl: 64,
} as const;

/**
 * Opacity Scale
 * For transparent overlays and disabled states
 */
export const opacity = {
  transparent: 0,
  low: 0.1,
  medium: 0.5,
  high: 0.8,
  opaque: 1,
} as const;

/**
 * Minimum Touch Target Size
 * Accessibility guideline for interactive elements
 */
export const touchTarget = {
  min: 44, // iOS Human Interface Guidelines minimum
  recommended: 48, // Material Design recommendation
} as const;

/**
 * Layout Constraints
 */
export const layout = {
  maxContentWidth: 1200,
  sidebarWidth: 280,
  navHeight: 60,
  tabBarHeight: 56,
} as const;

/**
 * Combined Tokens Export
 * Single import for all design tokens
 */
export const tokens = {
  spacing,
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  borderWidth,
  shadows,
  animation,
  easing,
  zIndex,
  breakpoints,
  iconSize,
  opacity,
  touchTarget,
  layout,
} as const;

/**
 * Type Exports
 * For TypeScript autocomplete and type safety
 */
export type Spacing = keyof typeof spacing;
export type FontSize = keyof typeof fontSize;
export type FontWeight = keyof typeof fontWeight;
export type LineHeight = keyof typeof lineHeight;
export type Radius = keyof typeof radius;
export type BorderWidth = keyof typeof borderWidth;
export type Shadow = keyof typeof shadows;
export type Animation = keyof typeof animation;
export type Easing = keyof typeof easing;
export type ZIndex = keyof typeof zIndex;
export type Breakpoint = keyof typeof breakpoints;
export type IconSize = keyof typeof iconSize;
export type Opacity = keyof typeof opacity;
