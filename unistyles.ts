/**
 * Unistyles configuration
 *
 * This file imports and initializes the design system themes.
 * The actual theme definitions are in /src/design-system/.
 */

import { UnistylesRegistry } from "react-native-unistyles";
import { lightTheme, darkTheme, breakpoints } from "./src/design-system";

// Re-export themes for backward compatibility
export { lightTheme, darkTheme, breakpoints } from "./src/design-system";

// Export types for TypeScript
export type AppBreakpoints = typeof breakpoints;
export type AppThemes = {
  light: typeof lightTheme;
  dark: typeof darkTheme;
};

// Register themes and breakpoints
// Wrapped in try-catch to prevent production crash if native module fails to initialize
try {
  UnistylesRegistry.addThemes({
    light: lightTheme,
    dark: darkTheme,
  })
    .addBreakpoints(breakpoints)
    .addConfig({
      adaptiveThemes: false, // Manually controlled via ThemeContext
      initialTheme: "light", // Required before ThemeContext can sync the saved preference
    });
} catch (error) {
  // Silent fail in production - app will use default React Native styling
  if (__DEV__) {
    console.error("Failed to initialize Unistyles:", error);
  }
}

// Module augmentation for type safety
declare module "react-native-unistyles" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesBreakpoints extends AppBreakpoints {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesThemes extends AppThemes {}
}
