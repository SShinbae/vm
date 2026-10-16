import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import Overview from "@/app/(tabs)/analytics/index";
import Costs from "@/app/(tabs)/analytics/costs";
import Fuel from "@/app/(tabs)/analytics/fuel";
import Service from "@/app/(tabs)/analytics/service";
import Performance from "@/app/(tabs)/analytics/performance";
jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (f: any) => f,
  useStyles: (f?: any) => {
    const { lightTheme } = require("@/src/design-system");
    return { theme: lightTheme, styles: f ? f(lightTheme) : {} };
  },
}));
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => true);
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: mockReplace,
    canGoBack: mockCanGoBack,
  }),
}));
jest.mock("@react-navigation/native", () => ({ useFocusEffect: jest.fn() }));
jest.mock("@/components/analytics/LazyChartComponents", () => ({
  LazyCostLineChart: ({ title }: any) => {
    const { Text } = require("react-native");
    return <Text>{title}</Text>;
  },
  LazyTrendLineChart: () => null,
}));
let mockWeb = false;
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => ({
    isWeb: mockWeb,
    isMobile: true,
    isTablet: false,
  }),
}));
let mockHasData = false;
let mockLoading = false;
let mockError: Error | null = null;
const mockRefetch = jest.fn();
const mockVehicleRetry = jest.fn();
const mockPeriod = {
  label: "30 Days",
  days: 30,
  startDate: new Date(2026, 8, 1),
  endDate: new Date(2026, 9, 1),
};
jest.mock("@/hooks/useAnalytics", () => ({
  usePeriodSelector: () => ({
    period: mockPeriod,
    periods: [mockPeriod],
    setPeriod: jest.fn(),
  }),
  useVehicleFilter: () => ({
    vehicles: [],
    selectedVehicleIds: [],
    toggleVehicle: jest.fn(),
    selectAll: jest.fn(),
    clearAll: jest.fn(),
    loading: false,
    error: null,
    refetch: mockVehicleRetry,
  }),
  useAnalyticsData: () => ({
    loading: mockLoading,
    error: mockError,
    costMetrics: mockHasData
      ? {
          totalCost: 120,
          totalFuelCost: 100,
          totalServiceCost: 20,
          costPerKm: 0.4,
          averageFuelCost: 50,
          averageServiceCost: 20,
        }
      : null,
    fuelMetrics: mockHasData
      ? {
          fuelUps: 2,
          averageConsumption: 6,
          totalDistance: 300,
          totalLitersFilled: 18,
          averageFuelPrice: 2.05,
          bestEfficiency: 5.5,
          worstEfficiency: 6.5,
        }
      : null,
    serviceMetrics: mockHasData
      ? {
          totalServices: 1,
          upcomingServices: [],
          servicesByType: {},
          costByServiceType: {},
          averageServiceInterval: 5000,
        }
      : null,
    vehicleComparison: mockHasData
      ? [
          {
            vehicleId: "a",
            vehicleName: "Civic",
            fuelEfficiency: 0,
            totalCost: 0,
            costPerKm: 0,
            totalDistance: 100,
            serviceCount: 0,
          },
          {
            vehicleId: "b",
            vehicleName: "Myvi",
            fuelEfficiency: 0,
            totalCost: 0,
            costPerKm: 0,
            totalDistance: 200,
            serviceCount: 0,
          },
        ]
      : [],
    chartDataset: null,
    refetch: mockRefetch,
  }),
  useCostChartData: () => ({
    loading: false,
    error: null,
    chartDataset: null,
    refetch: mockRefetch,
  }),
  useAnalyticsTrends: () => ({
    loading: false,
    error: null,
    trendData: [],
    refetch: mockRefetch,
  }),
}));
beforeEach(() => {
  mockWeb = false;
  mockHasData = false;
  mockLoading = false;
  mockCanGoBack.mockReturnValue(true);
  mockError = null;
  jest.clearAllMocks();
});
describe.each([
  ["Overview", Overview],
  ["Costs", Costs],
  ["Fuel", Fuel],
  ["Service", Service],
  ["Performance", Performance],
] as const)("%s compact state", (_, Page) => {
  it("keeps period and vehicle controls available while loading", () => {
    mockLoading = true;
    render(<Page />);
    expect(
      screen.getByRole("button", { name: "Select analytics period" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Filter analytics by vehicle" }),
    ).toBeTruthy();
    expect(screen.getByText("Loading analytics…")).toBeTruthy();
  });
  it("offers Retry for data errors", () => {
    mockError = new Error("Offline");
    render(<Page />);
    expect(screen.queryByText("No Data Available")).toBeNull();
    fireEvent.press(screen.getByText("Retry analytics"));
    expect(mockRefetch).toHaveBeenCalled();
    expect(mockVehicleRetry).toHaveBeenCalled();
  });
  it("keeps filtering available in mobile-web empty states", () => {
    mockWeb = true;
    render(<Page />);
    expect(
      screen.getByRole("button", { name: "Select analytics period" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Filter analytics by vehicle" }),
    ).toBeTruthy();
    expect(screen.getByText("No Data Available")).toBeTruthy();
  });
});

it.each([false, true])(
  "shows a short summary with all four report links on web=%s",
  (isWeb) => {
    mockWeb = isWeb;
    mockHasData = true;
    render(<Overview />);
    expect(screen.getAllByRole("header", { name: "Analytics" })).toHaveLength(
      1,
    );
    expect(screen.queryByText("Quick Stats")).toBeNull();
    expect(screen.queryByText("Cost Breakdown")).toBeNull();
    for (const name of [
      "View cost report",
      "View fuel report",
      "View service report",
      "View performance report",
    ]) {
      expect(screen.getByRole("button", { name })).toBeTruthy();
    }
  },
);

it("keeps detailed reports accessible when the summary has no data", () => {
  render(<Overview />);
  for (const name of [
    "View cost report",
    "View fuel report",
    "View service report",
    "View performance report",
  ]) {
    expect(screen.getByRole("button", { name })).toBeTruthy();
  }
});

it.each([
  ["View cost report", "/analytics/costs"],
  ["View fuel report", "/analytics/fuel"],
  ["View service report", "/analytics/service"],
  ["View performance report", "/analytics/performance"],
])("opens %s directly", (label, path) => {
  render(<Overview />);
  fireEvent.press(screen.getByRole("button", { name: label }));
  expect(mockPush).toHaveBeenCalledWith(path);
});
it.each([
  ["Cost Analytics", Costs],
  ["Fuel Analytics", Fuel],
  ["Service Analytics", Service],
  ["Performance", Performance],
] as const)(
  "renders loaded %s with one header/filter row and normal Back",
  (title, Page) => {
    mockHasData = true;
    render(<Page />);
    expect(screen.getAllByRole("header", { name: title })).toHaveLength(1);
    expect(
      screen.getAllByRole("button", { name: "Select analytics period" }),
    ).toHaveLength(1);
    expect(
      screen.getAllByRole("button", { name: "Filter analytics by vehicle" }),
    ).toHaveLength(1);
    fireEvent.press(screen.getByRole("button", { name: "Back" }));
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  },
);
it("returns a directly opened report to the summary when no previous screen exists", () => {
  mockCanGoBack.mockReturnValue(false);
  render(<Fuel />);
  fireEvent.press(screen.getByRole("button", { name: "Back" }));
  expect(mockReplace).toHaveBeenCalledWith("/analytics");
  expect(mockBack).not.toHaveBeenCalled();
});

it("does not invent efficiency rankings or invalid spending bars for vehicles with no fuel efficiency/cost", () => {
  mockHasData = true;
  render(<Performance />);
  expect(screen.queryByText("Most Efficient")).toBeNull();
  for (const view of screen.UNSAFE_getAllByType(View)) {
    expect(StyleSheet.flatten(view.props.style)?.width).not.toBe("NaN%");
  }
});

it("keeps the summary ScrollView mounted through filter refresh, failure and empty states", () => {
  mockHasData = true;
  const { rerender } = render(<Overview />);
  const scroll = screen.UNSAFE_getByType(ScrollView);
  fireEvent(screen.getByTestId("analytics-summary-content"), "layout", {
    nativeEvent: { layout: { width: 358, height: 900 } },
  });
  mockLoading = true;
  rerender(<Overview />);
  expect(screen.UNSAFE_getByType(ScrollView)).toBe(scroll);
  expect(
    StyleSheet.flatten(
      screen.getByTestId("analytics-summary-content").props.style,
    ).minHeight,
  ).toBe(900);
  mockLoading = false;
  mockError = new Error("Offline");
  rerender(<Overview />);
  expect(screen.UNSAFE_getByType(ScrollView)).toBe(scroll);
  mockError = null;
  mockHasData = false;
  rerender(<Overview />);
  expect(screen.UNSAFE_getByType(ScrollView)).toBe(scroll);
});
it("renders no raw text children outside Text in the native Costs report", () => {
  mockHasData = true;
  render(<Costs />);
  const visit = (node: any, inText = false) => {
    if (node == null) return;
    if (Array.isArray(node)) {
      node.forEach((child) => visit(child, inText));
      return;
    }
    if (typeof node === "string") {
      expect(inText).toBe(true);
      return;
    }
    visit(
      node.children,
      inText || node.type === "Text" || node.type === "RCTText",
    );
  };
  visit(screen.toJSON());
});
