/**
 * Vehicle Service Tests
 *
 * Tests for VehicleService covering CRUD operations, sharing functionality,
 * and vehicle statistics calculations.
 */

import { VehicleService } from "@/lib/services/vehicleService";
import {
  createSupabaseMock,
  createUnauthenticatedMock,
  MockDataBuilders,
  createMockQueryBuilder,
} from "../../setup/supabaseMock";

// Mock the supabase client
jest.mock("@/services/supabaseClient", () => ({
  supabase: {},
}));

// Mock image upload
jest.mock("@/lib/utils/imageUpload", () => ({
  uploadImage: jest
    .fn()
    .mockResolvedValue({ success: true, url: "https://test.url/image.jpg" }),
}));

describe("VehicleService", () => {
  let mockSupabase: ReturnType<typeof createSupabaseMock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createSupabaseMock();
    // Replace the supabase mock
    jest.requireMock("@/services/supabaseClient").supabase = mockSupabase;
  });

  // ==========================================================================
  // Authentication Tests
  // ==========================================================================

  describe("Authentication", () => {
    it("should return error when user is not authenticated for getVehicles", async () => {
      const unauthMock = createUnauthenticatedMock();
      jest.requireMock("@/services/supabaseClient").supabase = unauthMock;

      const result = await VehicleService.getVehicles();

      expect(result.error).toBe("User not authenticated");
      expect(result.data).toBeNull();
    });

    it("should return error when user is not authenticated for createVehicle", async () => {
      const unauthMock = createUnauthenticatedMock();
      jest.requireMock("@/services/supabaseClient").supabase = unauthMock;

      const result = await VehicleService.createVehicle({
        make: "Toyota",
        model: "Camry",
        year: 2022,
        license_plate: "ABC123",
      });

      expect(result.error).toBe("User not authenticated");
      expect(result.data).toBeNull();
    });

    it("should return error when user is not authenticated for deleteVehicle", async () => {
      const unauthMock = createUnauthenticatedMock();
      jest.requireMock("@/services/supabaseClient").supabase = unauthMock;

      const result = await VehicleService.deleteVehicle("vehicle-1");

      expect(result.error).toBe("User not authenticated");
      expect(result.data).toBeNull();
    });
  });

  // ==========================================================================
  // getVehicles / getVehiclesSeparated Tests
  // ==========================================================================

  describe("getVehicles", () => {
    it("should fetch vehicles with sharing info using RPC", async () => {
      const mockVehicles = [
        {
          vehicle_id: "v1",
          make: "Toyota",
          model: "Camry",
          year: 2022,
          license_plate: "ABC123",
          vin: null,
          main_image_url: null,
          color: "Blue",
          current_mileage: 50000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_own_vehicle: true,
          owner_name: "Test User",
          owner_email: "test@example.com",
          shared_groups: [],
        },
      ];

      mockSupabase.rpc.mockResolvedValue({ data: mockVehicles, error: null });

      // Mock the subsequent queries for images and logs
      const imagesBuilder = createMockQueryBuilder({ selectData: [] });
      const sharesBuilder = createMockQueryBuilder({ selectData: [] });
      const logsBuilder = createMockQueryBuilder({ selectData: [] });

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case "vehicle_images":
            return imagesBuilder;
          case "vehicle_group_shares":
            return sharesBuilder;
          case "mileage_logs":
          case "fuel_logs":
          case "service_logs":
            return logsBuilder;
          default:
            return createMockQueryBuilder();
        }
      });

      const result = await VehicleService.getVehicles();

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].make).toBe("Toyota");
      expect(result.data?.[0].is_own_vehicle).toBe(true);
    });

    it("should handle RPC error gracefully", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "RPC failed" },
      });

      const result = await VehicleService.getVehicles();

      expect(result.error).toBe("RPC failed");
      expect(result.data).toBeNull();
    });
  });

  describe("getVehiclesSeparated", () => {
    it("should separate owned and shared vehicles", async () => {
      const mockVehicles = [
        {
          vehicle_id: "v1",
          make: "Toyota",
          model: "Camry",
          year: 2022,
          license_plate: "ABC123",
          is_own_vehicle: true,
          owner_email: "test@example.com",
          shared_groups: [],
          current_mileage: 50000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          vehicle_id: "v2",
          make: "Honda",
          model: "Civic",
          year: 2021,
          license_plate: "XYZ789",
          is_own_vehicle: false,
          owner_email: "other@example.com",
          owner_name: "Other User",
          shared_groups: ["Group 1"],
          current_mileage: 30000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockSupabase.rpc.mockResolvedValue({ data: mockVehicles, error: null });
      mockSupabase.from.mockImplementation(() =>
        createMockQueryBuilder({ selectData: [] }),
      );

      const result = await VehicleService.getVehiclesSeparated();

      expect(result.error).toBeNull();
      expect(result.data?.ownVehicles).toHaveLength(1);
      expect(result.data?.sharedVehicles).toHaveLength(1);
      expect(result.data?.ownVehicles[0].make).toBe("Toyota");
      expect(result.data?.sharedVehicles[0].make).toBe("Honda");
    });
  });

  // ==========================================================================
  // createVehicle Tests
  // ==========================================================================

  describe("createVehicle", () => {
    it("should create a vehicle successfully", async () => {
      const newVehicle = MockDataBuilders.vehicle();

      // Mock check for duplicate license plate (no duplicates)
      const duplicateCheckBuilder = createMockQueryBuilder({ selectData: [] });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "vehicles") {
          return {
            ...duplicateCheckBuilder,
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockResolvedValue({ data: newVehicle, error: null }),
              }),
            }),
          };
        }
        return createMockQueryBuilder();
      });

      const result = await VehicleService.createVehicle({
        make: "Toyota",
        model: "Camry",
        year: 2022,
        license_plate: "ABC123",
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    });

    it("should reject duplicate license plate", async () => {
      const existingVehicle = MockDataBuilders.vehicle();

      // Mock existing vehicle with same license plate
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [existingVehicle],
            error: null,
          }),
        }),
      }));

      const result = await VehicleService.createVehicle({
        make: "Honda",
        model: "Civic",
        year: 2021,
        license_plate: "ABC123",
      });

      expect(result.error).toBe(
        "A vehicle with this license plate already exists",
      );
      expect(result.data).toBeNull();
    });

    it("should share vehicle with groups when specified", async () => {
      const newVehicle = MockDataBuilders.vehicle();
      const rpcMock = jest.fn().mockResolvedValue({ data: null, error: null });

      // Mock vehicle creation
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest
              .fn()
              .mockResolvedValue({ data: newVehicle, error: null }),
          }),
        }),
      }));
      mockSupabase.rpc = rpcMock;

      await VehicleService.createVehicle(
        {
          make: "Toyota",
          model: "Camry",
          year: 2022,
          license_plate: "NEW123",
        },
        ["group-1", "group-2"],
      );

      expect(rpcMock).toHaveBeenCalledWith("share_vehicle_with_groups", {
        vehicle_uuid: newVehicle.id,
        group_uuids: ["group-1", "group-2"],
      });
    });
  });

  // ==========================================================================
  // updateVehicle Tests
  // ==========================================================================

  describe("updateVehicle", () => {
    it("should update vehicle successfully when user owns it", async () => {
      const existingVehicle = MockDataBuilders.vehicle();
      const updatedVehicle = { ...existingVehicle, color: "Red" };

      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: "test-user-id" },
            error: null,
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest
                .fn()
                .mockResolvedValue({ data: updatedVehicle, error: null }),
            }),
          }),
        }),
      }));

      const result = await VehicleService.updateVehicle("vehicle-1", {
        color: "Red",
      });

      expect(result.error).toBeNull();
    });

    it("should reject update when user does not own the vehicle", async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "vehicles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { user_id: "different-user-id" },
                error: null,
              }),
            }),
          };
        }
        if (table === "vehicle_group_shares" || table === "group_members") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
              in: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        return createMockQueryBuilder();
      });

      const result = await VehicleService.updateVehicle("vehicle-1", {
        color: "Red",
      });

      expect(result.error).toBe(
        "You do not have permission to edit this vehicle",
      );
    });

    it("should reject duplicate license plate on update", async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            neq: jest.fn().mockResolvedValue({
              data: [{ id: "other-vehicle" }],
              error: null,
            }),
          }),
          single: jest.fn().mockResolvedValue({
            data: { user_id: "test-user-id" },
            error: null,
          }),
        }),
      }));

      const result = await VehicleService.updateVehicle("vehicle-1", {
        license_plate: "EXISTING123",
      });

      expect(result.error).toBe(
        "A vehicle with this license plate already exists",
      );
    });
  });

  // ==========================================================================
  // deleteVehicle Tests
  // ==========================================================================

  describe("deleteVehicle", () => {
    it("should delete vehicle when user owns it", async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: "test-user-id" },
            error: null,
          }),
        }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }));

      const result = await VehicleService.deleteVehicle("vehicle-1");

      expect(result.error).toBeNull();
      expect(result.data).toBe(true);
    });

    it("should reject delete when user does not own the vehicle", async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: "different-user-id" },
            error: null,
          }),
        }),
      }));

      const result = await VehicleService.deleteVehicle("vehicle-1");

      expect(result.error).toBe("You can only delete your own vehicles");
      expect(result.data).toBeNull();
    });

    it("should return error when vehicle not found", async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Not found", code: "PGRST116" },
          }),
        }),
      }));

      const result = await VehicleService.deleteVehicle("nonexistent-id");

      expect(result.error).toBe("Vehicle not found");
    });
  });

  // ==========================================================================
  // shareVehicleWithGroups Tests
  // ==========================================================================

  describe("shareVehicleWithGroups", () => {
    it("should share vehicle with groups atomically via RPC", async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      const result = await VehicleService.shareVehicleWithGroups("vehicle-1", [
        "group-1",
        "group-2",
      ]);

      expect(result.error).toBeNull();
      expect(result.data).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "share_vehicle_with_groups",
        {
          vehicle_uuid: "vehicle-1",
          group_uuids: ["group-1", "group-2"],
        },
      );
    });

    it("should handle RPC error when sharing fails", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "RPC error" },
      });

      const result = await VehicleService.shareVehicleWithGroups("vehicle-1", [
        "group-1",
      ]);

      expect(result.error).toBe("RPC error");
      expect(result.data).toBeNull();
    });

    it("should remove all shares when empty group list provided", async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      const result = await VehicleService.removeVehicleSharing("vehicle-1");

      expect(result.error).toBeNull();
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "share_vehicle_with_groups",
        {
          vehicle_uuid: "vehicle-1",
          group_uuids: [],
        },
      );
    });
  });

  // ==========================================================================
  // getVehicleStats Tests
  // ==========================================================================

  describe("getVehicleStats", () => {
    it("should calculate fuel efficiency from logs", async () => {
      const mileageLogs = [{ odometer_reading: 50000 }];
      const fuelLogs = [
        { liters_filled: 45, odometer_reading: 50500 },
        { liters_filled: 40, odometer_reading: 51000 },
      ];
      const serviceLogs = [
        { next_service_due: "55000", service_type: "oil_change" },
      ];

      mockSupabase.from.mockImplementation((table: string) => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: table === "service_logs" ? serviceLogs : [],
              error: null,
            }),
          }),
        }),
        then: jest.fn((callback) => {
          let data: any[] = [];
          if (table === "mileage_logs") data = mileageLogs;
          if (table === "fuel_logs") data = fuelLogs;
          return Promise.resolve(callback({ data, error: null }));
        }),
      }));

      const result = await VehicleService.getVehicleStats("vehicle-1");

      expect(result.currentMileage).toBe(50000);
      expect(result.fuelLogs).toHaveLength(2);
    });

    it("should handle empty logs gracefully", async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        then: jest.fn((callback) =>
          Promise.resolve(callback({ data: [], error: null })),
        ),
      }));

      const result = await VehicleService.getVehicleStats("vehicle-1");

      expect(result.currentMileage).toBe(0);
      expect(result.fuelLogs).toEqual([]);
      expect(result.nextService).toBeNull();
    });
  });

  // ==========================================================================
  // Service Templates Tests
  // ==========================================================================

  describe("Service Templates", () => {
    describe("getServiceTemplates", () => {
      it("should fetch user's service templates", async () => {
        const templates = [
          {
            id: "template-1",
            name: "Oil Change",
            description: "Standard oil change",
            total_cost: 75,
            service_template_items: [
              {
                id: "item-1",
                description: "Oil filter",
                price: "25",
                display_order: 1,
              },
              {
                id: "item-2",
                description: "Labor",
                price: "50",
                display_order: 2,
              },
            ],
          },
        ];

        mockSupabase.from.mockImplementation(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: templates, error: null }),
        }));

        const result = await VehicleService.getServiceTemplates();

        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(1);
        expect(result.data?.[0].name).toBe("Oil Change");
        expect(result.data?.[0].service_template_items).toHaveLength(2);
      });
    });

    describe("createDefaultTemplate", () => {
      it("should create a template structure with 2 empty rows", () => {
        const template = VehicleService.createDefaultTemplate();

        expect(template.name).toBe("");
        expect(template.description).toBe("");
        expect(template.items).toHaveLength(2);
        expect(template.items[0]).toEqual({ description: "", price: 0 });
      });
    });

    describe("calculateTotalCost", () => {
      it("should sum up all item prices", () => {
        const items = [{ price: 25 }, { price: 50 }, { price: 30 }];

        const total = VehicleService.calculateTotalCost(items);

        expect(total).toBe(105);
      });

      it("should handle empty array", () => {
        const total = VehicleService.calculateTotalCost([]);
        expect(total).toBe(0);
      });

      it("should handle items with undefined prices", () => {
        const items = [
          { price: 25 },
          { price: undefined as any },
          { price: 30 },
        ];

        const total = VehicleService.calculateTotalCost(items);

        expect(total).toBe(55);
      });
    });
  });
});
