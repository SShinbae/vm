import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import {
  NativeWelcome,
  skipWelcomeAnimation,
} from "@/components/landing/NativeWelcome";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));
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

it("shows the finished welcome when returning after another startup route", () => {
  skipWelcomeAnimation();
  const screen = render(<NativeWelcome />);
  expect(screen.queryByTestId("welcome-splash-logo")).toBeNull();
  fireEvent.press(screen.getByText("Sign in"));
  expect(mockPush).toHaveBeenCalledWith("/(auth)/login");
});
