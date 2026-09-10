import { fetchAnalyticsData } from "@/lib/supabase/analytics-queries";
import type { AnalyticsFilters } from "@/types/analytics";

const mockFrom = jest.fn();

jest.mock("@/services/supabaseClient", () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

function query(data: unknown[]) {
  const builder: any = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    in: jest.fn(() => builder),
    gte: jest.fn(() => builder),
    lte: jest.fn(() => builder),
    order: jest.fn(() => builder),
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data, error: null }).then(resolve),
  };
  return builder;
}

const filters: AnalyticsFilters = {
  period: {
    label: "30 Days",
    days: 30,
    startDate: new Date("2026-08-01"),
    endDate: new Date("2026-08-31"),
  },
  vehicleIds: [],
};

describe("fetchAnalyticsData", () => {
  beforeEach(() => mockFrom.mockReset());

  it("includes owned and group-shared vehicles when All is selected", async () => {
    const owned = query([{ id: "owned-1" }]);
    const memberships = query([{ group_id: "group-1" }]);
    const shares = query([{ vehicle_id: "shared-1" }]);
    const shared = query([{ id: "shared-1" }]);
    const fuelLogs = query([]);
    const serviceLogs = query([]);
    const mileageLogs = query([]);
    const vehicles = query([{ id: "owned-1" }, { id: "shared-1" }]);

    mockFrom
      .mockReturnValueOnce(owned)
      .mockReturnValueOnce(memberships)
      .mockReturnValueOnce(shares)
      .mockReturnValueOnce(shared)
      .mockReturnValueOnce(fuelLogs)
      .mockReturnValueOnce(serviceLogs)
      .mockReturnValueOnce(mileageLogs)
      .mockReturnValueOnce(vehicles);

    await fetchAnalyticsData("user-1", filters);

    expect(fuelLogs.in).toHaveBeenCalledWith("vehicle_id", [
      "owned-1",
      "shared-1",
    ]);
  });

  it("keeps an explicit vehicle selection unchanged", async () => {
    const fuelLogs = query([]);
    const serviceLogs = query([]);
    const mileageLogs = query([]);
    const vehicles = query([{ id: "selected-1" }]);
    mockFrom
      .mockReturnValueOnce(fuelLogs)
      .mockReturnValueOnce(serviceLogs)
      .mockReturnValueOnce(mileageLogs)
      .mockReturnValueOnce(vehicles);

    await fetchAnalyticsData("user-1", {
      ...filters,
      vehicleIds: ["selected-1"],
    });

    expect(fuelLogs.in).toHaveBeenCalledWith("vehicle_id", ["selected-1"]);
    expect(mockFrom).toHaveBeenCalledTimes(4);
  });
});
