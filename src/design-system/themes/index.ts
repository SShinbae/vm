/**
 * Theme exports
 */

import type { LightTheme } from "./lightTheme";

export { lightTheme } from "./lightTheme";
export type { LightTheme } from "./lightTheme";

export { darkTheme } from "./darkTheme";
export type { DarkTheme } from "./darkTheme";

// Unified theme type (both themes should have same structure)
export type Theme = LightTheme;
