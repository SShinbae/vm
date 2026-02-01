/**
 * Format Utils Tests
 *
 * Tests for number formatting, currency formatting, and safe value extraction.
 */

import {
  safeToFixed,
  safeFormatCurrency,
  safeNumericValue,
  safeGetExpenseAmount,
} from "@/lib/utils/formatUtils";

describe("formatUtils", () => {
  // ==========================================================================
  // safeToFixed Tests
  // ==========================================================================

  describe("safeToFixed", () => {
    it("should format number to default 2 decimal places", () => {
      expect(safeToFixed(123.456)).toBe("123.46");
    });

    it("should format number to specified decimal places", () => {
      expect(safeToFixed(123.456, 1)).toBe("123.5");
      expect(safeToFixed(123.456, 3)).toBe("123.456");
      expect(safeToFixed(123.456, 0)).toBe("123");
    });

    it("should handle integer values", () => {
      expect(safeToFixed(100)).toBe("100.00");
      expect(safeToFixed(100, 0)).toBe("100");
    });

    it("should use fallback for null", () => {
      expect(safeToFixed(null)).toBe("0.00");
      expect(safeToFixed(null, 2, 10)).toBe("10.00");
    });

    it("should use fallback for undefined", () => {
      expect(safeToFixed(undefined)).toBe("0.00");
      expect(safeToFixed(undefined, 2, 5)).toBe("5.00");
    });

    it("should use fallback for NaN", () => {
      expect(safeToFixed(NaN)).toBe("0.00");
      expect(safeToFixed(NaN, 2, 99)).toBe("99.00");
    });

    it("should handle zero correctly", () => {
      expect(safeToFixed(0)).toBe("0.00");
      expect(safeToFixed(0, 1)).toBe("0.0");
    });

    it("should handle negative numbers", () => {
      expect(safeToFixed(-123.456)).toBe("-123.46");
      expect(safeToFixed(-0.5, 1)).toBe("-0.5");
    });

    it("should handle very small numbers", () => {
      expect(safeToFixed(0.001)).toBe("0.00");
      expect(safeToFixed(0.001, 3)).toBe("0.001");
      expect(safeToFixed(0.0005, 3)).toBe("0.001"); // Rounds up
    });

    it("should handle very large numbers", () => {
      expect(safeToFixed(1234567890.123)).toBe("1234567890.12");
    });

    it("should round correctly", () => {
      // Note: 1.555 has floating-point representation issues in JS
      // So we test with values that round predictably
      expect(safeToFixed(1.556, 2)).toBe("1.56");
      expect(safeToFixed(1.554, 2)).toBe("1.55");
      expect(safeToFixed(2.5, 0)).toBe("3"); // Standard rounding
    });
  });

  // ==========================================================================
  // safeFormatCurrency Tests
  // ==========================================================================

  describe("safeFormatCurrency", () => {
    it("should format number with RM prefix", () => {
      expect(safeFormatCurrency(100)).toBe("RM100.00");
    });

    it("should format decimal values correctly", () => {
      expect(safeFormatCurrency(99.99)).toBe("RM99.99");
      expect(safeFormatCurrency(123.456)).toBe("RM123.46");
    });

    it("should handle specified decimal places", () => {
      expect(safeFormatCurrency(100, 0)).toBe("RM100");
      expect(safeFormatCurrency(100, 1)).toBe("RM100.0");
      expect(safeFormatCurrency(100, 3)).toBe("RM100.000");
    });

    it("should use fallback for null", () => {
      expect(safeFormatCurrency(null)).toBe("RM0.00");
      expect(safeFormatCurrency(null, 2, 50)).toBe("RM50.00");
    });

    it("should use fallback for undefined", () => {
      expect(safeFormatCurrency(undefined)).toBe("RM0.00");
    });

    it("should use fallback for NaN", () => {
      expect(safeFormatCurrency(NaN)).toBe("RM0.00");
    });

    it("should handle zero", () => {
      expect(safeFormatCurrency(0)).toBe("RM0.00");
    });

    it("should handle negative values", () => {
      expect(safeFormatCurrency(-50)).toBe("RM-50.00");
    });

    it("should handle large values", () => {
      expect(safeFormatCurrency(1000000)).toBe("RM1000000.00");
    });
  });

  // ==========================================================================
  // safeNumericValue Tests
  // ==========================================================================

  describe("safeNumericValue", () => {
    it("should extract numeric value from object", () => {
      const obj = { amount: 100, name: "test" };
      expect(safeNumericValue(obj, "amount")).toBe(100);
    });

    it("should return fallback for missing property", () => {
      const obj = { name: "test" };
      expect(safeNumericValue(obj, "amount" as any)).toBe(0);
      expect(safeNumericValue(obj, "amount" as any, 50)).toBe(50);
    });

    it("should return fallback for null object", () => {
      expect(safeNumericValue(null, "amount")).toBe(0);
      expect(safeNumericValue(null, "amount", 100)).toBe(100);
    });

    it("should return fallback for undefined object", () => {
      expect(safeNumericValue(undefined, "amount")).toBe(0);
    });

    it("should return fallback for non-numeric property value", () => {
      const obj = { amount: "not a number" };
      expect(safeNumericValue(obj, "amount")).toBe(0);
    });

    it("should return fallback for NaN property value", () => {
      const obj = { amount: NaN };
      expect(safeNumericValue(obj, "amount")).toBe(0);
    });

    it("should handle zero values correctly", () => {
      const obj = { amount: 0 };
      expect(safeNumericValue(obj, "amount")).toBe(0);
      expect(safeNumericValue(obj, "amount", 10)).toBe(0); // Zero is valid
    });

    it("should handle negative values", () => {
      const obj = { amount: -50 };
      expect(safeNumericValue(obj, "amount")).toBe(-50);
    });

    it("should handle decimal values", () => {
      const obj = { amount: 99.99 };
      expect(safeNumericValue(obj, "amount")).toBe(99.99);
    });

    it("should handle nested-like property names", () => {
      const obj = { "total.cost": 150 };
      expect(safeNumericValue(obj, "total.cost")).toBe(150);
    });

    it("should work with different object types", () => {
      interface Stats {
        count: number;
        total: number;
      }
      const stats: Stats = { count: 5, total: 100 };
      expect(safeNumericValue(stats, "count")).toBe(5);
      expect(safeNumericValue(stats, "total")).toBe(100);
    });
  });

  // ==========================================================================
  // safeGetExpenseAmount Tests
  // ==========================================================================

  describe("safeGetExpenseAmount", () => {
    const expenseBreakdown = [
      { category: "Fuel", amount: 500 },
      { category: "Service", amount: 200 },
      { category: "Insurance", amount: 1000 },
    ];

    it("should find and format expense by category", () => {
      expect(safeGetExpenseAmount(expenseBreakdown, "Fuel")).toBe("RM500.00");
      expect(safeGetExpenseAmount(expenseBreakdown, "Service")).toBe(
        "RM200.00",
      );
      expect(safeGetExpenseAmount(expenseBreakdown, "Insurance")).toBe(
        "RM1000.00",
      );
    });

    it("should return RM0.00 for non-existent category", () => {
      expect(safeGetExpenseAmount(expenseBreakdown, "Unknown")).toBe("RM0.00");
    });

    it("should return RM0.00 for null breakdown", () => {
      expect(safeGetExpenseAmount(null, "Fuel")).toBe("RM0.00");
    });

    it("should return RM0.00 for undefined breakdown", () => {
      expect(safeGetExpenseAmount(undefined, "Fuel")).toBe("RM0.00");
    });

    it("should return RM0.00 for non-array input", () => {
      expect(safeGetExpenseAmount("not an array" as any, "Fuel")).toBe(
        "RM0.00",
      );
      expect(safeGetExpenseAmount({} as any, "Fuel")).toBe("RM0.00");
    });

    it("should return RM0.00 for empty array", () => {
      expect(safeGetExpenseAmount([], "Fuel")).toBe("RM0.00");
    });

    it("should handle custom decimal places", () => {
      expect(safeGetExpenseAmount(expenseBreakdown, "Fuel", 0)).toBe("RM500");
      expect(safeGetExpenseAmount(expenseBreakdown, "Fuel", 1)).toBe("RM500.0");
    });

    it("should handle decimal amounts", () => {
      const breakdown = [{ category: "Fuel", amount: 123.456 }];
      expect(safeGetExpenseAmount(breakdown, "Fuel")).toBe("RM123.46");
      expect(safeGetExpenseAmount(breakdown, "Fuel", 3)).toBe("RM123.456");
    });

    it("should be case-sensitive for category matching", () => {
      expect(safeGetExpenseAmount(expenseBreakdown, "fuel")).toBe("RM0.00");
      expect(safeGetExpenseAmount(expenseBreakdown, "FUEL")).toBe("RM0.00");
    });

    it("should handle zero amounts", () => {
      const breakdown = [{ category: "Misc", amount: 0 }];
      expect(safeGetExpenseAmount(breakdown, "Misc")).toBe("RM0.00");
    });

    it("should handle null/undefined amounts in items", () => {
      const breakdown = [{ category: "Fuel", amount: null as any }];
      expect(safeGetExpenseAmount(breakdown, "Fuel")).toBe("RM0.00");
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe("Integration", () => {
    it("should work together for complex formatting scenarios", () => {
      const data = {
        totalCost: 1234.567,
        fuelCost: null as number | null,
        serviceCost: undefined as number | undefined,
      };

      expect(safeFormatCurrency(safeNumericValue(data, "totalCost"))).toBe(
        "RM1234.57",
      );
      expect(safeFormatCurrency(safeNumericValue(data, "fuelCost"))).toBe(
        "RM0.00",
      );
      expect(safeFormatCurrency(safeNumericValue(data, "serviceCost"))).toBe(
        "RM0.00",
      );
    });

    it("should handle expense summary calculation", () => {
      const expenses = [
        { category: "Fuel", amount: 500.5 },
        { category: "Service", amount: 250.75 },
        { category: "Other", amount: 100 },
      ];

      const fuel = parseFloat(
        safeGetExpenseAmount(expenses, "Fuel").replace("RM", ""),
      );
      const service = parseFloat(
        safeGetExpenseAmount(expenses, "Service").replace("RM", ""),
      );
      const other = parseFloat(
        safeGetExpenseAmount(expenses, "Other").replace("RM", ""),
      );

      const total = fuel + service + other;
      expect(safeFormatCurrency(total)).toBe("RM851.25");
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe("Edge Cases", () => {
    it("should handle Infinity", () => {
      // The function passes Infinity through since isNaN(Infinity) is false
      // This is expected behavior - Infinity is a valid number, not NaN
      expect(safeToFixed(Infinity)).toBe("Infinity");
      expect(safeToFixed(-Infinity)).toBe("-Infinity");
    });

    it("should handle very precise decimals", () => {
      expect(safeToFixed(0.1 + 0.2, 1)).toBe("0.3"); // Classic JS floating point
    });

    it("should handle scientific notation numbers", () => {
      expect(safeToFixed(1e-10, 12)).toBe("0.000000000100");
      expect(safeToFixed(1e10)).toBe("10000000000.00");
    });

    it("should handle object with numeric string property", () => {
      const obj = { amount: "100" };
      // String values should fallback since they're not numbers
      expect(safeNumericValue(obj, "amount")).toBe(0);
    });
  });
});
