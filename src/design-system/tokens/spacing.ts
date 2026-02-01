/**
 * Spacing tokens for the vehicles management app design system
 *
 * Based on a 4px base unit scale
 */

// ============================================================================
// Spacing Scale
// ============================================================================

export const spacing = {
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 24px */
  xl: 24,
  /** 32px */
  xxl: 32,
  /** 48px */
  xxxl: 48,
} as const;

// ============================================================================
// Border Radius
// ============================================================================

export const borderRadius = {
  none: 0,
  /** 4px */
  sm: 4,
  /** 8px */
  md: 8,
  /** 12px */
  lg: 12,
  /** 16px */
  xl: 16,
  /** 9999px - Pill shape */
  full: 9999,
} as const;

// ============================================================================
// Breakpoints for Responsive Design
// ============================================================================

export const breakpoints = {
  /** 0px - Extra small devices */
  xs: 0,
  /** 576px - Small devices (landscape phones) */
  sm: 576,
  /** 768px - Medium devices (tablets) */
  md: 768,
  /** 992px - Large devices (desktops) */
  lg: 992,
  /** 1200px - Extra large devices (large desktops) */
  xl: 1200,
} as const;

// ============================================================================
// Type Exports
// ============================================================================

export type SpacingSize = keyof typeof spacing;
export type BorderRadiusSize = keyof typeof borderRadius;
export type Breakpoint = keyof typeof breakpoints;
