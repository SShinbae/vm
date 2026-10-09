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
} from "@/lib/services/mileageLogService";

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
