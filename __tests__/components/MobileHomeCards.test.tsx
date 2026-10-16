import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Platform, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { QuickActionButton } from "@/components/dashboard/QuickActionButton";
import { VehicleCard } from "@/components/dashboard/VehicleCard";
import { NotificationBell } from "@/components/ui/NotificationBell";
let mockMobileWeb = false;
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => ({ isMobile: mockMobileWeb }),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("@/lib/contexts/NotificationContext", () => ({
  useNotifications: () => ({ unreadCount: 133 }),
}));
jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (factory: any) => factory,
  useStyles: (factory?: any) => {
    const { lightTheme } = require("@/src/design-system");
    return { theme: lightTheme, styles: factory ? factory(lightTheme) : {} };
  },
}));
const vehicle = {
  id: "car",
  year: 2022,
  make: "Honda",
  model: "Civic with a longer vehicle name",
  main_image_url: "https://example.test/car.jpg",
  license_plate: "ABC1234",
  current_mileage: 44000,
  isSharedWithMe: true,
  ownerName: "A long owner name",
  shareCount: 1,
} as any;
afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  mockMobileWeb = false;
});
it.each(["ios", "android", "web"])(
  "allows compact action labels to wrap on %s",
  (os) => {
    jest.replaceProperty(Platform, "OS", os as any);
    mockMobileWeb = os === "web";
    const onPress = jest.fn();
    render(
      <QuickActionButton
        title="Update Mileage"
        icon="speedometer"
        color="#000000"
        onPress={onPress}
      />,
    );
    expect(
      screen.getByText("Update Mileage").props.numberOfLines,
    ).toBeUndefined();
    fireEvent.press(screen.getByLabelText("Update Mileage"));
    expect(onPress).toHaveBeenCalledTimes(1);
  },
);
it("preserves web action label behavior", () => {
  jest.replaceProperty(Platform, "OS", "web");
  render(
    <QuickActionButton
      title="Update Mileage"
      icon="speedometer"
      color="#000000"
      onPress={jest.fn()}
    />,
  );
  expect(screen.getByText("Update Mileage").props.numberOfLines).toBe(1);
});
it.each(["ios", "web"])(
  "wraps compact vehicle details and navigates on %s",
  (os) => {
    jest.replaceProperty(Platform, "OS", os as any);
    mockMobileWeb = os === "web";
    render(<VehicleCard vehicle={vehicle} />);
    expect(
      screen.getByText("2022 Honda Civic with a longer vehicle name").props
        .numberOfLines,
    ).toBeUndefined();
    expect(screen.getByText("Owner: A long owner name")).toBeTruthy();
    expect(screen.getByText("Shared with me")).toBeTruthy();
    expect(
      StyleSheet.flatten(screen.getByText("Shared with me").props.style)
        .flexShrink,
    ).toBe(1);
    fireEvent.press(
      screen.getByLabelText(
        "View details for 2022 Honda Civic with a longer vehicle name",
      ),
    );
    expect(router.push).toHaveBeenCalledWith("/vehicles/car");
  },
);
it("retains the image fallback after an image error", () => {
  render(<VehicleCard vehicle={vehicle} />);
  act(() => screen.UNSAFE_getByType(Image).props.onError());
  expect(screen.UNSAFE_queryByType(Image)).toBeNull();
  expect(screen.getByText("ABC1234")).toBeTruthy();
});

it.each(["ios", "web"])(
  "keeps the compact bell readable and accessible on %s",
  (os) => {
    jest.replaceProperty(Platform, "OS", os as any);
    mockMobileWeb = os === "web";
    render(<NotificationBell onPress={jest.fn()} />);
    expect(screen.getByLabelText("Notifications, 133 unread")).toBeTruthy();
    let parent = screen.getByText("99+").parent;
    while (parent && StyleSheet.flatten(parent.props.style)?.minHeight !== 20)
      parent = parent.parent;
    expect(parent).toBeTruthy();
    expect(StyleSheet.flatten(parent!.props.style).height).toBeUndefined();
  },
);
