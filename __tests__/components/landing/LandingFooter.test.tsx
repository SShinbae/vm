import React from "react";
import { render, screen } from "@testing-library/react-native";

jest.mock("react-native-unistyles", () => {
  const { lightTheme } = jest.requireActual("@/src/design-system");
  return { useStyles: () => ({ theme: lightTheme }) };
});
jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("expo-router", () => {
  const React = require("react");
  const { Text: RNText } = require("react-native");
  return {
    useRouter: () => ({ push: jest.fn() }),
    // Renders the href as a testID so tests can assert on it.
    Link: ({ href, children }: any) =>
      React.createElement(RNText, { testID: `link:${href}` }, children),
  };
});

import { LandingFooter } from "@/components/landing/LandingFooter";

describe("LandingFooter", () => {
  // Google OAuth brand verification needs a real privacy link on the homepage.
  it("renders Privacy and Terms as real links", () => {
    render(<LandingFooter />);
    expect(screen.getByTestId("link:/privacy")).toHaveTextContent("Privacy");
    expect(screen.getByTestId("link:/terms")).toHaveTextContent("Terms");
  });
});
