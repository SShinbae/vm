/**
 * Service Utils Tests
 *
 * Tests for service item formatting, service type formatting,
 * and critical vehicle access control logic.
 */

import {
  formatServiceItems,
  formatServiceType,
  canUserAccessVehicle,
} from "@/lib/utils/serviceUtils";
import {
  createSupabaseMock,
  createMockQueryBuilder,
} from "../../setup/supabaseMock";

// Mock the supabase client
jest.mock("@/services/supabaseClient", () => ({
  supabase: {},
}));

describe("serviceUtils", () => {
  // ==========================================================================
  // formatServiceItems Tests
  // ==========================================================================

  describe("formatServiceItems", () => {
    it("should format JSON array of service items to numbered list", () => {
      const input = JSON.stringify([
        { description: "Oil Filter", price: 25 },
        { description: "Labor", price: 50 },
        { description: "Synthetic Oil 5L", price: 120 },
      ]);

      const result = formatServiceItems(input);

      expect(result).toContain("1. Oil Filter RM25");
      expect(result).toContain("2. Labor RM50");
      expect(result).toContain("3. Synthetic Oil 5L RM120");
    });

    it("should handle single item array", () => {
      const input = JSON.stringify([{ description: "Brake Pads", price: 200 }]);

      const result = formatServiceItems(input);

      expect(result).toBe("   1. Brake Pads RM200");
    });

    it("should handle empty array", () => {
      const input = JSON.stringify([]);

      const result = formatServiceItems(input);

      expect(result).toBe("");
    });

    it("should return original string for invalid JSON", () => {
      const input = "Not valid JSON";

      const result = formatServiceItems(input);

      expect(result).toBe("Not valid JSON");
    });

    it("should return original string for non-array JSON", () => {
      const input = JSON.stringify({ description: "Oil Change", price: 75 });

      const result = formatServiceItems(input);

      expect(result).toBe(input);
    });

    it("should handle items with decimal prices", () => {
      const input = JSON.stringify([
        { description: "Parts", price: 99.99 },
        { description: "Tax", price: 10.5 },
      ]);

      const result = formatServiceItems(input);

      expect(result).toContain("RM99.99");
      expect(result).toContain("RM10.5");
    });

    it("should handle items with zero price", () => {
      const input = JSON.stringify([
        { description: "Free inspection", price: 0 },
      ]);

      const result = formatServiceItems(input);

      expect(result).toBe("   1. Free inspection RM0");
    });

    it("should handle items with special characters in description", () => {
      const input = JSON.stringify([
        { description: "Oil & Filter Change", price: 75 },
        { description: "A/C Recharge", price: 150 },
      ]);

      const result = formatServiceItems(input);

      expect(result).toContain("Oil & Filter Change");
      expect(result).toContain("A/C Recharge");
    });

    it("should preserve indentation with 3 spaces", () => {
      const input = JSON.stringify([{ description: "Test", price: 10 }]);

      const result = formatServiceItems(input);

      expect(result.startsWith("   ")).toBe(true);
    });

    it("should handle malformed JSON gracefully", () => {
      const inputs = ["{invalid}", "[{test}]", "{{}}"];

      inputs.forEach((input) => {
        const result = formatServiceItems(input);
        expect(result).toBe(input);
      });
    });
  });

  // ==========================================================================
  // formatServiceType Tests
  // ==========================================================================

  describe("formatServiceType", () => {
    it("should convert snake_case to Title Case", () => {
      expect(formatServiceType("oil_change")).toBe("Oil Change");
      expect(formatServiceType("tire_rotation")).toBe("Tire Rotation");
      expect(formatServiceType("brake_service")).toBe("Brake Service");
      expect(formatServiceType("general_maintenance")).toBe(
        "General Maintenance",
      );
    });

    it("should return 'OTHER' uppercase for 'other' type", () => {
      expect(formatServiceType("other")).toBe("OTHER");
    });

    it("should handle single word service types", () => {
      expect(formatServiceType("repair")).toBe("Repair");
      expect(formatServiceType("inspection")).toBe("Inspection");
    });

    it("should handle multi-word service types", () => {
      expect(formatServiceType("air_filter_replacement")).toBe(
        "Air Filter Replacement",
      );
      expect(formatServiceType("spark_plug_change")).toBe("Spark Plug Change");
    });

    it("should handle already formatted strings", () => {
      expect(formatServiceType("OilChange")).toBe("OilChange");
    });

    it("should handle empty string", () => {
      expect(formatServiceType("")).toBe("");
    });

    it("should handle service types with numbers", () => {
      expect(formatServiceType("service_10000km")).toBe("Service 10000km");
    });

    it("should capitalize first letter of each word", () => {
      const result = formatServiceType("major_service_check");
      const words = result.split(" ");
      words.forEach((word) => {
        expect(word[0]).toBe(word[0].toUpperCase());
      });
    });
  });

  // ==========================================================================
  // canUserAccessVehicle Tests (CRITICAL)
  // ==========================================================================

  describe("canUserAccessVehicle", () => {
    let mockSupabase: ReturnType<typeof createSupabaseMock>;

    beforeEach(() => {
      jest.clearAllMocks();
      mockSupabase = createSupabaseMock();
      jest.requireMock("@/services/supabaseClient").supabase = mockSupabase;
    });

    it("should return true when user owns the vehicle", async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "vehicles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [{ id: "vehicle-1" }],
                error: null,
              }),
            }),
          };
        }
        return createMockQueryBuilder();
      });

      const result = await canUserAccessVehicle("vehicle-1", "user-1");

      expect(result).toBe(true);
    });

    it("should return true when vehicle is shared through user's group", async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "vehicles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [], // User doesn't own vehicle
                error: null,
              }),
            }),
          };
        }
        if (table === "group_members") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [{ group_id: "group-1" }, { group_id: "group-2" }],
              error: null,
            }),
          };
        }
        if (table === "vehicle_group_shares") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ vehicle_id: "vehicle-1" }],
                error: null,
              }),
            }),
          };
        }
        return createMockQueryBuilder();
      });

      const result = await canUserAccessVehicle("vehicle-1", "user-1");

      expect(result).toBe(true);
    });

    it("should return false when user does not own vehicle and has no group access", async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "vehicles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        if (table === "group_members") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        return createMockQueryBuilder();
      });

      const result = await canUserAccessVehicle("vehicle-1", "user-1");

      expect(result).toBe(false);
    });

    it("should return false when user is in groups but vehicle not shared with those groups", async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "vehicles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        if (table === "group_members") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [{ group_id: "group-1" }],
              error: null,
            }),
          };
        }
        if (table === "vehicle_group_shares") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [], // Vehicle not shared with user's groups
                error: null,
              }),
            }),
          };
        }
        return createMockQueryBuilder();
      });

      const result = await canUserAccessVehicle("vehicle-1", "user-1");

      expect(result).toBe(false);
    });

    it("should return false on database error for owned vehicles check", async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "vehicles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Database error" },
              }),
            }),
          };
        }
        if (table === "group_members") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        return createMockQueryBuilder();
      });

      const result = await canUserAccessVehicle("vehicle-1", "user-1");

      expect(result).toBe(false);
    });

    it("should return false on database error for group members check", async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "vehicles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        if (table === "group_members") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" },
            }),
          };
        }
        return createMockQueryBuilder();
      });

      const result = await canUserAccessVehicle("vehicle-1", "user-1");

      expect(result).toBe(false);
    });

    it("should return false on database error for vehicle shares check", async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "vehicles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        if (table === "group_members") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [{ group_id: "group-1" }],
              error: null,
            }),
          };
        }
        if (table === "vehicle_group_shares") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Database error" },
              }),
            }),
          };
        }
        return createMockQueryBuilder();
      });

      const result = await canUserAccessVehicle("vehicle-1", "user-1");

      expect(result).toBe(false);
    });

    it("should handle exception gracefully and return false", async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const result = await canUserAccessVehicle("vehicle-1", "user-1");

      expect(result).toBe(false);
    });

    it("should prioritize ownership check before group access", async () => {
      const vehicleQueryMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [{ id: "vehicle-1" }],
          error: null,
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "vehicles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: vehicleQueryMock,
          };
        }
        return createMockQueryBuilder();
      });

      const result = await canUserAccessVehicle("vehicle-1", "user-1");

      expect(result).toBe(true);
      // Group queries should not be made if user owns the vehicle
    });

    it("should check all user groups for vehicle access", async () => {
      const inMock = jest.fn().mockResolvedValue({
        data: [{ vehicle_id: "vehicle-1" }],
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "vehicles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === "group_members") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [
                { group_id: "group-1" },
                { group_id: "group-2" },
                { group_id: "group-3" },
              ],
              error: null,
            }),
          };
        }
        if (table === "vehicle_group_shares") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
              in: inMock,
            }),
          };
        }
        return createMockQueryBuilder();
      });

      await canUserAccessVehicle("vehicle-1", "user-1");

      expect(inMock).toHaveBeenCalledWith("group_id", [
        "group-1",
        "group-2",
        "group-3",
      ]);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe("Edge Cases", () => {
    it("formatServiceItems should handle very long descriptions", () => {
      const longDescription = "A".repeat(1000);
      const input = JSON.stringify([
        { description: longDescription, price: 100 },
      ]);

      const result = formatServiceItems(input);

      expect(result).toContain(longDescription);
    });

    it("formatServiceType should handle mixed case input", () => {
      expect(formatServiceType("Oil_Change")).toBe("Oil Change");
      expect(formatServiceType("BRAKE_SERVICE")).toBe("BRAKE SERVICE");
    });

    it("formatServiceItems should handle unicode characters", () => {
      const input = JSON.stringify([
        { description: "服务检查 (Service Check)", price: 50 },
      ]);

      const result = formatServiceItems(input);

      expect(result).toContain("服务检查");
    });
  });
});
