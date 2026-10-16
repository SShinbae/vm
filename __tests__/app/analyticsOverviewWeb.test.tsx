import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import OverviewTab from "@/app/(tabs)/analytics/index";
import { useAnalyticsData } from "@/hooks/useAnalytics";
jest.mock("@react-navigation/native", () => ({ useFocusEffect: jest.fn() }));

jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (factory: any) => factory,
  useStyles: (factory?: any) => {
    const { lightTheme } = require("@/src/design-system");
    return { theme: lightTheme, styles: factory ? factory(lightTheme) : {} };
  },
}));

let mockLayout = { isWeb: true, isMobile: false, isTablet: false };
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => mockLayout,
}));

const mockPeriod = {
  label: "30 Days",
  days: 30,
  startDate: new Date("2026-09-01"),
  endDate: new Date("2026-10-01"),
};
const mockPeriods = [mockPeriod];
const mockVehicleFilter = {
  vehicles: [],
  selectedVehicleIds: [] as string[],
  toggleVehicle: jest.fn(),
  selectAll: jest.fn(),
  clearAll: jest.fn(),
  loading: false,
};
jest.mock("@/hooks/useAnalytics", () => ({
  useAnalyticsData: jest.fn(),
  usePeriodSelector: () => ({
    period: mockPeriod,
    setPeriod: jest.fn(),
    periods: mockPeriods,
  }),
  useVehicleFilter: () => mockVehicleFilter,
}));

const metrics = (total: number) => ({
  loading: false,
  error: null,
  costMetrics: {
    totalCost: total,
    totalFuelCost: total,
    totalServiceCost: 0,
    costPerKm: 1,
    averageFuelCost: 0,
    averageServiceCost: 0,
  },
  fuelMetrics: { fuelUps: 1, averageConsumption: 8, totalDistance: 100 },
  serviceMetrics: { totalServices: 0, upcomingServices: [] },
  chartDataset: null,
  refetch: jest.fn(),
});

const mockUseAnalyticsData = useAnalyticsData as jest.Mock;

beforeEach(() => {
  mockLayout = { isWeb: true, isMobile: false, isTablet: false };
  // Current period first, previous period second (same call order as the page).
  mockUseAnalyticsData.mockReset();
  mockUseAnalyticsData.mockImplementation((filters, enabled = true) =>
    enabled
      ? metrics(filters.period.label.startsWith("Previous") ? 100 : 150)
      : {
          ...metrics(0),
          costMetrics: null,
          fuelMetrics: null,
          serviceMetrics: null,
        },
  );
});

const previousEnabledFlags = () =>
  mockUseAnalyticsData.mock.calls
    .filter(([filters]) => filters.period.label.startsWith("Previous"))
    .map(([, enabled]) => enabled);

it("compare is off by default: previous hook disabled, no badges", () => {
  render(<OverviewTab />);
  expect(previousEnabledFlags().every((e) => e === false)).toBe(true);
  expect(screen.queryByLabelText(/vs previous period/)).toBeNull();
});

it("turning compare on enables the previous hook and shows deltas; off removes them", () => {
  render(<OverviewTab />);
  const toggle = screen.getByLabelText("Compare with previous period");

  fireEvent(toggle, "valueChange", true);
  expect(previousEnabledFlags().at(-1)).toBe(true);
  expect(
    screen.getAllByLabelText(/Up 50% vs previous period/).length,
  ).toBeGreaterThan(0);

  fireEvent(toggle, "valueChange", false);
  expect(previousEnabledFlags().at(-1)).toBe(false);
  expect(screen.queryByLabelText(/vs previous period/)).toBeNull();
});

it("mobile layout: no toggle and previous hook never enabled", () => {
  mockLayout = { isWeb: false, isMobile: true, isTablet: false };
  render(<OverviewTab />);
  expect(screen.queryByLabelText("Compare with previous period")).toBeNull();
  expect(previousEnabledFlags().every((e) => e === false)).toBe(true);
});
