/**
 * Dark theme configuration
 */

import {
  blueBayoux,
  grayDark,
  darkSemanticColors,
  analyticsColors,
  baseColors,
} from "../tokens/colors";
import { spacing, borderRadius } from "../tokens/spacing";
import { fontSize, fontWeight } from "../tokens/typography";

export const darkTheme = {
  colors: {
    primary: blueBayoux[300], // Brighter for dark mode
    secondary: blueBayoux[500],
    success: darkSemanticColors.success,
    warning: darkSemanticColors.warning,
    error: darkSemanticColors.error,
    info: darkSemanticColors.info,
    background: blueBayoux[950],
    surface: blueBayoux[900],
    text: blueBayoux[50],
    textSecondary: blueBayoux[300],
    border: blueBayoux[800],
    disabled: blueBayoux[800],
    white: baseColors.white,
    black: baseColors.black,
    gray: grayDark,
    analytics: analyticsColors.dark,
  },
  spacing,
  fontSize,
  borderRadius,
  fontWeight,
} as const;

export type DarkTheme = typeof darkTheme;
