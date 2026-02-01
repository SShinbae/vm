/**
 * Vehicle Schema Tests
 *
 * Tests for Zod validation schemas.
 */

import { vehicleSchema, vehicleDefaultValues } from "@/src/shared/schemas";

describe("vehicleSchema", () => {
  describe("valid data", () => {
    it("should validate correct vehicle data", () => {
      const validData = {
        make: "Toyota",
        model: "Camry",
        year: 2022,
        license_plate: "ABC123",
      };

      const result = vehicleSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate with optional fields", () => {
      const validData = {
        make: "Toyota",
        model: "Camry",
        year: 2022,
        license_plate: "ABC123",
        vin: "1HGBH41JXMN109186",
        color: "Blue",
      };

      const result = vehicleSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should uppercase license plate", () => {
      const data = {
        make: "Toyota",
        model: "Camry",
        year: 2022,
        license_plate: "abc123",
      };

      const result = vehicleSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.license_plate).toBe("ABC123");
      }
    });

    it("should trim whitespace", () => {
      const data = {
        make: "  Toyota  ",
        model: "  Camry  ",
        year: 2022,
        license_plate: "  ABC123  ",
      };

      const result = vehicleSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.make).toBe("Toyota");
        expect(result.data.model).toBe("Camry");
      }
    });
  });

  describe("invalid data", () => {
    it("should reject empty make", () => {
      const data = {
        make: "",
        model: "Camry",
        year: 2022,
        license_plate: "ABC123",
      };

      const result = vehicleSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("make");
      }
    });

    it("should reject empty model", () => {
      const data = {
        make: "Toyota",
        model: "",
        year: 2022,
        license_plate: "ABC123",
      };

      const result = vehicleSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("model");
      }
    });

    it("should reject year before 1900", () => {
      const data = {
        make: "Toyota",
        model: "Camry",
        year: 1899,
        license_plate: "ABC123",
      };

      const result = vehicleSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("year");
      }
    });

    it("should reject year too far in future", () => {
      const data = {
        make: "Toyota",
        model: "Camry",
        year: new Date().getFullYear() + 5,
        license_plate: "ABC123",
      };

      const result = vehicleSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("year");
      }
    });

    it("should reject empty license plate", () => {
      const data = {
        make: "Toyota",
        model: "Camry",
        year: 2022,
        license_plate: "",
      };

      const result = vehicleSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("license_plate");
      }
    });

    it("should reject VIN longer than 17 characters", () => {
      const data = {
        make: "Toyota",
        model: "Camry",
        year: 2022,
        license_plate: "ABC123",
        vin: "12345678901234567890", // 20 characters
      };

      const result = vehicleSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("vin");
      }
    });
  });

  describe("default values", () => {
    it("should have correct default values", () => {
      expect(vehicleDefaultValues.make).toBe("");
      expect(vehicleDefaultValues.model).toBe("");
      expect(vehicleDefaultValues.license_plate).toBe("");
      expect(vehicleDefaultValues.year).toBe(new Date().getFullYear());
    });
  });
});
