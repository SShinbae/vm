/**
 * Unistyles configuration for React Native styling
 *
 * This file configures react-native-unistyles with our design system themes.
 */

import { UnistylesRegistry } from "react-native-unistyles";
import { lightTheme, darkTheme } from "./themes";
import { breakpoints } from "./tokens";

// Type declarations for Unistyles
export type AppBreakpoints = typeof breakpoints;
export type AppThemes = {
  light: typeof lightTheme;
  dark: typeof darkTheme;
};

// Register themes and breakpoints
// Wrapped in try-catch to prevent production crash if native module fails to initialize
export function initializeUnistyles(): void {
  try {
    UnistylesRegistry.addThemes({
      light: lightTheme,
      dark: darkTheme,
    })
      .addBreakpoints(breakpoints)
      .addConfig({
        adaptiveThemes: false, // Manually controlled via ThemeContext
      });
  } catch (error) {
    // Silent fail in production - app will use default React Native styling
    if (__DEV__) {
      console.error("Failed to initialize Unistyles:", error);
    }
  }
}

// Module augmentation for type safety
declare module "react-native-unistyles" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesBreakpoints extends AppBreakpoints {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesThemes extends AppThemes {}
}
