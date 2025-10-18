/**
 * Utility functions for safe number and currency formatting
 */

/**
 * Safely formats a number to a fixed decimal places, handling null/undefined values
 * @param value The number to format (can be null/undefined)
 * @param decimals Number of decimal places (default: 2)
 * @param fallback Fallback value if input is invalid (default: 0)
 * @returns Formatted number string
 */
export function safeToFixed(
  value: number | null | undefined,
  decimals: number = 2,
  fallback: number = 0,
): string {
  const safeValue = value != null && !isNaN(value) ? value : fallback;
  return safeValue.toFixed(decimals);
}

/**
 * Safely formats a currency value with RM prefix
 * @param value The number to format (can be null/undefined)
 * @param decimals Number of decimal places (default: 2)
 * @param fallback Fallback value if input is invalid (default: 0)
 * @returns Formatted currency string with RM prefix
 */
export function safeFormatCurrency(
  value: number | null | undefined,
  decimals: number = 2,
  fallback: number = 0,
): string {
  const formattedValue = safeToFixed(value, decimals, fallback);
  return `RM${formattedValue}`;
}

/**
 * Safely gets a numeric value from a potentially undefined object property
 * @param obj The object containing the value
 * @param key The property key to extract
 * @param fallback Fallback value if property is missing/invalid (default: 0)
 * @returns Safe numeric value
 */
export function safeNumericValue<T extends Record<string, any>>(
  obj: T | null | undefined,
  key: keyof T,
  fallback: number = 0,
): number {
  if (!obj || !(key in obj)) return fallback;
  const value = obj[key];
  return typeof value === "number" && !isNaN(value) ? value : fallback;
}

/**
 * Safely extracts and formats an amount from expense breakdown array
 * @param expenseBreakdown Array of expense breakdown items
 * @param category Category to find (e.g., 'Fuel', 'Service')
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export function safeGetExpenseAmount(
  expenseBreakdown:
    | Array<{ category: string; amount: number }>
    | null
    | undefined,
  category: string,
  decimals: number = 2,
): string {
  if (!Array.isArray(expenseBreakdown)) {
    return safeFormatCurrency(0, decimals);
  }

  const item = expenseBreakdown.find((e) => e.category === category);
  return safeFormatCurrency(item?.amount, decimals);
}
