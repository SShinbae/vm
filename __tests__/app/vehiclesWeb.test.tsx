import { router } from "expo-router";
import React from "react";
import { act, render, screen, fireEvent } from "@testing-library/react-native";
import { Keyboard, Platform, ScrollView, Text } from "react-native";
import VehiclesScreen from "@/app/(tabs)/vehicles";
import { VehicleList } from "@/components/vehicles/VehicleList";

jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (factory: any) => factory,
  useStyles: (factory?: any) => {
    const { lightTheme } = require("@/src/design-system");
    return { theme: lightTheme, styles: factory ? factory(lightTheme) : {} };
  },
}));

jest.mock("@react-navigation/native", () => ({ useFocusEffect: () => {} }));

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

const mockLayout = { isWeb: true, isMobile: false, isDesktop: true };
const mockClearSearch = jest.fn();
const mockSetFilter = jest.fn();
let mockMatches = true;
let mockLoadError: string | null = null;
const mockRefresh = jest.fn();
const mockExpand = jest.fn();
let mockClosePreview: () => void;
jest.mock("@/components/vehicles/VehicleDetailsBottomSheet", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    VehicleDetailsBottomSheet: React.forwardRef(function Preview(
      { vehicle, onClose }: any,
      ref: any,
    ) {
      React.useImperativeHandle(ref, () => ({
        expand: mockExpand,
        close: jest.fn(),
      }));
      mockClosePreview = onClose;
      return vehicle ? <Text>Preview {vehicle.id}</Text> : null;
    }),
  };
});
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
    error: mockLoadError,
    onRefresh: mockRefresh,
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
  VehicleStatsGrid: () => {
    const { Text } = require("react-native");
    return <Text>Overview metrics</Text>;
  },
}));
jest.mock("@/components/vehicles/VehicleSearchBar", () => ({
  VehicleSearchBar: () => {
    const { Text } = require("react-native");
    return <Text>Vehicle search</Text>;
  },
}));
jest.mock("@/components/vehicles/VehicleFilters", () => ({
  VehicleFilters: () => {
    const { Text } = require("react-native");
    return <Text>Vehicle filters</Text>;
  },
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
  VehicleList: ({ vehicles, onClearFilters }: any) => {
    const { Text } = require("react-native");
    return vehicles.length ? (
      <Text>Vehicle cards</Text>
    ) : onClearFilters ? (
      <Text onPress={onClearFilters}>Clear filters</Text>
    ) : (
      <Text>Empty garage</Text>
    );
  },
}));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));

beforeEach(() => {
  mockLayout.isWeb = true;
  mockLayout.isMobile = false;
  mockMatches = true;
  mockLoadError = null;
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

it("keeps a newly selected native preview when an earlier close timer expires", () => {
  jest.useFakeTimers();
  mockLayout.isWeb = false;
  mockLayout.isMobile = true;
  const dismiss = jest.spyOn(Keyboard, "dismiss");
  render(<VehiclesScreen />);
  act(() =>
    screen.UNSAFE_getByType(VehicleList).props.onVehiclePress(mockVehicles[0]),
  );
  expect(screen.getByText("Preview owned")).toBeTruthy();
  act(() => {
    mockClosePreview();
    jest.advanceTimersByTime(150);
  });
  act(() =>
    screen.UNSAFE_getByType(VehicleList).props.onVehiclePress(mockVehicles[1]),
  );
  act(() => jest.advanceTimersByTime(300));
  expect(screen.getByText("Preview shared")).toBeTruthy();
  expect(mockExpand).toHaveBeenCalledTimes(2);
  expect(dismiss).toHaveBeenCalledTimes(2);
  expect(router.push).not.toHaveBeenCalled();
});

it("opens mobile web cards directly and dismisses the keyboard", () => {
  jest.replaceProperty(Platform, "OS", "web");
  mockLayout.isMobile = true;
  const dismiss = jest.spyOn(Keyboard, "dismiss");
  render(<VehiclesScreen />);
  act(() =>
    screen.UNSAFE_getByType(VehicleList).props.onVehiclePress(mockVehicles[0]),
  );
  expect(router.push).toHaveBeenCalledWith({
    pathname: "/vehicles/[id]",
    params: { id: "owned", returnTo: "vehicles" },
  });
  expect(dismiss).toHaveBeenCalled();
});

it("puts search and wrapped filters before mobile overview and removes the floating add control", () => {
  mockLayout.isMobile = true;
  render(<VehiclesScreen />);
  const scroll = screen.UNSAFE_getByType(ScrollView);
  const texts = scroll
    .findAllByType(Text)
    .map((node: { props: { children: unknown } }) => node.props.children)
    .flat();
  expect(texts.indexOf("Vehicle search")).toBeLessThan(
    texts.indexOf("Overview metrics"),
  );
  expect(texts.indexOf("Vehicle filters")).toBeLessThan(
    texts.indexOf("Overview metrics"),
  );
  expect(screen.getAllByText("Add Vehicle")).toHaveLength(1);
});

it("offers Clear filters instead of an empty garage on mobile no-match results", () => {
  mockLayout.isMobile = true;
  mockMatches = false;
  render(<VehiclesScreen />);
  expect(screen.queryByText("Empty garage")).toBeNull();
  fireEvent.press(screen.getByText("Clear filters"));
  expect(mockSetFilter).toHaveBeenCalledWith("all");
});

it("shows a retryable error while keeping cached cards visible", () => {
  mockLayout.isMobile = true;
  mockLoadError = "Failed to load vehicles";
  render(<VehiclesScreen />);
  expect(screen.getByText("Failed to load vehicles")).toBeTruthy();
  expect(screen.getByText("Vehicle cards")).toBeTruthy();
  fireEvent.press(screen.getByText("Retry"));
  expect(mockRefresh).toHaveBeenCalled();
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
