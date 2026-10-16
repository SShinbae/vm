import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import {
  AnalyticsPeriodProvider,
  AnalyticsVehicleProvider,
  usePeriodSelector,
  useVehicleFilter,
} from "@/hooks/useAnalytics";
import { fetchAccessibleVehicles } from "@/lib/supabase/analytics-queries";
let mockUserId = "one";
jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: mockUserId } }),
}));
jest.mock("@/lib/supabase/analytics-queries", () => ({
  fetchAccessibleVehicles: jest.fn(),
  fetchAnalyticsData: jest.fn(),
  fetchVehiclesWithLogs: jest.fn(),
}));
jest.mock("@/hooks/useAnalyticsWorker", () => ({
  useAnalyticsWorker: () => ({ isReady: true }),
}));
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AnalyticsPeriodProvider>
    <AnalyticsVehicleProvider>{children}</AnalyticsVehicleProvider>
  </AnalyticsPeriodProvider>
);
beforeEach(() => {
  jest.clearAllMocks();
  mockUserId = "one";
  (fetchAccessibleVehicles as jest.Mock).mockResolvedValue([
    { id: "a" },
    { id: "b" },
  ]);
});
it("shares vehicles and selections between tab consumers with one fetch", async () => {
  const { result } = renderHook(
    () => ({ first: useVehicleFilter(), second: useVehicleFilter() }),
    { wrapper },
  );
  await waitFor(() => expect(result.current.first.loading).toBe(false));
  expect(fetchAccessibleVehicles).toHaveBeenCalledTimes(1);
  act(() => result.current.first.toggleVehicle("b"));
  expect(result.current.second.selectedVehicleIds).toEqual(["b"]);
  act(() => result.current.second.selectAll());
  expect(result.current.first.selectedVehicleIds).toEqual([]);
});
it("shares the selected period between tabs", () => {
  const { result } = renderHook(
    () => ({ first: usePeriodSelector(), second: usePeriodSelector() }),
    { wrapper },
  );
  act(() => result.current.first.setPeriod(result.current.first.periods[0]));
  expect(result.current.second.period).toEqual(result.current.first.periods[0]);
});
it("offers retry after a vehicle failure", async () => {
  (fetchAccessibleVehicles as jest.Mock).mockRejectedValueOnce(
    new Error("Offline"),
  );
  const { result } = renderHook(() => useVehicleFilter(), { wrapper });
  await waitFor(() => expect(result.current.error).toBeTruthy());
  await act(async () => result.current.refetch());
  expect(result.current.error).toBeNull();
  expect(result.current.vehicles).toHaveLength(2);
});
it("ignores a late vehicle response after account change", async () => {
  let resolve!: (value: any) => void;
  (fetchAccessibleVehicles as jest.Mock).mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const { result, rerender } = renderHook(() => useVehicleFilter(), {
    wrapper,
  });
  mockUserId = "two";
  (fetchAccessibleVehicles as jest.Mock).mockResolvedValue([{ id: "new" }]);
  rerender({});
  await waitFor(() => expect(result.current.vehicles).toEqual([{ id: "new" }]));
  await act(async () => resolve([{ id: "old" }]));
  expect(result.current.vehicles).toEqual([{ id: "new" }]);
  expect(result.current.selectedVehicleIds).toEqual([]);
});
