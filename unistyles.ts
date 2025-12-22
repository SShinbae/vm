import { UnistylesRegistry } from "react-native-unistyles";

// Define your theme
export const lightTheme = {
  colors: {
    primary: "#517c89", // Blue Bayoux 500
    secondary: "#9cbcc4", // Blue Bayoux 300
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6", // Blue
    background: "#FFFFFF",
    surface: "#f3f8f8", // Blue Bayoux 50
    text: "#1e292e", // Blue Bayoux 950
    textSecondary: "#668995", // Blue Bayoux 600
    border: "#c9dce0", // Blue Bayoux 200
    disabled: "#e1eef0", // Blue Bayoux 100
    white: "#FFFFFF",
    black: "#000000",
    gray: {
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
    },
    analytics: {
      fuel: "#10B981", // Green
      service: "#517c89", // Blue Bayoux 500
      cost: "#F59E0B", // Amber
      warning: "#EF4444", // Red
      success: "#10B981", // Green
      neutral: "#668995", // Blue Bayoux 600
      purple: "#8B5CF6", // Purple
      teal: "#14B8A6", // Teal
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  fontWeight: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
} as const;

export const darkTheme = {
  colors: {
    primary: "#9cbcc4", // Blue Bayoux 300 (brighter for dark mode)
    secondary: "#517c89", // Blue Bayoux 500
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#60A5FA", // Blue (lighter for dark mode)
    background: "#1e292e", // Blue Bayoux 950
    surface: "#283a41", // Blue Bayoux 900
    text: "#f3f8f8", // Blue Bayoux 50
    textSecondary: "#9cbcc4", // Blue Bayoux 300
    border: "#3f5862", // Blue Bayoux 800
    disabled: "#3f5862", // Blue Bayoux 800
    white: "#FFFFFF",
    black: "#000000",
    gray: {
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
    },
    analytics: {
      fuel: "#10B981", // Green
      service: "#9cbcc4", // Blue Bayoux 300 (brighter for dark)
      cost: "#F59E0B", // Amber
      warning: "#EF4444", // Red
      success: "#10B981", // Green
      neutral: "#9cbcc4", // Blue Bayoux 300
      purple: "#A78BFA", // Purple (lighter for dark)
      teal: "#2DD4BF", // Teal (lighter for dark)
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  fontWeight: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
} as const;

// Define breakpoints for responsive design
export const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
} as const;

// Register themes and breakpoints
UnistylesRegistry.addThemes({
  light: lightTheme,
  dark: darkTheme,
})
  .addBreakpoints(breakpoints)
  .addConfig({
    adaptiveThemes: false, // Manually controlled via ThemeContext
  });

// Export types for TypeScript
export type AppBreakpoints = typeof breakpoints;
export type AppThemes = {
  light: typeof lightTheme;
  dark: typeof darkTheme;
};

declare module "react-native-unistyles" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesBreakpoints extends AppBreakpoints {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesThemes extends AppThemes {}
}
