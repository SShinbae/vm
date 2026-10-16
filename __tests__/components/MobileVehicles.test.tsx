import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Modal, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import BottomSheet from "@gorhom/bottom-sheet";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { VehicleList } from "@/components/vehicles/VehicleList";
import { VehicleDetailsBottomSheet } from "@/components/vehicles/VehicleDetailsBottomSheet";
import { VehicleStatsGrid } from "@/components/vehicles/VehicleStatsGrid";
import { ResponsiveGrid } from "@/components/layout/ResponsiveGrid";
import { VehicleFilters } from "@/components/vehicles/VehicleFilters";
const mockLayout = { isWeb: false, isMobile: true, isDesktop: false };
let mockDimensions = { width: 390, height: 844, fontScale: 1, scale: 1 };
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => mockDimensions,
}));
jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => true }));
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => mockLayout,
}));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
jest.mock("react-native-gesture-handler", () => ({
  GestureHandlerRootView: require("react-native").View,
}));
jest.mock("@gorhom/bottom-sheet", () => {
  const React = require("react");
  const { View, ScrollView } = require("react-native");
  return {
    __esModule: true,
    default: React.forwardRef(function MockBottomSheet(
      { children, ...props }: any,
      _ref: any,
    ) {
      return <View {...props}>{children}</View>;
    }),
    BottomSheetScrollView: ScrollView,
    BottomSheetBackdrop: () => null,
  };
});
jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (factory: any) => factory,
  useStyles: (factory?: any) => {
    const { lightTheme } = require("@/src/design-system");
    return {
      theme: lightTheme,
      styles: factory ? factory(lightTheme) : {},
      breakpoint: "xs",
    };
  },
}));
const car = {
  id: "car",
  year: 2022,
  make: "Honda",
  model: "Civic with a very long name",
  license_plate: "ABC1234",
  current_mileage: 0,
  main_image_url: "https://example.test/car.jpg",
  is_own_vehicle: true,
  sharing_info: { is_shared: false },
  logs: {},
} as any;
beforeEach(() => {
  jest.clearAllMocks();
  mockLayout.isWeb = false;
  mockLayout.isMobile = true;
  mockDimensions = { width: 390, height: 844, fontScale: 1, scale: 1 };
});
it.each(["ios", "android", "web"])(
  "shows compact sharing details and wrapping cards on %s",
  (os) => {
    mockLayout.isWeb = os === "web";
    const onPress = jest.fn();
    render(
      <VehicleCard
        vehicle={{ ...car, is_own_vehicle: false }}
        onPress={onPress}
      />,
    );
    expect(
      screen.getByText("2022 Honda Civic with a very long name").props
        .numberOfLines,
    ).toBeUndefined();
    expect(screen.getByText("Shared with me")).toBeTruthy();
    expect(screen.getByText("0 km")).toBeTruthy();
    fireEvent.press(
      screen.getByRole("button", {
        name: "View details for 2022 Honda Civic with a very long name",
      }),
    );
    expect(onPress).toHaveBeenCalledTimes(1);
  },
);
it("distinguishes an empty garage from no filter matches", () => {
  const clear = jest.fn();
  const view = render(
    <VehicleList
      vehicles={[]}
      filterLabel="My Vehicles"
      onVehiclePress={jest.fn()}
      onClearFilters={clear}
    />,
  );
  expect(screen.getByText("No matching vehicles")).toBeTruthy();
  fireEvent.press(screen.getByLabelText("Clear filters"));
  expect(clear).toHaveBeenCalled();
  view.rerender(
    <VehicleList
      vehicles={[]}
      filterLabel="All Vehicles"
      onVehiclePress={jest.fn()}
    />,
  );
  expect(screen.getByText("No Vehicles Yet")).toBeTruthy();
});
it.each([
  [320, 1, 1],
  [360, 1, 2],
  [390, 1.3, 1],
  [844, 1, 2],
])(
  "uses compact overview columns at width %s and font scale %s",
  (width, fontScale, expected) => {
    mockDimensions = { ...mockDimensions, width, fontScale };
    render(
      <VehicleStatsGrid
        stats={{
          totalVehicles: 5,
          avgMileage: 44000,
          monthlyFuelCost: 300,
          upcomingServices: 0,
        }}
      />,
    );
    expect(screen.UNSAFE_getByType(ResponsiveGrid).props.columns.mobile).toBe(
      expected,
    );
  },
);
it("retains wrapped filters with selected states and accessible targets", () => {
  render(<VehicleFilters activeFilter="all" onFilterChange={jest.fn()} />);
  expect(
    screen.getByRole("button", { name: "All Vehicles" }).props
      .accessibilityState.selected,
  ).toBe(true);
  expect(
    StyleSheet.flatten(
      screen.getByRole("button", { name: "Shared" }).props.style,
    ).minHeight,
  ).toBe(48);
});
it("offers View Details from the preview and keeps its source-aware destination", () => {
  const close = jest.fn();
  render(<VehicleDetailsBottomSheet vehicle={car} onClose={close} />);
  expect(screen.queryByText("Share")).toBeNull();
  fireEvent.press(screen.getByText("View Details"));
  expect(close).toHaveBeenCalled();
  expect(router.push).toHaveBeenCalledWith({
    pathname: "/vehicles/[id]",
    params: { id: "car", returnTo: "vehicles" },
  });
  expect(screen.UNSAFE_getByType(BottomSheet).props.onClose).toBe(close);
});
it("falls back when a preview image fails", () => {
  render(<VehicleDetailsBottomSheet vehicle={car} onClose={jest.fn()} />);
  act(() => screen.UNSAFE_getByType(Image).props.onError());
  expect(screen.UNSAFE_queryByType(Image)).toBeNull();
  expect(screen.getByLabelText("Vehicle image unavailable")).toBeTruthy();
});
it("presents the vehicle sheet above navigation and handles Android Back", () => {
  const close = jest.fn();
  const view = render(
    <VehicleDetailsBottomSheet vehicle={car} onClose={close} />,
  );
  const modal = screen.UNSAFE_getByType(Modal);
  expect(modal.props.visible).toBe(true);
  expect(modal.props.transparent).toBe(true);
  expect(modal.props.presentationStyle).toBe("overFullScreen");
  const sheet = screen.UNSAFE_getByType(BottomSheet);
  expect(sheet.props.index).toBe(1);
  expect(sheet.props.enableDynamicSizing).toBe(false);
  expect(sheet.props.enablePanDownToClose).toBe(true);
  expect(sheet.props.bottomInset).toBeUndefined();
  fireEvent(modal, "requestClose");
  expect(close).toHaveBeenCalledTimes(1);
  view.rerender(<VehicleDetailsBottomSheet vehicle={null} onClose={close} />);
  expect(screen.UNSAFE_getByType(Modal).props.visible).toBe(false);
});
