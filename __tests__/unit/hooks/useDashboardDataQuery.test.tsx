import { useDashboardDataQuery } from "@/hooks/useDashboardDataQuery";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

const mockRpc = jest.fn();
let mockReminderFailure = false;
let mockActivityRows: Record<string, any[]> = {};
let mockFuelTrendRows: any[] = [];
let mockActivityOrders: Record<string, string[]> = {};

jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

jest.mock("@/services/supabaseClient", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (table: string) => {
      let selected = "";
      const query = {
        select(fields: string) {
          selected = fields;
          return this;
        },
        in() {
          return this;
        },
        gte() {
          return this;
        },
        lte() {
          return this;
        },
        order(field: string) {
          if (selected.includes("vehicles(")) {
            (mockActivityOrders[table] ||= []).push(field);
          }
          return this;
        },
        limit() {
          return this;
        },
        range() {
          return this;
        },
        then(resolve: (value: unknown) => unknown) {
          const isReminder =
            table === "service_logs" && selected.includes("service_type");
          const isActivity = selected.includes("vehicles(");
          const isFuelTrend = table === "fuel_logs" && selected === "date,cost";
          return Promise.resolve(
            resolve({
              data:
                isReminder && !mockReminderFailure
                  ? [
                      {
                        id: "service-1",
                        vehicle_id: "vehicle-1",
                        service_type: "oil_change",
                        date: "2026-09-01",
                        created_at: "2026-09-01T10:00:00Z",
                        next_service_due: "2026-10-12",
                        next_service_mileage: null,
                      },
                    ]
                  : isFuelTrend
                    ? mockFuelTrendRows
                    : isActivity
                      ? mockActivityRows[table] || []
                      : [],
              error:
                isReminder && mockReminderFailure
                  ? { message: "Service unavailable" }
                  : null,
            }),
          );
        },
      };
      return query;
    },
  },
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

describe("useDashboardDataQuery reminders", () => {
  beforeEach(() => {
    mockReminderFailure = false;
    mockActivityRows = {};
    mockFuelTrendRows = [];
    mockActivityOrders = {};
    mockRpc.mockImplementation((name: string) =>
      Promise.resolve({
        data:
          name === "get_accessible_vehicle_ids"
            ? [{ vehicle_id: "vehicle-1" }]
            : [
                {
                  vehicle_id: "vehicle-1",
                  owner_id: "user-1",
                  year: 2020,
                  make: "Honda",
                  model: "Civic",
                  current_mileage: 50000,
                  is_own_vehicle: true,
                  shared_groups: [],
                },
              ],
        error: null,
      }),
    );
  });

  it("returns a reminder tied to its service log", async () => {
    const { result } = renderHook(() => useDashboardDataQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(result.current.serviceReminders).toHaveLength(1),
    );
    expect(result.current.serviceReminders[0].logId).toBe("service-1");
    expect(result.current.remindersError).toBeNull();
  });

  it("reports reminder fetch failure separately from an empty result", async () => {
    mockReminderFailure = true;
    const { result } = renderHook(() => useDashboardDataQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(result.current.remindersError).toContain("Service unavailable"),
    );
    expect(result.current.serviceReminders).toEqual([]);
  });

  it("returns only the five latest activities, including service log dates", async () => {
    const row = (id: string, date: string) => ({
      id,
      date,
      cost: 10,
      odometer_reading: 100,
      vehicles: { year: 2022, make: "Honda", model: "Civic" },
      profiles: { full_name: "Wan" },
    });
    mockActivityRows = {
      mileage_logs: [row("m1", "2026-10-06"), row("m2", "2026-10-03")],
      fuel_logs: [row("f1", "2026-10-05"), row("f2", "2026-10-02")],
      service_logs: [row("s1", "2026-10-07"), row("s2", "2026-10-01")],
    };
    const { result } = renderHook(() => useDashboardDataQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.recentActivity).toHaveLength(5));
    expect(result.current.recentActivity.map((item) => item.id)).toEqual([
      "s1",
      "m1",
      "f1",
      "m2",
      "f2",
    ]);
  });

  it("returns real monthly fuel costs for the selected Home chart range", async () => {
    const now = new Date();
    mockFuelTrendRows = [
      {
        date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-10`,
        cost: 42,
      },
    ];
    const { result } = renderHook(() => useDashboardDataQuery(12), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.fuelCostTrend).toHaveLength(12));
    expect(result.current.fuelCostTrend[11].value).toBe(42);
    expect(result.current.fuelTrendError).toBeNull();
  });

  it("orders activities on the same date by creation time", async () => {
    const row = (id: string, created_at: string) => ({
      id,
      date: "2026-10-07",
      created_at,
      cost: 10,
      odometer_reading: 100,
      vehicles: { year: 2022, make: "Honda", model: "Civic" },
      profiles: { full_name: "Wan" },
    });
    mockActivityRows = {
      mileage_logs: [row("older", "2026-10-07T08:00:00Z")],
      fuel_logs: [row("newer", "2026-10-07T12:00:00Z")],
      service_logs: [],
    };
    const { result } = renderHook(() => useDashboardDataQuery(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.recentActivity).toHaveLength(2));
    expect(result.current.recentActivity.map((item) => item.id)).toEqual([
      "newer",
      "older",
    ]);
  });

  it("requests the latest ten by date and creation time for each log type", async () => {
    const { result } = renderHook(() => useDashboardDataQuery(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockActivityOrders).toEqual({
      mileage_logs: ["date", "created_at"],
      fuel_logs: ["date", "created_at"],
      service_logs: ["date", "created_at"],
    });
  });
});
