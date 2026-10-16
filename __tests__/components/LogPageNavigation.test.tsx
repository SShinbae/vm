import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { LogPageNavigation } from "@/components/logs/LogPageNavigation";
import { router } from "expo-router";
let mockMobile = false;
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => ({ isWeb: true, isMobile: mockMobile }),
}));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  Link: ({ href, children, ...props }: any) => {
    const { Text } = require("react-native");
    return (
      <Text
        {...props}
        accessibilityRole="link"
        onPress={() => require("expo-router").router.push(href)}
      >
        {children}
      </Text>
    );
  },
}));
jest.mock("react-native-unistyles", () => ({
  useStyles: () => ({ theme: require("@/src/design-system").lightTheme }),
}));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
afterEach(() => {
  mockMobile = false;
  jest.clearAllMocks();
});
test("changes Add trail from Logs to the selected saved vehicle without fetching", () => {
  const { rerender } = render(<LogPageNavigation title="Add Fuel Log" />);
  fireEvent.press(screen.getByText("Logs"));
  expect(router.push).toHaveBeenCalledWith("/logs");
  rerender(
    <LogPageNavigation
      title="Add Fuel Log"
      vehicleId="car"
      vehicle={{ year: 2022, make: "Honda", model: "Civic" }}
    />,
  );
  expect(screen.queryByText("Logs")).toBeNull();
  fireEvent.press(screen.getByText("2022 Honda Civic"));
  expect(router.push).toHaveBeenCalledWith({
    pathname: "/vehicles/[id]",
    params: { id: "car" },
  });
});
test("includes Service Details parent and usable navigation during failure", () => {
  const retry = jest.fn();
  render(
    <LogPageNavigation
      title="Edit Service Log"
      serviceDetailId="old"
      error="Offline"
      retry={retry}
    />,
  );
  fireEvent.press(screen.getByText("Service Details"));
  expect(router.push).toHaveBeenCalledWith({
    pathname: "/logs/service/[id]",
    params: { id: "old" },
  });
  fireEvent.press(screen.getByText("Retry"));
  expect(retry).toHaveBeenCalled();
  fireEvent.press(screen.getByText("Return to Logs"));
  expect(router.replace).toHaveBeenCalledWith("/logs");
});
test("keeps breadcrumbs out of mobile and explains automatic mileage protection", () => {
  mockMobile = true;
  render(<LogPageNavigation title="Edit Mileage Log" readOnly />);
  expect(screen.queryByText("Logs")).toBeNull();
  expect(screen.getByText(/created from fuel logs/)).toBeTruthy();
});
