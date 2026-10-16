import { HomeVehicleSearch } from "@/components/dashboard/HomeVehicleSearch";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
jest.mock("react-native-unistyles", () => ({
  createStyleSheet: () => ({}),
  useStyles: () => ({
    styles: {},
    theme: { colors: { textSecondary: "gray" } },
  }),
}));

it("finds an accessible vehicle and opens its details", () => {
  render(
    <HomeVehicleSearch
      vehicles={
        [
          {
            id: "shared-1",
            year: 2022,
            make: "Honda",
            model: "Civic",
            license_plate: "WNA1234",
          },
        ] as any
      }
    />,
  );
  fireEvent.changeText(screen.getByPlaceholderText("Search vehicles"), "wna");
  fireEvent.press(screen.getByText("2022 Honda Civic"));
  expect(mockPush).toHaveBeenCalledWith("/vehicles/shared-1");
});
