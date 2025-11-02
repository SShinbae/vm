/**
 * Spacing Utilities
 * 
 * Helper functions for applying consistent spacing throughout the app.
 * 
 * Usage:
 * ```typescript
 * import { getSpacing, spacing } from '@/lib/design-system/utils/spacing';
 * 
 * const styles = {
 *   padding: getSpacing('md'),
 *   margin: spacing('lg', 'xl'),
 * };
 * ```
 */

import { tokens, type Spacing } from '../tokens';

/**
 * Get spacing value by token name
 */
export function getSpacing(size: Spacing): number {
  return tokens.spacing[size];
}

/**
 * Create spacing with multiple values (like CSS shorthand)
 * spacing('md') => 16
 * spacing('md', 'lg') => { vertical: 16, horizontal: 20 }
 * spacing('sm', 'md', 'lg') => { top: 12, horizontal: 16, bottom: 20 }
 * spacing('xs', 'sm', 'md', 'lg') => { top: 8, right: 12, bottom: 16, left: 20 }
 */
export function spacing(...sizes: Spacing[]): number | object {
  if (sizes.length === 1) {
    return getSpacing(sizes[0]);
  }

  if (sizes.length === 2) {
    return {
      vertical: getSpacing(sizes[0]),
      horizontal: getSpacing(sizes[1]),
    };
  }

  if (sizes.length === 3) {
    return {
      top: getSpacing(sizes[0]),
      horizontal: getSpacing(sizes[1]),
      bottom: getSpacing(sizes[2]),
    };
  }

  if (sizes.length === 4) {
    return {
      top: getSpacing(sizes[0]),
      right: getSpacing(sizes[1]),
      bottom: getSpacing(sizes[2]),
      left: getSpacing(sizes[3]),
    };
  }

  return getSpacing(sizes[0]);
}

/**
 * Create padding object from spacing tokens
 */
export function padding(
  all?: Spacing,
  vertical?: Spacing,
  horizontal?: Spacing
): object {
  if (all) {
    return { padding: getSpacing(all) };
  }

  return {
    paddingVertical: vertical ? getSpacing(vertical) : 0,
    paddingHorizontal: horizontal ? getSpacing(horizontal) : 0,
  };
}

/**
 * Create margin object from spacing tokens
 */
export function margin(
  all?: Spacing,
  vertical?: Spacing,
  horizontal?: Spacing
): object {
  if (all) {
    return { margin: getSpacing(all) };
  }

  return {
    marginVertical: vertical ? getSpacing(vertical) : 0,
    marginHorizontal: horizontal ? getSpacing(horizontal) : 0,
  };
}

/**
 * Create gap for flex containers
 */
export function gap(size: Spacing): number {
  return getSpacing(size);
}

/**
 * Inset spacing (for absolute positioning or safe areas)
 */
export function inset(size: Spacing): object {
  const value = getSpacing(size);
  return {
    top: value,
    right: value,
    bottom: value,
    left: value,
  };
}

/**
 * Specific side spacing helpers
 */
export const spacingHelpers = {
  paddingTop: (size: Spacing) => ({ paddingTop: getSpacing(size) }),
  paddingRight: (size: Spacing) => ({ paddingRight: getSpacing(size) }),
  paddingBottom: (size: Spacing) => ({ paddingBottom: getSpacing(size) }),
  paddingLeft: (size: Spacing) => ({ paddingLeft: getSpacing(size) }),
  
  marginTop: (size: Spacing) => ({ marginTop: getSpacing(size) }),
  marginRight: (size: Spacing) => ({ marginRight: getSpacing(size) }),
  marginBottom: (size: Spacing) => ({ marginBottom: getSpacing(size) }),
  marginLeft: (size: Spacing) => ({ marginLeft: getSpacing(size) }),
} as const;
