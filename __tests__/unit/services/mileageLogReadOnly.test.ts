const mockSingle = jest.fn();
const mockDelete = jest.fn();
const mockUpdate = jest.fn();

jest.mock("@/services/supabaseClient", () => ({
  supabase: {
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: () => mockSingle() }) }),
      delete: (...a: unknown[]) => mockDelete(...a),
      update: (...a: unknown[]) => mockUpdate(...a),
    }),
  },
}));
jest.mock("@/lib/utils/serviceUtils", () => ({
  canUserAccessVehicle: jest.fn().mockResolvedValue(true),
}));

import {
  AUTO_MILEAGE_LOG_READ_ONLY,
  MileageLogService,
  isAutoMileageLog,
} from "@/lib/services/mileageLogService";

describe("isAutoMileageLog", () => {
  it("is true only for mileage logs created from fuel logs", () => {
    expect(isAutoMileageLog("mileage", { source: "fuel_log" })).toBe(true);
    expect(isAutoMileageLog("mileage", { source: "manual" })).toBe(false);
    expect(isAutoMileageLog("fuel", { source: "fuel_log" })).toBe(false);
    expect(isAutoMileageLog("mileage", {})).toBe(false);
    expect(isAutoMileageLog("mileage", null)).toBe(false);
  });
});

describe("auto mileage logs are read-only", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSingle.mockResolvedValue({
      data: { vehicle_id: "veh-1", user_id: "user-1", source: "fuel_log" },
      error: null,
    });
  });

  it("refuses to delete an auto mileage log", async () => {
    const result = await MileageLogService.deleteMileageLog("m1");
    expect(result.error).toBe(AUTO_MILEAGE_LOG_READ_ONLY);
    // Callers show the error as-is, so it must be readable, not a code.
    expect(result.error).toMatch(/Edit or delete the fuel log instead/);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("refuses to update an auto mileage log", async () => {
    const result = await MileageLogService.updateMileageLog("m1", {
      odometer_reading: 1,
    } as never);
    expect(result.error).toBe(AUTO_MILEAGE_LOG_READ_ONLY);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
