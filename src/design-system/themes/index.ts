/**
 * Theme exports
 */

import type { LightTheme } from "./lightTheme";
import type { DarkTheme } from "./darkTheme";

export { lightTheme } from "./lightTheme";
export type { LightTheme } from "./lightTheme";

export { darkTheme } from "./darkTheme";
export type { DarkTheme } from "./darkTheme";

// Unified theme type (both themes should have same structure)
export type Theme = LightTheme;
export type ThemeColors = LightTheme["colors"] | DarkTheme["colors"];
