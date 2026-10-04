/**
 * Landing page tests
 *
 * Covers the public landing page: auth redirect, honest copy (no invented
 * usage numbers), FAQ accordion behaviour, and the dynamic footer year.
 */

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import Index from "@/app/index";
import { FAQS } from "@/components/landing/content";
import { useAuth } from "@/lib/contexts/AuthContext";

jest.mock("@/lib/contexts/AuthContext", () => ({ useAuth: jest.fn() }));

jest.mock("@/hooks/useReducedMotion", () => ({
  useReducedMotion: () => true,
}));

jest.mock("react-native-unistyles", () => {
  const { lightTheme } = jest.requireActual("@/src/design-system");
  return { useStyles: () => ({ theme: lightTheme }) };
});

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const mockUseAuth = useAuth as jest.Mock;

describe("Landing page", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      initialized: true,
    });
  });

  it("renders the primary call to action", () => {
    const { getByLabelText } = render(<Index />);
    expect(getByLabelText("Get started, it's free")).toBeTruthy();
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
  });

  it("shows the current year in the footer", () => {
    const { getByText } = render(<Index />);
    const year = String(new Date().getFullYear());
    expect(getByText(new RegExp(`© ${year}`))).toBeTruthy();
  });
});
