/**
 * Mileage Log Schema Tests
 *
 * Tests for Zod validation schemas and dynamic schema factory.
 */

import {
  mileageLogSchema,
  mileageLogUpdateSchema,
  mileageLogDefaultValues,
  createMileageLogSchemaWithMin,
} from "@/src/shared/schemas/mileageLogSchema";

const validMileageLog = {
  vehicle_id: "550e8400-e29b-41d4-a716-446655440000",
  odometer_reading: 50000,
  date: "2024-01-15",
  notes: "Regular checkup",
};

describe("mileageLogSchema", () => {
  describe("valid data", () => {
    it("should validate complete valid data", () => {
      const result = mileageLogSchema.safeParse(validMileageLog);
      expect(result.success).toBe(true);
    });

    it("should accept optional notes as empty string", () => {
      const result = mileageLogSchema.safeParse({
        ...validMileageLog,
        notes: "",
      });
      expect(result.success).toBe(true);
    });

    it("should accept missing notes", () => {
      const { notes, ...rest } = validMileageLog;
      const result = mileageLogSchema.safeParse(rest);
      expect(result.success).toBe(true);
    });
  });

  describe("invalid data", () => {
    it("should reject invalid vehicle UUID", () => {
      const result = mileageLogSchema.safeParse({
        ...validMileageLog,
        vehicle_id: "not-a-uuid",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("vehicle_id");
      }
    });

    it("should reject negative odometer", () => {
      const result = mileageLogSchema.safeParse({
        ...validMileageLog,
        odometer_reading: -1,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("odometer_reading");
      }
    });

    it("should reject non-integer odometer", () => {
      const result = mileageLogSchema.safeParse({
        ...validMileageLog,
        odometer_reading: 50000.5,
      });
      expect(result.success).toBe(false);
    });

    it("should reject odometer over 2000000", () => {
      const result = mileageLogSchema.safeParse({
        ...validMileageLog,
        odometer_reading: 2000001,
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid date", () => {
      const result = mileageLogSchema.safeParse({
        ...validMileageLog,
        date: "not-a-date",
      });
      expect(result.success).toBe(false);
    });

    it("should reject notes over 500 characters", () => {
      const result = mileageLogSchema.safeParse({
        ...validMileageLog,
        notes: "A".repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("mileageLogUpdateSchema", () => {
  it("should validate partial fields with required vehicle_id", () => {
    const result = mileageLogUpdateSchema.safeParse({
      vehicle_id: "550e8400-e29b-41d4-a716-446655440000",
      odometer_reading: 55000,
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing vehicle_id", () => {
    const result = mileageLogUpdateSchema.safeParse({
      odometer_reading: 55000,
    });
    expect(result.success).toBe(false);
  });
});

describe("createMileageLogSchemaWithMin", () => {
  it("should reject odometer below min", () => {
    const schema = createMileageLogSchemaWithMin(10000);
    const result = schema.safeParse({
      ...validMileageLog,
      odometer_reading: 5000,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("10,000");
    }
  });

  it("should accept odometer at min", () => {
    const schema = createMileageLogSchemaWithMin(10000);
    const result = schema.safeParse({
      ...validMileageLog,
      odometer_reading: 10000,
    });
    expect(result.success).toBe(true);
  });

  it("should accept odometer above min", () => {
    const schema = createMileageLogSchemaWithMin(10000);
    const result = schema.safeParse({
      ...validMileageLog,
      odometer_reading: 15000,
    });
    expect(result.success).toBe(true);
  });
});

describe("default values", () => {
  it("should have correct defaults", () => {
    expect(mileageLogDefaultValues.odometer_reading).toBeUndefined();
    expect(mileageLogDefaultValues.notes).toBe("");
    expect(mileageLogDefaultValues.date).toBeDefined();
  });
});
