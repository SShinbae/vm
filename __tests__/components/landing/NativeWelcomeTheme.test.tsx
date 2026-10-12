import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { NativeWelcome } from "@/components/landing/NativeWelcome";

const mockHide = jest.fn(() => Promise.resolve());
jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("expo-splash-screen", () => ({ hideAsync: () => mockHide() }));
jest.mock("@/lib/contexts/ThemeContext", () => ({
  useTheme: () => ({ isLoading: true }),
}));
jest.mock("@/hooks/useReducedMotion", () => ({
  useReducedMotion: () => false,
}));
jest.mock("react-native-unistyles", () => {
  const { lightTheme } = jest.requireActual("@/src/design-system");
  return { useStyles: () => ({ theme: lightTheme }) };
});

it("keeps the splash through theme loading, then reveals even if storage stalls", async () => {
  const screen = render(<NativeWelcome />);
  fireEvent(screen.getByTestId("native-welcome-root"), "onLayout", {
    nativeEvent: { layout: { width: 390, height: 844 } },
  });
  fireEvent(screen.getByTestId("welcome-splash-logo"), "onError");
  expect(mockHide).not.toHaveBeenCalled();
  await waitFor(() => expect(mockHide).toHaveBeenCalledTimes(1), {
    timeout: 3200,
  });
  expect(screen.getByText("Create account")).toBeTruthy();
});
