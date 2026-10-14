import { renderHook, waitFor } from "@testing-library/react-native";
import { generateTrendData } from "@/lib/analytics/calculations";
import { useAnalyticsTrends } from "@/hooks/useAnalytics";

const mockGenerateTrendData = jest.fn(
  async (...args: Parameters<typeof generateTrendData>) =>
    generateTrendData(...args),
);

jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));
jest.mock("@/hooks/useAnalyticsWorker", () => ({
  useAnalyticsWorker: () => ({
    isReady: true,
    generateTrendDataAsync: mockGenerateTrendData,
  }),
}));
jest.mock("@/lib/supabase/analytics-queries", () => ({
  fetchAnalyticsData: jest.fn(async () => ({
    fuelLogs: [{ date: "2026-10-05", cost: 999 }],
    serviceLogs: [
      { date: "2026-10-06", cost: 245 },
      { date: "2026-10-08", cost: 20 },
      { date: "2026-09-06", cost: 500 },
    ],
  })),
}));

const filters = {
  vehicleIds: [],
  period: {
    label: "October",
    days: 31,
    startDate: new Date("2026-10-01"),
    endDate: new Date("2026-10-31"),
  },
};

it.each([
  ["service_cost", 265],
  ["service", 2],
] as const)(
  "%s excludes fuel and out-of-period logs",
  async (metric, expected) => {
    const { result } = renderHook(() => useAnalyticsTrends(filters, metric));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.trendData).toHaveLength(1);
    expect(result.current.trendData[0].value).toBe(expected);
  },
);
