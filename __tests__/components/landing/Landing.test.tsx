/**
 * Landing page tests
 *
 * Covers the public landing page: auth redirect, honest copy (no invented
 * usage numbers), FAQ accordion behaviour, and the dynamic footer year.
 */

import React from "react";
import { Platform } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";

import Index from "@/app/index";
import { FAQS } from "@/components/landing/content";
import { useAuth } from "@/lib/contexts/AuthContext";

jest.mock("@/lib/contexts/AuthContext", () => ({ useAuth: jest.fn() }));

jest.mock("@/lib/contexts/ThemeContext", () => ({
  useTheme: () => ({ isLoading: false }),
}));

jest.mock("@/hooks/useReducedMotion", () => ({
  useReducedMotion: () => true,
}));

jest.mock("react-native-unistyles", () => {
  const { lightTheme } = jest.requireActual("@/src/design-system");
  return { useStyles: () => ({ theme: lightTheme }) };
});

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  Link: ({ children }: { children: React.ReactNode }) => children,
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require("react-native");
    return <Text>{href}</Text>;
  },
}));

const mockUseAuth = useAuth as jest.Mock;
const originalPlatform = Platform.OS;
afterAll(() => {
  Platform.OS = originalPlatform;
});

describe("Landing page", () => {
  beforeEach(() => {
    Platform.OS = "web";
    mockPush.mockClear();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      initialized: true,
    });
  });

  it.each(["ios", "android"] as const)(
    "shows a compact welcome on %s",
    (platform) => {
      Platform.OS = platform;
      const { getByText, queryByText, queryByTestId, getByTestId } = render(
        <Index />,
      );
      expect(queryByText("Questions, answered")).toBeNull();
      if (queryByTestId("native-welcome-root")) {
        fireEvent(getByTestId("native-welcome-root"), "onLayout", {
          nativeEvent: { layout: { width: 390, height: 844 } },
        });
        const logo = queryByTestId("welcome-splash-logo");
        if (logo) fireEvent(logo, "onError");
      }
      fireEvent.press(getByText("Create account"));
      expect(mockPush).toHaveBeenCalledWith("/(auth)/register");
      fireEvent.press(getByText("Sign in"));
      expect(mockPush).toHaveBeenCalledWith("/(auth)/login");
      fireEvent.press(getByText("Privacy"));
      expect(mockPush).toHaveBeenCalledWith("/privacy");
      fireEvent.press(getByText("Terms"));
      expect(mockPush).toHaveBeenCalledWith("/terms");
    },
  );

  it.each(["web", "ios", "android"] as const)(
    "redirects signed-in users on %s",
    (platform) => {
      Platform.OS = platform;
      mockUseAuth.mockReturnValue({
        user: { id: "test" },
        loading: false,
        initialized: true,
      });
      const { getByText, queryByText } = render(<Index />);
      expect(getByText("/(tabs)")).toBeTruthy();
      expect(queryByText("Create account")).toBeNull();
    },
  );

  it.each(["web", "ios", "android"] as const)(
    "waits for auth initialization on %s",
    (platform) => {
      Platform.OS = platform;
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        initialized: false,
      });
      const { queryByText, queryByLabelText } = render(<Index />);
      expect(queryByText("Create account")).toBeNull();
      expect(queryByLabelText("Get started, it's free")).toBeNull();
    },
  );

  it("renders the primary call to action", () => {
    const { getByLabelText } = render(<Index />);
    fireEvent.press(getByLabelText("Get started, it's free"));
    expect(mockPush).toHaveBeenCalledWith("/(auth)/register");
  });

  it("does not show fabricated usage numbers", () => {
    const { queryByText } = render(<Index />);
    for (const fake of [/RM108K/, /247/, /Join thousands/]) {
      expect(queryByText(fake)).toBeNull();
    }
  });

  it("expands an FAQ answer when its question is pressed", () => {
    const { getByText, queryByText } = render(<Index />);
    const { question, answer } = FAQS[0];

    expect(queryByText(answer)).toBeNull();
    fireEvent.press(getByText(question));
    expect(getByText(answer)).toBeTruthy();
    fireEvent.press(getByText(question));
    expect(queryByText(answer)).toBeNull();
  });

  it("shows the current year in the footer", () => {
    const { getByText } = render(<Index />);
    const year = String(new Date().getFullYear());
    expect(getByText(new RegExp(`© ${year}`))).toBeTruthy();
  });
  it("FAQ delete answer says family logs stay on the vehicles without your name", () => {
    const deleteFaq = FAQS.find((f) => f.question === "Can I delete my data?");
    expect(deleteFaq?.answer).toContain("without your name");
  });
});
