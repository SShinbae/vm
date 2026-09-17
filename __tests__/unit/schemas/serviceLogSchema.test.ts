/**
 * Service Log Schema Tests
 *
 * Tests for Zod validation schemas, helpers, and constants.
 */

import {
  serviceItemSchema,
  serviceLogSchema,
  serviceLogUpdateSchema,
  serviceLogDefaultValues,
  serviceTypeLabels,
  serviceTypes,
  calculateTotalFromItems,
} from "@/src/shared/schemas/serviceLogSchema";

const validServiceLog = {
  vehicle_id: "550e8400-e29b-41d4-a716-446655440000",
  service_type: "oil_change" as const,
  description: "Regular oil change",
  cost: 75.0,
  date: "2024-01-15",
  odometer_reading: 50000,
};

describe("serviceItemSchema", () => {
  it("should validate a valid item", () => {
    const result = serviceItemSchema.safeParse({
      description: "Oil filter",
      price: 25.0,
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty description", () => {
    const result = serviceItemSchema.safeParse({
      description: "",
      price: 25.0,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("description");
    }
  });

  it("should reject description over 200 characters", () => {
    const result = serviceItemSchema.safeParse({
      description: "A".repeat(201),
      price: 25.0,
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative price", () => {
    const result = serviceItemSchema.safeParse({
      description: "Oil filter",
      price: -1,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("price");
    }
  });

  it("should reject price over 100000", () => {
    const result = serviceItemSchema.safeParse({
      description: "Oil filter",
      price: 100001,
    });
    expect(result.success).toBe(false);
  });
});

describe("serviceLogSchema", () => {
  describe("valid data", () => {
    it("should validate complete valid data", () => {
      const result = serviceLogSchema.safeParse(validServiceLog);
      expect(result.success).toBe(true);
    });

    it("should accept all valid service_type enum values", () => {
      for (const type of serviceTypes) {
        const result = serviceLogSchema.safeParse({
          ...validServiceLog,
          service_type: type,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should accept optional cost", () => {
      const { cost, ...rest } = validServiceLog;
      const result = serviceLogSchema.safeParse(rest);
      expect(result.success).toBe(true);
    });

    it("should accept items array with nested items", () => {
      const result = serviceLogSchema.safeParse({
        ...validServiceLog,
        items: [
          { description: "Oil filter", price: 25 },
          { description: "Labor", price: 50 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should accept optional next_service_due as empty string", () => {
      const result = serviceLogSchema.safeParse({
        ...validServiceLog,
        next_service_due: "",
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid next_service_due date", () => {
      const result = serviceLogSchema.safeParse({
        ...validServiceLog,
        next_service_due: "2025-06-15",
      });
      expect(result.success).toBe(true);
    });

    it("should accept a valid next service mileage", () => {
      expect(
        serviceLogSchema.safeParse({
          ...validServiceLog,
          next_service_mileage: 55000,
        }).success,
      ).toBe(true);
    });

    it("should accept optional receipt_image_url as empty string", () => {
      const result = serviceLogSchema.safeParse({
        ...validServiceLog,
        receipt_image_url: "",
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid receipt_image_url", () => {
      const result = serviceLogSchema.safeParse({
        ...validServiceLog,
        receipt_image_url: "https://example.com/receipt.jpg",
      });
      expect(result.success).toBe(true);
    });

    it("should accept optional auto_filled boolean", () => {
      const result = serviceLogSchema.safeParse({
        ...validServiceLog,
        auto_filled: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid data", () => {
    it("should reject invalid service_type", () => {
      const result = serviceLogSchema.safeParse({
        ...validServiceLog,
        service_type: "invalid_type",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("service_type");
      }
    });

    it("should reject empty description", () => {
      const result = serviceLogSchema.safeParse({
        ...validServiceLog,
        description: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("description");
      }
    });

    it("should reject description over 1000 characters", () => {
      const result = serviceLogSchema.safeParse({
        ...validServiceLog,
        description: "A".repeat(1001),
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative cost", () => {
      const result = serviceLogSchema.safeParse({
        ...validServiceLog,
        cost: -1,
      });
      expect(result.success).toBe(false);
    });

    it("should reject cost over 1000000", () => {
      const result = serviceLogSchema.safeParse({
        ...validServiceLog,
        cost: 1000001,
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid date", () => {
      const result = serviceLogSchema.safeParse({
        ...validServiceLog,
        date: "not-a-date",
      });
      expect(result.success).toBe(false);
    });

    it("should reject non-integer odometer", () => {
      const result = serviceLogSchema.safeParse({
        ...validServiceLog,
        odometer_reading: 50000.5,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative odometer", () => {
      const result = serviceLogSchema.safeParse({
        ...validServiceLog,
        odometer_reading: -1,
      });
      expect(result.success).toBe(false);
    });

    it("should reject odometer over 2000000", () => {
      const result = serviceLogSchema.safeParse({
        ...validServiceLog,
        odometer_reading: 2000001,
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid next_service_due date", () => {
      const result = serviceLogSchema.safeParse({
        ...validServiceLog,
        next_service_due: "not-a-date",
      });
      expect(result.success).toBe(false);
    });

    it("should reject an invalid next service mileage", () => {
      expect(
        serviceLogSchema.safeParse({
          ...validServiceLog,
          next_service_mileage: -1,
        }).success,
      ).toBe(false);
    });

    it("should reject invalid receipt_image_url", () => {
      const result = serviceLogSchema.safeParse({
        ...validServiceLog,
        receipt_image_url: "not-a-url",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("serviceLogUpdateSchema", () => {
  it("should validate partial fields with required vehicle_id", () => {
    const result = serviceLogUpdateSchema.safeParse({
      vehicle_id: "550e8400-e29b-41d4-a716-446655440000",
      cost: 100,
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing vehicle_id", () => {
    const result = serviceLogUpdateSchema.safeParse({ cost: 100 });
    expect(result.success).toBe(false);
  });
});

describe("calculateTotalFromItems", () => {
  it("should return 0 for undefined", () => {
    expect(calculateTotalFromItems(undefined)).toBe(0);
  });

  it("should return 0 for empty array", () => {
    expect(calculateTotalFromItems([])).toBe(0);
  });

  it("should calculate total for single item", () => {
    expect(calculateTotalFromItems([{ description: "Oil", price: 25 }])).toBe(
      25,
    );
  });

  it("should calculate total for multiple items", () => {
    expect(
      calculateTotalFromItems([
        { description: "Oil", price: 25 },
        { description: "Filter", price: 15 },
        { description: "Labor", price: 50 },
      ]),
    ).toBe(90);
  });

  it("should treat items with missing price as 0", () => {
    expect(
      calculateTotalFromItems([
        { description: "Oil", price: 25 },
        { description: "Free check" } as any,
      ]),
    ).toBe(25);
  });
});

describe("constants", () => {
  it("serviceTypes should have 7 values", () => {
    expect(serviceTypes).toHaveLength(7);
  });

  it("serviceTypeLabels should have a label for each type", () => {
    for (const type of serviceTypes) {
      expect(serviceTypeLabels[type]).toBeDefined();
      expect(typeof serviceTypeLabels[type]).toBe("string");
    }
  });

  it("serviceLogDefaultValues should have correct defaults", () => {
    expect(serviceLogDefaultValues.service_type).toBeUndefined();
    expect(serviceLogDefaultValues.description).toBe("");
    expect(serviceLogDefaultValues.cost).toBeUndefined();
    expect(serviceLogDefaultValues.items).toEqual([]);
    expect(serviceLogDefaultValues.date).toBeDefined();
    expect(serviceLogDefaultValues.odometer_reading).toBeUndefined();
    expect(serviceLogDefaultValues.next_service_due).toBe("");
    expect(serviceLogDefaultValues.receipt_image_url).toBe("");
    expect(serviceLogDefaultValues.auto_filled).toBe(false);
  });
});
