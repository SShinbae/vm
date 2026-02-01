/**
 * Color tokens for the vehicles management app design system
 *
 * Based on Blue Bayoux color palette with supporting colors
 */

// ============================================================================
// Blue Bayoux Palette (Primary Brand Color)
// ============================================================================

export const blueBayoux = {
  50: "#f3f8f8",
  100: "#e1eef0",
  200: "#c9dce0",
  300: "#9cbcc4",
  400: "#7ba3af",
  500: "#517c89",
  600: "#668995",
  700: "#3f5862",
  800: "#3a5159",
  900: "#283a41",
  950: "#1e292e",
} as const;

// ============================================================================
// Gray Palette (Light Mode)
// ============================================================================

export const grayLight = {
  50: "#F9FAFB",
  100: "#F3F4F6",
  200: "#E5E7EB",
  300: "#D1D5DB",
  400: "#9CA3AF",
  500: "#6B7280",
  600: "#4B5563",
  700: "#374151",
  800: "#1F2937",
  900: "#111827",
} as const;

// ============================================================================
// Gray Palette (Dark Mode - Inverted)
// ============================================================================

export const grayDark = {
  50: "#1F2937",
  100: "#374151",
  200: "#4B5563",
  300: "#6B7280",
  400: "#9CA3AF",
  500: "#D1D5DB",
  600: "#E5E7EB",
  700: "#F3F4F6",
  800: "#F9FAFB",
  900: "#FFFFFF",
} as const;

// ============================================================================
// Semantic Colors
// ============================================================================

export const semanticColors = {
  success: "#10B981", // Emerald 500
  warning: "#F59E0B", // Amber 500
  error: "#EF4444", // Red 500
  info: "#3B82F6", // Blue 500
  infoDark: "#60A5FA", // Blue 400 (for dark mode)
} as const;

// ============================================================================
// Analytics Colors
// ============================================================================

export const analyticsColors = {
  light: {
    fuel: "#10B981", // Green
    service: "#517c89", // Blue Bayoux 500
    cost: "#F59E0B", // Amber
    warning: "#EF4444", // Red
    success: "#10B981", // Green
    neutral: "#668995", // Blue Bayoux 600
    purple: "#8B5CF6", // Purple
    teal: "#14B8A6", // Teal
  },
  dark: {
    fuel: "#10B981", // Green
    service: "#9cbcc4", // Blue Bayoux 300 (brighter for dark)
    cost: "#F59E0B", // Amber
    warning: "#EF4444", // Red
    success: "#10B981", // Green
    neutral: "#9cbcc4", // Blue Bayoux 300
    purple: "#A78BFA", // Purple (lighter for dark)
    teal: "#2DD4BF", // Teal (lighter for dark)
  },
} as const;

// ============================================================================
// Base Colors
// ============================================================================

export const baseColors = {
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
} as const;

// ============================================================================
// Type Exports
// ============================================================================

export type BlueBayouxShade = keyof typeof blueBayoux;
export type GrayShade = keyof typeof grayLight;
export type SemanticColor = keyof typeof semanticColors;
export type AnalyticsColor = keyof typeof analyticsColors.light;
