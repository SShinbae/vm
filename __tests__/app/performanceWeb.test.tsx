import React from "react";
import { render, screen } from "@testing-library/react-native";
import PerformanceTab from "@/app/(tabs)/analytics/performance";
import type { VehiclePerformance } from "@/types/analytics";

const mockData = {
  loading: false,
  error: null as Error | null,
  vehicleComparison: [] as VehiclePerformance[],
  fuelMetrics: { totalDistance: 1000, averageConsumption: 6.2 },
  costMetrics: { costPerKm: 2.9 },
  refetch: jest.fn(),
};

jest.mock("@/hooks/useAnalytics", () => ({
  useAnalyticsData: () => mockData,
  usePeriodSelector: () => ({
    period: { label: "Last 30 days" },
    periods: [],
    setPeriod: jest.fn(),
  }),
  useVehicleFilter: () => ({
    vehicles: [],
    selectedVehicleIds: [],
    loading: false,
  }),
}));
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => ({
    isWeb: true,
    isMobile: false,
    isDesktop: true,
  }),
}));
jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (factory: any) => factory,
  useStyles: (factory?: any) => {
    const { lightTheme } = require("@/src/design-system");
    return { theme: lightTheme, styles: factory ? factory(lightTheme) : {} };
  },
}));
jest.mock("@/components/analytics", () => {
  const { Text, View } = require("react-native");
  return {
    EmptyAnalytics: ({ title }: any) => <Text>{title}</Text>,
    MetricCard: ({ title, value, subtitle }: any) => (
      <Text>
        {title}:{value}:{subtitle}
      </Text>
    ),
    VehicleFilter: ({ periodControl }: any) => (
      <View>
        <Text>Vehicle filter</Text>
        {periodControl}
      </View>
    ),
    PeriodSelector: () => <Text>Period filter</Text>,
  };
});

const vehicle = (
  vehicleName: string,
  totalCost: number,
  fuelEfficiency: number,
): VehiclePerformance => ({
  vehicleId: vehicleName,
  vehicleName,
  totalCost,
  fuelEfficiency,
  totalDistance: 500,
  costPerKm: totalCost / 500,
  serviceCount: 1,
});

beforeEach(() => {
  mockData.error = null;
  mockData.loading = false;
  mockData.vehicleComparison = [];
  mockData.fuelMetrics = { totalDistance: 1000, averageConsumption: 6.2 };
});

it("orders the comparison by cost and excludes missing efficiency from highlights", () => {
  mockData.vehicleComparison = [
    vehicle("Civic", 600, 5),
    vehicle("Vios", 300, 9),
    vehicle("No fuel readings", 2000, 0),
  ];
  render(<PerformanceTab />);
  expect(
    screen.getAllByRole("rowheader").map((row) => row.props.children),
  ).toEqual(["No fuel readings", "Civic", "Vios"]);
  expect(screen.getByText("Most Efficient:5.0 L/100km:Civic")).toBeTruthy();
  expect(screen.getByText("Least Efficient:9.0 L/100km:Vios")).toBeTruthy();
  expect(screen.getByText("Average Consumption:6.2:L/100km")).toBeTruthy();
  expect(
    screen.getByText("Cost per km:RM2.90:Across selected vehicles"),
  ).toBeTruthy();
});

it("shows unavailable metrics instead of zero efficiency or a free cost per kilometre", () => {
  mockData.vehicleComparison = [
    { ...vehicle("Civic", 250, 0), totalDistance: 0, costPerKm: 0 },
  ];
  mockData.fuelMetrics = { totalDistance: 0, averageConsumption: 0 };
  render(<PerformanceTab />);
  expect(screen.getByText("Average Consumption:—:L/100km")).toBeTruthy();
  expect(
    screen.getByText("Cost per km:—:Across selected vehicles"),
  ).toBeTruthy();
  expect(screen.getAllByText("—")).toHaveLength(2);
  expect(screen.queryByText("Efficiency Highlights")).toBeNull();
});

it.each(["empty", "error", "loading"])(
  "keeps filters available in the %s state",
  (state) => {
    mockData.error = state === "error" ? new Error("Unavailable") : null;
    mockData.loading = state === "loading";
    render(<PerformanceTab />);
    expect(screen.getByText("Vehicle filter")).toBeTruthy();
    expect(screen.getByText("Period filter")).toBeTruthy();
    expect(
      screen.getByText(
        state === "loading"
          ? "Loading performance data..."
          : state === "error"
            ? "Error Loading Data"
            : "No Vehicle Data",
      ),
    ).toBeTruthy();
  },
);
