/**
 * Fuel Log Schema Tests
 *
 * Tests for Zod validation schemas and helper functions.
 */

import {
  fuelLogSchema,
  fuelLogUpdateSchema,
  fuelLogDefaultValues,
  calculateLiters,
  calculateCost,
} from "@/src/shared/schemas/fuelLogSchema";

const validFuelLog = {
  vehicle_id: "550e8400-e29b-41d4-a716-446655440000",
  liters_filled: 45.5,
  cost: 150.0,
  fuel_price: 3.3,
  date: "2024-01-15",
  odometer_reading: 50000,
  location: "Shell Station",
};

describe("fuelLogSchema", () => {
  describe("valid data", () => {
    it("should validate complete valid data", () => {
      const result = fuelLogSchema.safeParse(validFuelLog);
      expect(result.success).toBe(true);
    });

    it("should accept optional location as empty string", () => {
      const result = fuelLogSchema.safeParse({
        ...validFuelLog,
        location: "",
      });
      expect(result.success).toBe(true);
    });

    it("should accept missing location", () => {
      const { location, ...rest } = validFuelLog;
      const result = fuelLogSchema.safeParse(rest);
      expect(result.success).toBe(true);
    });
  });

  describe("invalid data", () => {
    it("should reject invalid UUID for vehicle_id", () => {
      const result = fuelLogSchema.safeParse({
        ...validFuelLog,
        vehicle_id: "not-a-uuid",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("vehicle_id");
      }
    });

    it("should reject zero liters_filled", () => {
      const result = fuelLogSchema.safeParse({
        ...validFuelLog,
        liters_filled: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("liters_filled");
      }
    });

    it("should reject negative liters_filled", () => {
      const result = fuelLogSchema.safeParse({
        ...validFuelLog,
        liters_filled: -5,
      });
      expect(result.success).toBe(false);
    });

    it("should reject liters_filled over 500", () => {
      const result = fuelLogSchema.safeParse({
        ...validFuelLog,
        liters_filled: 501,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative cost", () => {
      const result = fuelLogSchema.safeParse({
        ...validFuelLog,
        cost: -1,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("cost");
      }
    });

    it("should reject cost over 100000", () => {
      const result = fuelLogSchema.safeParse({
        ...validFuelLog,
        cost: 100001,
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero fuel_price", () => {
      const result = fuelLogSchema.safeParse({
        ...validFuelLog,
        fuel_price: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("fuel_price");
      }
    });

    it("should reject negative fuel_price", () => {
      const result = fuelLogSchema.safeParse({
        ...validFuelLog,
        fuel_price: -1,
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid date string", () => {
      const result = fuelLogSchema.safeParse({
        ...validFuelLog,
        date: "not-a-date",
      });
      expect(result.success).toBe(false);
    });

    it("should reject non-integer odometer", () => {
      const result = fuelLogSchema.safeParse({
        ...validFuelLog,
        odometer_reading: 50000.5,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("odometer_reading");
      }
    });

    it("should reject negative odometer", () => {
      const result = fuelLogSchema.safeParse({
        ...validFuelLog,
        odometer_reading: -1,
      });
      expect(result.success).toBe(false);
    });

    it("should reject odometer over 2000000", () => {
      const result = fuelLogSchema.safeParse({
        ...validFuelLog,
        odometer_reading: 2000001,
      });
      expect(result.success).toBe(false);
    });

    it("should reject location over 200 characters", () => {
      const result = fuelLogSchema.safeParse({
        ...validFuelLog,
        location: "A".repeat(201),
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("fuelLogUpdateSchema", () => {
  it("should validate partial fields with required vehicle_id", () => {
    const result = fuelLogUpdateSchema.safeParse({
      vehicle_id: "550e8400-e29b-41d4-a716-446655440000",
      liters_filled: 30,
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing vehicle_id", () => {
    const result = fuelLogUpdateSchema.safeParse({
      liters_filled: 30,
    });
    expect(result.success).toBe(false);
  });
});

describe("calculateLiters", () => {
  it("should calculate liters from cost and price", () => {
    expect(calculateLiters(150, 3)).toBe(50);
  });

  it("should return 0 when pricePerLiter is 0", () => {
    expect(calculateLiters(150, 0)).toBe(0);
  });

  it("should round to 2 decimal places", () => {
    expect(calculateLiters(100, 3)).toBe(33.33);
  });
});

describe("calculateCost", () => {
  it("should calculate cost from liters and price", () => {
    expect(calculateCost(50, 3)).toBe(150);
  });

  it("should round to 2 decimal places", () => {
    expect(calculateCost(33.33, 3)).toBe(99.99);
  });
});

describe("default values", () => {
  it("should have correct defaults", () => {
    expect(fuelLogDefaultValues.liters_filled).toBeUndefined();
    expect(fuelLogDefaultValues.cost).toBeUndefined();
    expect(fuelLogDefaultValues.fuel_price).toBeUndefined();
    expect(fuelLogDefaultValues.odometer_reading).toBeUndefined();
    expect(fuelLogDefaultValues.location).toBe("");
    expect(fuelLogDefaultValues.date).toBeDefined();
  });
});
