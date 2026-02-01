/**
 * Light theme configuration
 */

import {
  blueBayoux,
  grayLight,
  semanticColors,
  analyticsColors,
  baseColors,
} from "../tokens/colors";
import { spacing, borderRadius } from "../tokens/spacing";
import { fontSize, fontWeight } from "../tokens/typography";

export const lightTheme = {
  colors: {
    primary: blueBayoux[500],
    secondary: blueBayoux[300],
    success: semanticColors.success,
    warning: semanticColors.warning,
    error: semanticColors.error,
    info: semanticColors.info,
    background: baseColors.white,
    surface: blueBayoux[50],
    text: blueBayoux[950],
    textSecondary: blueBayoux[600],
    border: blueBayoux[200],
    disabled: blueBayoux[100],
    white: baseColors.white,
    black: baseColors.black,
    gray: grayLight,
    analytics: analyticsColors.light,
  },
  spacing,
  fontSize,
  borderRadius,
  fontWeight,
} as const;

export type LightTheme = typeof lightTheme;
