import React from "react";
import { render } from "@testing-library/react-native";

import { CONTACT_EMAIL } from "@/components/landing/content";
import { useAuth } from "@/lib/contexts/AuthContext";

const mockUseAuth = useAuth as jest.Mock;

jest.mock("@/lib/contexts/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("react-native-unistyles", () => {
  const { lightTheme } = jest.requireActual("@/src/design-system");
  return { useStyles: () => ({ theme: lightTheme }) };
});
jest.mock("expo-router/head", () => () => null);
jest.mock("@/components/landing/LandingNav", () => ({
  LandingNav: () => null,
}));
jest.mock("@/components/landing/LandingFooter", () => ({
  LandingFooter: () => null,
}));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
jest.mock("expo-router", () => {
  const React = require("react");
  const { Text: RNText } = require("react-native");
  return {
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
    useRouter: () => ({ push: jest.fn() }),
    // Renders the href as a testID so tests can assert on it.
    Link: ({ href, children, accessibilityLabel }: any) =>
      React.createElement(
        RNText,
        { testID: `link:${href}`, accessibilityLabel },
        children,
      ),
    Redirect: ({ href }: { href: string }) =>
      React.createElement(RNText, { testID: "redirect" }, href),
  };
});

import DeleteAccountWebPage from "@/app/delete-account.web";
import DeleteAccountRedirect from "@/app/delete-account";

const signedIn = { user: { id: "u1" }, initialized: true };
const signedOut = { user: null, initialized: true };

describe("/delete-account web page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("links back to home with the shared back-link label", () => {
    mockUseAuth.mockReturnValue(signedOut);
    const { getByLabelText, getByTestId } = render(<DeleteAccountWebPage />);
    expect(getByLabelText("Back to home")).toBeTruthy();
    expect(getByTestId("link:/")).toBeTruthy();
  });

  it("renders the contact email as a real mailto link", () => {
    mockUseAuth.mockReturnValue(signedOut);
    const { getByTestId } = render(<DeleteAccountWebPage />);
    const link = getByTestId(`link:mailto:${CONTACT_EMAIL}`);
    expect(link.props.children).toBe(CONTACT_EMAIL);
  });

  it("asks signed-out visitors to sign in before deleting", () => {
    mockUseAuth.mockReturnValue(signedOut);
    const { getByText, queryByText } = render(<DeleteAccountWebPage />);
    expect(getByText("Sign in to delete my account")).toBeTruthy();
    expect(queryByText("Delete my account")).toBeNull();
  });

  it("offers the delete button straight away to signed-in users", () => {
    mockUseAuth.mockReturnValue(signedIn);
    const { getByText, queryByText } = render(<DeleteAccountWebPage />);
    expect(getByText("Delete my account")).toBeTruthy();
    expect(queryByText("Sign in to delete my account")).toBeNull();
  });
});

describe("/delete-account native redirect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sends signed-in users to the in-app delete screen", () => {
    mockUseAuth.mockReturnValue(signedIn);
    const { getByTestId } = render(<DeleteAccountRedirect />);
    expect(getByTestId("redirect").props.children).toBe("/account/delete");
  });

  it("sends signed-out users to login, then back to the delete screen", () => {
    mockUseAuth.mockReturnValue(signedOut);
    const { getByTestId } = render(<DeleteAccountRedirect />);
    expect(getByTestId("redirect").props.children).toBe(
      "/(auth)/login?next=/account/delete",
    );
  });

  it("renders nothing until auth has initialized", () => {
    mockUseAuth.mockReturnValue({ user: null, initialized: false });
    const { queryByTestId, toJSON } = render(<DeleteAccountRedirect />);
    expect(toJSON()).toBeNull();
    expect(queryByTestId("redirect")).toBeNull();
  });

  it("renders nothing while the session is still restoring", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      initialized: true,
      loading: true,
    });
    const { queryByTestId, toJSON } = render(<DeleteAccountRedirect />);
    expect(toJSON()).toBeNull();
    expect(queryByTestId("redirect")).toBeNull();
  });
});
