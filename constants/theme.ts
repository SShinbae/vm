/**
 * Modern color system for the Vehicle Management App
 * Features a sophisticated warm palette with excellent contrast ratios
 */

import { Platform } from 'react-native';

// Modern color palette
const warmBeige = '#DFD0B8';      // Primary light
const mutedBrown = '#948979';     // Secondary light
const darkCharcoal = '#222831';   // Primary dark
const slateGray = '#393E46';      // Secondary dark

// Semantic colors
const semanticColors = {
  success: '#10B981',    // Green
  warning: '#F59E0B',    // Orange/Amber
  error: '#EF4444',      // Red
  info: '#3B82F6',       // Blue
};

// Text colors for better readability
const textColors = {
  light: {
    primary: '#1F2937',     // Very dark gray for high contrast
    secondary: '#6B7280',   // Medium gray for secondary text
    tertiary: '#9CA3AF',    // Light gray for subtle text
  },
  dark: {
    primary: '#F9FAFB',     // Very light gray/white
    secondary: '#D1D5DB',   // Light gray for secondary text
    tertiary: '#9CA3AF',    // Medium gray for subtle text
  }
};

const tintColorLight = mutedBrown;
const tintColorDark = warmBeige;

export const Colors = {
  light: {
    // Core colors
    text: textColors.light.primary,
    textSecondary: textColors.light.secondary,
    textTertiary: textColors.light.tertiary,
    background: '#FFFFFF',
    backgroundSecondary: warmBeige,
    surface: '#F8F9FA',
    tint: tintColorLight,

    // Navigation & UI
    icon: textColors.light.secondary,
    tabIconDefault: textColors.light.tertiary,
    tabIconSelected: tintColorLight,
    border: '#E5E7EB',
    divider: '#F3F4F6',

    // Interactive elements
    link: mutedBrown,
    buttonPrimary: mutedBrown,
    buttonSecondary: warmBeige,

    // Card system
    card: '#FFFFFF',
    cardSecondary: '#FEFEFE',
    cardBorder: '#F3F4F6',

    // Semantic colors
    success: semanticColors.success,
    warning: semanticColors.warning,
    error: semanticColors.error,
    info: semanticColors.info,

    // Analytics specific colors
    chart: {
      primary: mutedBrown,
      secondary: warmBeige,
      tertiary: '#C4B5A0',
      fuel: '#10B981',
      service: '#F59E0B',
      mileage: '#3B82F6',
      grid: '#F3F4F6',
    },

    // Gradients
    gradients: {
      primary: [mutedBrown, warmBeige],
      secondary: [warmBeige, '#F5F0E8'],
      card: ['#FFFFFF', '#FEFEFE'],
    }
  },
  dark: {
    // Core colors
    text: textColors.dark.primary,
    textSecondary: textColors.dark.secondary,
    textTertiary: textColors.dark.tertiary,
    background: darkCharcoal,
    backgroundSecondary: slateGray,
    surface: '#2D3748',
    tint: tintColorDark,

    // Navigation & UI
    icon: textColors.dark.secondary,
    tabIconDefault: textColors.dark.tertiary,
    tabIconSelected: tintColorDark,
    border: '#4B5563',
    divider: '#374151',

    // Interactive elements
    link: warmBeige,
    buttonPrimary: warmBeige,
    buttonSecondary: slateGray,

    // Card system
    card: slateGray,
    cardSecondary: '#4A5568',
    cardBorder: '#4B5563',

    // Semantic colors (slightly adjusted for dark mode)
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',

    // Analytics specific colors
    chart: {
      primary: warmBeige,
      secondary: slateGray,
      tertiary: '#6B7280',
      fuel: '#34D399',
      service: '#FBBF24',
      mileage: '#60A5FA',
      grid: '#4B5563',
    },

    // Gradients
    gradients: {
      primary: [warmBeige, '#C4B5A0'],
      secondary: [slateGray, '#4A5568'],
      card: [slateGray, '#4A5568'],
    }
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
