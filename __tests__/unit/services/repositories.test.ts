/**
 * Repository Tests
 *
 * Tests for the data access layer repositories.
 */

import {
  vehicleRepository,
  VehicleRepository,
} from "@/src/services/repositories";

// Mock the Supabase client
jest.mock("@/src/services/api/supabaseClient", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: {
              id: "test-id",
              user_id: "user-id",
              make: "Toyota",
              model: "Camry",
              year: 2022,
              license_plate: "ABC123",
            },
            error: null,
          }),
          order: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
        order: jest.fn(() => ({
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { id: "new-id", make: "Honda", model: "Civic" },
            error: null,
          }),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: "test-id", make: "Toyota", model: "Camry Updated" },
              error: null,
            }),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })),
    })),
    rpc: jest.fn().mockResolvedValue({
      data: [
        { id: "vehicle-1", make: "Toyota" },
        { id: "vehicle-2", make: "Honda" },
      ],
      error: null,
    }),
  },
}));

describe("VehicleRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findById", () => {
    it("should return a vehicle when found", async () => {
      const result = await vehicleRepository.findById("test-id");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("test-id");
        expect(result.data.make).toBe("Toyota");
      }
    });
  });

  describe("findAccessibleVehicles", () => {
    it("should return accessible vehicles for a user", async () => {
      const result = await vehicleRepository.findAccessibleVehicles("user-id");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });
  });

  describe("create", () => {
    it("should create a new vehicle", async () => {
      const newVehicle = {
        user_id: "user-id",
        make: "Honda",
        model: "Civic",
        year: 2023,
        license_plate: "XYZ789",
      };

      const result = await vehicleRepository.create(newVehicle);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("new-id");
        expect(result.data.make).toBe("Honda");
      }
    });
  });

  describe("update", () => {
    it("should update an existing vehicle", async () => {
      const result = await vehicleRepository.update("test-id", {
        model: "Camry Updated",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe("Camry Updated");
      }
    });
  });

  describe("delete", () => {
    it("should delete a vehicle", async () => {
      const result = await vehicleRepository.delete("test-id");

      expect(result.success).toBe(true);
    });
  });
});
