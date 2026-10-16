import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { VehicleTable } from "@/components/dashboard/VehicleTable";
import { router } from "expo-router";
jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("expo-image", () => ({
  Image: () => {
    const { View } = require("react-native");
    return <View testID="vehicle-thumbnail" />;
  },
}));
jest.mock("@/components/ui/icon-symbol", () => ({
  IconSymbol: ({ name }: any) => {
    const { View } = require("react-native");
    return <View testID={`icon-${name}`} />;
  },
}));
jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (fn: any) => fn,
  useStyles: (fn: any) => {
    const theme = require("@/src/design-system").lightTheme;
    return { theme, styles: fn(theme) };
  },
}));
const car = {
  id: "car",
  year: 2022,
  make: "Honda",
  model: "Civic",
  main_image_url: null,
  license_plate: "WNA1234",
  current_mileage: 32000,
  isSharedWithMe: false,
  shareCount: 0,
};
beforeEach(() => jest.clearAllMocks());
test("lets the Vehicles list supply its source-aware navigation", () => {
  const onView = jest.fn();
  render(<VehicleTable vehicles={[car]} onView={onView} />);
  fireEvent.press(screen.getByLabelText("View details for 2022 Honda Civic"));
  expect(onView).toHaveBeenCalledWith("car");
  expect(router.push).not.toHaveBeenCalled();
});
test("keeps default detail navigation for the Home table", () => {
  render(<VehicleTable vehicles={[car]} />);
  fireEvent.press(screen.getByLabelText("View details for 2022 Honda Civic"));
  expect(router.push).toHaveBeenCalledWith("/vehicles/car");
});

test("opens the vehicle name through the supplied navigation callback", () => {
  const onView = jest.fn();
  render(<VehicleTable vehicles={[car]} onView={onView} />);
  fireEvent.press(screen.getByText("2022 Honda Civic"));
  expect(onView).toHaveBeenCalledWith("car");
  expect(router.push).not.toHaveBeenCalled();
});

test.each([null, "https://example.test/car.jpg"])(
  "opens details from the vehicle image or fallback: %s",
  (main_image_url) => {
    render(<VehicleTable vehicles={[{ ...car, main_image_url }]} />);
    fireEvent.press(
      screen.getByTestId(
        main_image_url ? "vehicle-thumbnail" : "icon-car.fill",
      ),
    );
    expect(router.push).toHaveBeenCalledWith("/vehicles/car");
  },
);
