const mockSelectResult = jest.fn();
const mockInsert = jest.fn();
const mockUpdateEq = jest.fn();
const mockUpdate = jest.fn((..._a: unknown[]) => ({ eq: mockUpdateEq }));
const mockWarn = jest.fn();

jest.mock("@/services/supabaseClient", () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => mockSelectResult() }) }),
      insert: (...a: unknown[]) => mockInsert(...a),
      update: (...a: unknown[]) => mockUpdate(...a),
    }),
  },
}));
jest.mock("@/lib/utils/logger", () => ({
  logger: {
    warn: (...a: unknown[]) => mockWarn(...a),
    log: jest.fn(),
    error: jest.fn(),
  },
}));

import {
  AUTO_MILEAGE_NOTE,
  upsertAutoMileageLog,
} from "@/lib/services/fuelLogService";

const args = ["veh-1", 31000, "2026-10-08", "user-1"] as const;

beforeEach(() => {
  jest.clearAllMocks();
  mockInsert.mockResolvedValue({ error: null });
  mockUpdateEq.mockResolvedValue({ error: null });
});

describe("upsertAutoMileageLog", () => {
  it("creates an auto mileage log when the day has none", async () => {
    mockSelectResult.mockResolvedValue({ data: [], error: null });
    await upsertAutoMileageLog(...args);
    expect(mockInsert).toHaveBeenCalledWith({
      vehicle_id: "veh-1",
      date: "2026-10-08",
      odometer_reading: 31000,
      notes: AUTO_MILEAGE_NOTE,
      user_id: "user-1",
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("raises the day's auto mileage log when the new reading is higher", async () => {
    mockSelectResult.mockResolvedValue({
      data: [{ id: "m1", odometer_reading: 28900, notes: AUTO_MILEAGE_NOTE }],
      error: null,
    });
    await upsertAutoMileageLog(...args);
    expect(mockUpdate).toHaveBeenCalledWith({ odometer_reading: 31000 });
    expect(mockUpdateEq).toHaveBeenCalledWith("id", "m1");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("leaves the auto log alone when the new reading isn't higher", async () => {
    mockSelectResult.mockResolvedValue({
      data: [{ id: "m1", odometer_reading: 32000, notes: AUTO_MILEAGE_NOTE }],
      error: null,
    });
    await upsertAutoMileageLog(...args);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("never overwrites a manual mileage log", async () => {
    mockSelectResult.mockResolvedValue({
      data: [
        { id: "m2", odometer_reading: 20000, notes: "Weekly odometer check" },
      ],
      error: null,
    });
    await upsertAutoMileageLog(...args);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("logs insert and update errors instead of failing silently", async () => {
    mockSelectResult.mockResolvedValue({ data: [], error: null });
    mockInsert.mockResolvedValue({ error: { message: "rls" } });
    await upsertAutoMileageLog(...args);
    expect(mockWarn).toHaveBeenCalledWith(
      "Failed to auto-create mileage log:",
      { message: "rls" },
    );

    mockWarn.mockClear();
    mockSelectResult.mockResolvedValue({
      data: [{ id: "m1", odometer_reading: 100, notes: AUTO_MILEAGE_NOTE }],
      error: null,
    });
    mockUpdateEq.mockResolvedValue({ error: { message: "rls" } });
    await upsertAutoMileageLog(...args);
    expect(mockWarn).toHaveBeenCalledWith("Failed to raise auto mileage log:", {
      message: "rls",
    });
  });
});
