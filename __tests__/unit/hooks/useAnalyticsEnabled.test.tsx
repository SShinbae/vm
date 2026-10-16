import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useMemo } from "react";
import {
  useAnalyticsData,
  useCostChartData,
  useAnalyticsTrends,
} from "@/hooks/useAnalytics";
import { fetchAnalyticsData } from "@/lib/supabase/analytics-queries";

jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1" } }),
}));
jest.mock("@/lib/supabase/analytics-queries", () => ({
  fetchAnalyticsData: jest.fn().mockResolvedValue({
    fuelLogs: [],
    serviceLogs: [],
    mileageLogs: [],
    vehicles: [],
    baselineFuelLogs: [],
  }),
  fetchAccessibleVehicles: jest.fn(),
  fetchVehiclesWithLogs: jest.fn(),
}));
jest.mock("@/hooks/useAnalyticsWorker", () => {
  // Stable identity, like the real hook's useCallback; a fresh jest.fn per render loops the effect.
  const worker = {
    isReady: true,
    calculateAllMetrics: jest.fn(),
    generateTrendDataAsync: jest.fn(async (logs: any[]) => logs),
  };
  return { useAnalyticsWorker: () => worker };
});

const filters = {
  period: {
    label: "30 Days",
    days: 30,
    startDate: new Date("2026-09-01"),
    endDate: new Date("2026-10-01"),
  },
  vehicleIds: [],
};

beforeEach(() => (fetchAnalyticsData as jest.Mock).mockClear());

it("ignores a trend response from the previous vehicle filter", async () => {
  let resolve!: (value: any) => void;
  (fetchAnalyticsData as jest.Mock).mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const { result, rerender } = renderHook(
    ({ ids }: { ids: string[] }) => {
      const scoped = useMemo(() => ({ ...filters, vehicleIds: ids }), [ids]);
      return useAnalyticsTrends(scoped, "fuel");
    },
    { initialProps: { ids: ["old"] } },
  );
  (fetchAnalyticsData as jest.Mock).mockResolvedValueOnce({
    fuelLogs: [{ date: "new", value: 2 }],
  });
  rerender({ ids: ["new"] });
  await waitFor(() =>
    expect(result.current.trendData).toEqual([{ date: "new", value: 2 }]),
  );
  await act(async () => resolve({ fuelLogs: [{ date: "old", value: 1 }] }));
  expect(result.current.trendData).toEqual([{ date: "new", value: 2 }]);
});

it("useAnalyticsData makes no request when disabled", async () => {
  const { result } = renderHook(() => useAnalyticsData(filters, false));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(fetchAnalyticsData).not.toHaveBeenCalled();
  expect(result.current.costMetrics).toBeNull();
});

it("exposes trend failures and retries without reporting an empty success", async () => {
  (fetchAnalyticsData as jest.Mock).mockRejectedValueOnce(new Error("Offline"));
  const { result } = renderHook(() => useAnalyticsTrends(filters, "fuel"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error?.message).toBe("Offline");
  await act(async () => result.current.refetch());
  expect(result.current.error).toBeNull();
});

it("useCostChartData makes no request when disabled", async () => {
  const { result } = renderHook(() => useCostChartData(filters, false));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(fetchAnalyticsData).not.toHaveBeenCalled();
  expect(result.current.chartDataset).toBeNull();
});

it("useCostChartData fetches when enabled (default)", async () => {
  renderHook(() => useCostChartData(filters));
  await waitFor(() => expect(fetchAnalyticsData).toHaveBeenCalledTimes(1));
});

it("useCostChartData clears data when rerendered with enabled=false", async () => {
  const { result, rerender } = renderHook(
    ({ enabled }: { enabled: boolean }) => useCostChartData(filters, enabled),
    { initialProps: { enabled: true } },
  );
  await waitFor(() => expect(result.current.chartDataset).not.toBeNull());
  rerender({ enabled: false });
  await waitFor(() => expect(result.current.chartDataset).toBeNull());
  expect(result.current.loading).toBe(false);
});

it("useCostChartData ignores a slow response that lands after being disabled", async () => {
  let resolve!: (v: unknown) => void;
  (fetchAnalyticsData as jest.Mock).mockReturnValueOnce(
    new Promise((r) => (resolve = r)),
  );
  const { result, rerender } = renderHook(
    ({ enabled }: { enabled: boolean }) => useCostChartData(filters, enabled),
    { initialProps: { enabled: true } },
  );
  rerender({ enabled: false });
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => {
    resolve({
      fuelLogs: [],
      serviceLogs: [],
      mileageLogs: [],
      vehicles: [],
      baselineFuelLogs: [],
    });
  });
  expect(result.current.chartDataset).toBeNull();
});

it("useAnalyticsData returns the cost series and clears it when disabled", async () => {
  const { useAnalyticsWorker } = require("@/hooks/useAnalyticsWorker");
  useAnalyticsWorker().calculateAllMetrics.mockResolvedValue({
    fuelMetrics: {},
    costMetrics: {},
    serviceMetrics: {},
    vehicleComparison: [],
  });
  const { result, rerender } = renderHook(
    ({ enabled }: { enabled: boolean }) => useAnalyticsData(filters, enabled),
    { initialProps: { enabled: true } },
  );
  await waitFor(() => expect(result.current.chartDataset).not.toBeNull());
  rerender({ enabled: false });
  await waitFor(() => expect(result.current.chartDataset).toBeNull());
});
