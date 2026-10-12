import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { NativeWelcome } from "@/components/landing/NativeWelcome";

const mockPush = jest.fn();
const mockHide = jest.fn(() => Promise.resolve());
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));
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

describe("native welcome handoff", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockHide.mockClear();
  });

  it("reveals the welcome and hides the splash if the logo fails to load", async () => {
    const screen = render(<NativeWelcome />);
    fireEvent(screen.getByTestId("native-welcome-root"), "onLayout", {
      nativeEvent: { layout: { width: 390, height: 844 } },
    });
    expect(screen.queryByText("Create account")).toBeNull();
    fireEvent(screen.getByTestId("welcome-splash-logo"), "onError");
    await waitFor(() => expect(mockHide).toHaveBeenCalledTimes(1));
    fireEvent.press(screen.getByText("Create account"));
    expect(mockPush).toHaveBeenCalledWith("/(auth)/register");
  });
});
