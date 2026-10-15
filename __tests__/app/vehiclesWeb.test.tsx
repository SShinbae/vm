import { router } from "expo-router";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import VehiclesScreen from "@/app/(tabs)/vehicles";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

const mockLayout = { isWeb: true, isMobile: false, isDesktop: true };
const mockClearSearch = jest.fn();
const mockSetFilter = jest.fn();
let mockMatches = true;
jest.mock("@/components/vehicles/VehicleDetailsBottomSheet", () => ({
  VehicleDetailsBottomSheet: () => null,
}));
jest.mock("react-native-gesture-handler", () => ({
  GestureHandlerRootView: ({ children }: any) => {
    const { View } = require("react-native");
    return <View>{children}</View>;
  },
}));
const mockVehicles = [
  { id: "owned", is_own_vehicle: true, shared_groups: [{ id: "group-1" }] },
  { id: "shared", is_own_vehicle: false, shared_groups: [] },
];
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => mockLayout,
}));
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock("@/hooks/useVehicles", () => ({
  useVehicles: () => ({
    allVehicles: mockVehicles,
    loading: false,
    refreshing: false,
    onRefresh: jest.fn(),
  }),
}));
jest.mock("@/hooks/useVehicleStats", () => ({ useVehicleStats: () => ({}) }));
jest.mock("@/hooks/useVehicleFilters", () => ({
  useVehicleFilters: () => ({
    searchQuery: "",
    setSearchQuery: mockClearSearch,
    activeFilter: "all",
    setActiveFilter: mockSetFilter,
    filteredVehicles: mockMatches ? mockVehicles : [],
    filterLabel: "All Vehicles",
  }),
}));
jest.mock("@/components/vehicles/VehicleStatsGrid", () => ({
  VehicleStatsGrid: () => null,
}));
jest.mock("@/components/vehicles/VehicleSearchBar", () => ({
  VehicleSearchBar: () => null,
}));
jest.mock("@/components/vehicles/VehicleFilters", () => ({
  VehicleFilters: () => null,
}));
jest.mock("@/components/dashboard/VehicleTable", () => ({
  VehicleTable: ({ vehicles, onView }: any) => {
    const { Text, Button } = require("react-native");
    return (
      <>
        <Button title="Open owned vehicle" onPress={() => onView("owned")} />
        <Text>
          {vehicles
            .map(
              (vehicle: any) =>
                `${vehicle.id}:${vehicle.isSharedWithMe}:${vehicle.shareCount}`,
            )
            .join(",")}
        </Text>
      </>
    );
  },
}));
jest.mock("@/components/vehicles/VehicleList", () => ({
  VehicleList: () => {
    const { Text } = require("react-native");
    return <Text>Vehicle cards</Text>;
  },
}));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));

beforeEach(() => {
  mockLayout.isWeb = true;
  mockLayout.isMobile = false;
  mockMatches = true;
  jest.clearAllMocks();
});

it("shows the full desktop table with sharing metadata adapted from the vehicle loader", () => {
  render(<VehiclesScreen />);
  expect(screen.getByText("owned:false:1,shared:true:0")).toBeTruthy();
  expect(screen.queryByText("Vehicle cards")).toBeNull();
  expect(screen.getByText("Add Vehicle")).toBeTruthy();
});

it("keeps the existing card list on mobile web", () => {
  mockLayout.isMobile = true;
  render(<VehiclesScreen />);
  expect(screen.getByText("Vehicle cards")).toBeTruthy();
  expect(screen.queryByText("owned:false:1,shared:true:0")).toBeNull();
});

it("allows clearing filters when accessible vehicles have no matches", () => {
  mockMatches = false;
  render(<VehiclesScreen />);
  expect(screen.getByText("No matching vehicles")).toBeTruthy();
  fireEvent.press(screen.getByText("Clear filters"));
  expect(mockClearSearch).toHaveBeenCalledWith("");
  expect(mockSetFilter).toHaveBeenCalledWith("all");
});

it("preserves the Vehicles list origin when opening a table row", () => {
  render(<VehiclesScreen />);
  fireEvent.press(screen.getByText("Open owned vehicle"));
  expect(router.push).toHaveBeenCalledWith({
    pathname: "/vehicles/[id]",
    params: { id: "owned", returnTo: "vehicles" },
  });
});
