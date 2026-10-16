import React from "react";
import { View, StyleSheet } from "react-native";
import { render, screen, within } from "@testing-library/react-native";
import Performance from "@/app/(tabs)/analytics/performance";

let mockWeb = false;
let mockMobile = true;
let mockDimensions = { width: 390, height: 844, fontScale: 1, scale: 1 };
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => mockDimensions,
}));
jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (f: any) => f,
  useStyles: (f?: any) => {
    const { lightTheme } = require("@/src/design-system");
    return { theme: lightTheme, styles: f ? f(lightTheme) : {} };
  },
}));
jest.mock("@react-navigation/native", () => ({ useFocusEffect: jest.fn() }));
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => ({
    isWeb: mockWeb,
    isMobile: mockMobile,
    isTablet: false,
  }),
}));
const mockPeriod = {
  label: "30 Days",
  days: 30,
  startDate: new Date(2026, 8, 1),
  endDate: new Date(2026, 9, 1),
};
const vehicles = [
  {
    vehicleId: "low",
    vehicleName: "2020 Perodua Myvi",
    totalDistance: 600,
    fuelEfficiency: 6.2,
    totalCost: 166.05,
    costPerKm: 0.28,
    serviceCount: 0,
  },
  {
    vehicleId: "high",
    vehicleName: "2022 Honda Civic",
    totalDistance: 5800,
    fuelEfficiency: 5,
    totalCost: 3071.77,
    costPerKm: 0.53,
    serviceCount: 3,
  },
];
let mockComparison = vehicles;
let mockFuel: any = { totalDistance: 11200, averageConsumption: 6 };
let mockCost: any = { costPerKm: 0.33 };
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
    refetch: jest.fn(),
  }),
  useAnalyticsData: () => ({
    loading: false,
    error: null,
    vehicleComparison: mockComparison,
    fuelMetrics: mockFuel,
    costMetrics: mockCost,
    refetch: jest.fn(),
  }),
}));
beforeEach(() => {
  mockWeb = false;
  mockMobile = true;
  mockDimensions = { width: 390, height: 844, fontScale: 1, scale: 1 };
  mockComparison = vehicles;
  mockFuel = { totalDistance: 11200, averageConsumption: 6 };
  mockCost = { costPerKm: 0.33 };
});
it.each([false, true])(
  "shows the web-aligned overall metrics and compact comparison on mobile web=%s",
  (isWeb) => {
    mockWeb = isWeb;
    render(<Performance />);
    expect(screen.getByText("Total Distance")).toBeTruthy();
    expect(screen.getByText("11,200 km")).toBeTruthy();
    expect(screen.getByText("Average Consumption")).toBeTruthy();
    expect(screen.getByText("6.0")).toBeTruthy();
    expect(screen.getByText("RM0.33")).toBeTruthy();
    expect(screen.getByText("Highest total cost first · 30 Days")).toBeTruthy();
    expect(screen.queryByText("Highlights")).toBeNull();
    expect(screen.queryByText("Most Efficient")).toBeNull();
    expect(screen.queryByText("Cost Breakdown")).toBeNull();
    expect(screen.queryByText("#1")).toBeNull();
    const cards = screen.getAllByTestId(/^performance-vehicle-/);
    expect(cards.map((card) => card.props.testID)).toEqual([
      "performance-vehicle-high",
      "performance-vehicle-low",
    ]);
    const civic = within(cards[0]);
    for (const text of [
      "2022 Honda Civic",
      "Total Cost",
      "RM3071.77",
      "Distance (km)",
      "5,800",
      "Fuel (L/100km)",
      "5.0",
      "Cost per km",
      "RM0.53",
      "Services",
      "3",
    ]) {
      expect(civic.getByText(text)).toBeTruthy();
    }
    expect(within(cards[1]).getByText("0")).toBeTruthy();
  },
);
it("shows unavailable metrics as dashes while retaining real zeros", () => {
  mockComparison = [
    {
      ...vehicles[0],
      totalDistance: 0,
      fuelEfficiency: 0,
      totalCost: 0,
      costPerKm: 0,
      serviceCount: 0,
    },
  ];
  mockFuel = { totalDistance: 0, averageConsumption: 0 };
  mockCost = { costPerKm: 0 };
  render(<Performance />);
  const card = within(screen.getByTestId("performance-vehicle-low"));
  expect(card.getAllByText("—")).toHaveLength(2);
  expect(card.getByText("RM0.00")).toBeTruthy();
  expect(card.getAllByText("0")).toHaveLength(2);
  expect(screen.getAllByText("—")).toHaveLength(4);
  expect(
    screen.getByText(/Lower L\/100km means better fuel efficiency/),
  ).toBeTruthy();
});
it.each([
  { width: 320, fontScale: 1 },
  { width: 390, fontScale: 1.4 },
])("keeps long names and large amounts readable at %o", (dimensions) => {
  mockDimensions = { ...mockDimensions, ...dimensions };
  const name = "2022 Honda Civic Extended Vehicle Name With A Long Description";
  mockComparison = [
    { ...vehicles[0], vehicleName: name, totalCost: 12345678.9 },
  ];
  render(<Performance />);
  const card = screen.getByTestId("performance-vehicle-low");
  expect(within(card).getByText(name).props.numberOfLines).toBeUndefined();
  expect(
    within(card).getByText("RM12345678.90").props.numberOfLines,
  ).toBeUndefined();
  expect(
    screen.queryAllByRole("button", { name: /expand|show more/i }),
  ).toHaveLength(0);
  for (const view of screen.UNSAFE_getAllByType(View)) {
    expect(StyleSheet.flatten(view.props.style)?.width).not.toBe("NaN%");
  }
});
it("keeps the desktop comparison table and efficiency highlights", () => {
  mockWeb = true;
  mockMobile = false;
  render(<Performance />);
  expect(screen.getByLabelText("Vehicle performance comparison")).toBeTruthy();
  expect(
    screen.getByLabelText("Vehicle performance comparison").props.role,
  ).toBe("table");
  expect(screen.getByText("Efficiency Highlights")).toBeTruthy();
  expect(screen.queryAllByTestId(/^performance-vehicle-/)).toHaveLength(0);
});
