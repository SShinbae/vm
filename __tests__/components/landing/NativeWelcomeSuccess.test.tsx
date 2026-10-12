import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { NativeWelcome } from "@/components/landing/NativeWelcome";

const mockHide = jest.fn(() => Promise.resolve());
jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("expo-splash-screen", () => ({ hideAsync: () => mockHide() }));
jest.mock("@/lib/contexts/ThemeContext", () => ({
  useTheme: () => ({ isLoading: false }),
}));
jest.mock("@/hooks/useReducedMotion", () => ({
  useReducedMotion: () => false,
}));
jest.mock("react-native-unistyles", () => {
  const { lightTheme } = jest.requireActual("@/src/design-system");
  return { useStyles: () => ({ theme: lightTheme }) };
});

it("reveals the welcome if native layout measurement never arrives", async () => {
  const screen = render(<NativeWelcome />);
  const root = screen.getByTestId("native-welcome-root");
  fireEvent(root, "onLayout", {
    nativeEvent: { layout: { width: 390, height: 844 } },
  });
  const target = screen.UNSAFE_getByProps({ testID: "welcome-logo-target" });
  fireEvent(target, "onLayout", {
    nativeEvent: { layout: { width: 120, height: 64 } },
  });
  expect(mockHide).not.toHaveBeenCalled();
  fireEvent(screen.getByTestId("welcome-splash-logo"), "onLoad");
  await waitFor(() => expect(mockHide).toHaveBeenCalledTimes(1), {
    timeout: 3500,
  });
});
