/**
 * Responsive Utilities
 *
 * Helper functions for responsive design and platform-specific styles.
 *
 * Usage:
 * ```typescript
 * import { responsive, platform, isWeb, isMobile } from '@/lib/design-system/utils/responsive';
 *
 * const styles = {
 *   width: responsive({ mobile: 320, tablet: 768, desktop: 1024 }),
 *   ...platform({ ios: { paddingTop: 20 }, android: { paddingTop: 0 } }),
 * };
 * ```
 */

import { Dimensions, Platform } from "react-native";
import { tokens } from "../tokens";

/**
 * Platform Checks
 */
export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";
export const isWeb = Platform.OS === "web";
export const isMobile = isIOS || isAndroid;

/**
 * Screen Dimensions
 */
export function getScreenDimensions() {
  return Dimensions.get("window");
}

export function getScreenWidth(): number {
  return Dimensions.get("window").width;
}

export function getScreenHeight(): number {
  return Dimensions.get("window").height;
}

/**
 * Breakpoint Detection
 */
export function getBreakpoint(): keyof typeof tokens.breakpoints {
  const width = getScreenWidth();

  if (width >= tokens.breakpoints.xxl) return "xxl";
  if (width >= tokens.breakpoints.xl) return "xl";
  if (width >= tokens.breakpoints.lg) return "lg";
  if (width >= tokens.breakpoints.md) return "md";
  if (width >= tokens.breakpoints.sm) return "sm";
  return "xs";
}

export function isBreakpoint(
  breakpoint: keyof typeof tokens.breakpoints,
): boolean {
  const width = getScreenWidth();
  return width >= tokens.breakpoints[breakpoint];
}

/**
 * Responsive Value Helper
 * Returns different values based on screen size
 */
export function responsive<T>(config: {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  default: T;
}): T {
  const width = getScreenWidth();

  if (width >= tokens.breakpoints.lg && config.desktop !== undefined) {
    return config.desktop;
  }

  if (width >= tokens.breakpoints.md && config.tablet !== undefined) {
    return config.tablet;
  }

  if (config.mobile !== undefined) {
    return config.mobile;
  }

  return config.default;
}

/**
 * Responsive By Breakpoint
 * More granular control over responsive values
 */
export function responsiveByBreakpoint<T>(
  config: Partial<Record<keyof typeof tokens.breakpoints, T>> & { default: T },
): T {
  const breakpoint = getBreakpoint();
  return config[breakpoint] ?? config.default;
}

/**
 * Platform-Specific Styles
 * Apply different styles based on platform
 */
export function platform<T>(config: {
  ios?: T;
  android?: T;
  web?: T;
  native?: T;
  default?: T;
}): T | object {
  if (Platform.OS === "ios" && config.ios !== undefined) {
    return config.ios;
  }

  if (Platform.OS === "android" && config.android !== undefined) {
    return config.android;
  }

  if (Platform.OS === "web" && config.web !== undefined) {
    return config.web;
  }

  if (isMobile && config.native !== undefined) {
    return config.native;
  }

  return config.default ?? ({} as T);
}

/**
 * Platform Select (similar to React Native's Platform.select)
 * But with TypeScript support
 */
export function platformSelect<T>(config: {
  ios?: T;
  android?: T;
  web?: T;
  default: T;
}): T {
  return Platform.select({
    ios: config.ios,
    android: config.android,
    web: config.web,
    default: config.default,
  }) as T;
}

/**
 * Orientation Detection
 */
export function isPortrait(): boolean {
  const { width, height } = getScreenDimensions();
  return height >= width;
}

export function isLandscape(): boolean {
  return !isPortrait();
}

/**
 * Scale Helper
 * Scale values based on screen width
 */
const baseWidth = 375; // iPhone design base width

export function scale(size: number): number {
  const width = getScreenWidth();
  return (width / baseWidth) * size;
}

/**
 * Moderate Scale
 * Scale with a factor to prevent extreme scaling
 */
export function moderateScale(size: number, factor: number = 0.5): number {
  const scaledSize = scale(size);
  return size + (scaledSize - size) * factor;
}

/**
 * Min/Max Width Helpers
 */
export function minWidth(breakpoint: keyof typeof tokens.breakpoints): boolean {
  return getScreenWidth() >= tokens.breakpoints[breakpoint];
}

export function maxWidth(breakpoint: keyof typeof tokens.breakpoints): boolean {
  return getScreenWidth() < tokens.breakpoints[breakpoint];
}

/**
 * Safe Area Helpers
 */
export function hasSafeArea(): boolean {
  // iPhone X and newer have safe areas
  if (isIOS) {
    const height = getScreenHeight();
    return height >= 812; // iPhone X height
  }
  return false;
}

/**
 * Responsive Grid Helper
 */
export function getGridColumns(): number {
  const width = getScreenWidth();

  if (width >= tokens.breakpoints.xxl) return 12;
  if (width >= tokens.breakpoints.xl) return 12;
  if (width >= tokens.breakpoints.lg) return 8;
  if (width >= tokens.breakpoints.md) return 6;
  if (width >= tokens.breakpoints.sm) return 4;
  return 2;
}

/**
 * Container Max Width
 */
export function getContainerMaxWidth(): number {
  return Math.min(getScreenWidth(), tokens.layout.maxContentWidth);
}
