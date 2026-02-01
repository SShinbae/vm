/**
 * Typography tokens for the vehicles management app design system
 */

// ============================================================================
// Font Size Scale
// ============================================================================

export const fontSize = {
  /** 12px */
  xs: 12,
  /** 14px */
  sm: 14,
  /** 16px */
  base: 16,
  /** 18px */
  lg: 18,
  /** 20px */
  xl: 20,
  /** 24px */
  "2xl": 24,
  /** 30px */
  "3xl": 30,
  /** 36px */
  "4xl": 36,
} as const;

// ============================================================================
// Font Weight
// ============================================================================

export const fontWeight = {
  light: "300",
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

// ============================================================================
// Line Height
// ============================================================================

export const lineHeight = {
  /** 1 - Tight */
  none: 1,
  /** 1.25 - Tight */
  tight: 1.25,
  /** 1.375 - Snug */
  snug: 1.375,
  /** 1.5 - Normal */
  normal: 1.5,
  /** 1.625 - Relaxed */
  relaxed: 1.625,
  /** 2 - Loose */
  loose: 2,
} as const;

// ============================================================================
// Letter Spacing
// ============================================================================

export const letterSpacing = {
  tighter: -0.05,
  tight: -0.025,
  normal: 0,
  wide: 0.025,
  wider: 0.05,
  widest: 0.1,
} as const;

// ============================================================================
// Type Exports
// ============================================================================

export type FontSize = keyof typeof fontSize;
export type FontWeight = keyof typeof fontWeight;
export type LineHeight = keyof typeof lineHeight;
export type LetterSpacing = keyof typeof letterSpacing;
