import React, { createContext, useState } from "react";
import { Text } from "react-native";
import { Stack } from "expo-router";
import {
  act,
  fireEvent,
  renderRouter,
  screen,
  waitFor,
} from "expo-router/testing-library";
import { AuthGuard } from "@/components/AuthGuard";
import AuthStack from "@/app/(auth)/_layout";
import Login from "@/app/(auth)/login";
import Register from "@/app/(auth)/register";
import Forgot from "@/app/(auth)/forgot-password";
import Reset from "@/app/(auth)/reset-password";
import EmailConfirmation from "@/app/(auth)/email-confirmation";
import ConfirmationSuccess from "@/app/(auth)/confirmation-success";
import Confirm from "@/app/auth/confirm";

jest.unmock("expo-router");
jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);
jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (fn: any) => fn,
  useStyles: (fn?: any) => {
    const theme = require("@/src/design-system").lightTheme;
    return { theme, styles: fn ? fn(theme) : {} };
  },
}));
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => ({ isWeb: false, isMobile: true }),
}));
jest.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => true }));
jest.mock("@/components/ui", () => ({ PasswordStrengthIndicator: () => null }));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("@/lib/contexts/DemoContext", () => ({
  useDemoMode: () => ({ isDemoMode: false }),
}));
jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => require("react").useContext(mockAuthContext),
}));
jest.mock("@/lib/config", () => ({ config: { siteUrl: "https://vm.test" } }));
jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({ showError: jest.fn(), showSuccess: jest.fn() }),
  toast: { error: jest.fn() },
}));
jest.mock("@/lib/utils/postLoginRoute", () => ({
  postLoginRoute: async (_id: string, fallback: string) => fallback,
}));
jest.mock("@/lib/services/googleAuthService", () => ({
  signInWithGoogle: jest.fn(async () => ({ error: null })),
}));
jest.mock("@/services/supabaseClient", () => ({
  initialUrl: { search: "", hash: "" },
  supabase: {
    auth: {
      getSession: async () => ({
        data: { session: mockHasSession ? { user: mockUser } : null },
        error: null,
      }),
      resend: (...args: unknown[]) => mockResend(...args),
      signOut: () => mockSignOut(),
      verifyOtp: async ({ type }: any) => {
        if (type === "recovery") {
          mockHasSession = true;
          mockSetAuth({ user: mockUser, isPasswordRecovery: true });
        }
        return { data: { user: mockUser }, error: null };
      },
    },
  },
}));
const mockAuthContext = createContext<any>(null);
const mockUser = {
  id: "u",
  email: "wan@example.com",
  profile: { deletion_scheduled_at: null },
};
let mockHasSession = false;
let mockInitialRecovery = false;
let mockSetAuth: (value: any) => void;
const mockResend = jest.fn(async (..._args: unknown[]) => ({ error: null }));
const mockSignOut = jest.fn(async () => {
  mockHasSession = false;
  mockSetAuth({ user: null, isPasswordRecovery: false });
  return { error: null };
});
function Root() {
  const [auth, setAuth] = useState({
    user: mockInitialRecovery ? mockUser : null,
    isPasswordRecovery: mockInitialRecovery,
  });
  mockSetAuth = setAuth;
  return (
    <mockAuthContext.Provider
      value={{
        ...auth,
        initialized: true,
        loading: false,
        signUp: async () => ({ error: null }),
        resetPassword: async () => ({ error: null }),
        signIn: async () => {
          mockHasSession = true;
          setAuth((value) => ({ ...value, user: mockUser }));
          return { error: null };
        },
        updatePassword: async () => ({ error: null }),
        signOut: mockSignOut,
        clearPasswordRecovery: () =>
          setAuth((value) => ({ ...value, isPasswordRecovery: false })),
        refreshProfile: async () => {},
      }}
    >
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthGuard>
    </mockAuthContext.Provider>
  );
}
const routes = {
  _layout: Root,
  "(auth)/_layout": AuthStack,
  "(auth)/login": Login,
  "(auth)/register": Register,
  "(auth)/forgot-password": Forgot,
  "(auth)/reset-password": Reset,
  "(auth)/email-confirmation": EmailConfirmation,
  "(auth)/confirmation-success": ConfirmationSuccess,
  "auth/confirm": Confirm,
  "(tabs)/index": () => <Text>Home screen</Text>,
};
beforeEach(() => {
  jest.clearAllMocks();
  mockHasSession = false;
  mockInitialRecovery = false;
  mockSignOut.mockImplementation(async () => {
    mockHasSession = false;
    mockSetAuth({ user: null, isPasswordRecovery: false });
    return { error: null };
  });
});

it("keeps Login → Forgot → Back and Login → Register → Back on the real auth stack", async () => {
  const result = renderRouter(routes, { initialUrl: "/login" });
  fireEvent.press(screen.getByRole("link", { name: "Forgot password?" }));
  await waitFor(() => expect(result.getPathname()).toBe("/forgot-password"));
  fireEvent.press(screen.getByRole("button", { name: "Back to log in" }));
  await waitFor(() => expect(result.getPathname()).toBe("/login"));
  fireEvent.press(screen.getByRole("link", { name: "Sign up" }));
  await waitFor(() => expect(result.getPathname()).toBe("/register"));
  fireEvent.press(screen.getByRole("link", { name: "Log in" }));
  await waitFor(() => expect(result.getPathname()).toBe("/login"));
});
it("keeps signed-out registration on confirmation, resends there, then returns to Sign In", async () => {
  const result = renderRouter(routes, { initialUrl: "/register" });
  fireEvent.changeText(screen.getByLabelText("Full Name"), "Wan Ahnaf");
  fireEvent.changeText(
    screen.getByLabelText("Email Address"),
    "wan@example.com",
  );
  fireEvent.changeText(screen.getByLabelText("Password"), "GoodPass1!");
  fireEvent.changeText(screen.getByLabelText("Confirm Password"), "GoodPass1!");
  fireEvent.press(screen.getByRole("checkbox"));
  fireEvent.press(screen.getByRole("button", { name: "Create Account" }));
  await waitFor(() => expect(result.getPathname()).toBe("/email-confirmation"));
  expect(screen.getByText("wan@example.com")).toBeTruthy();
  fireEvent.press(
    screen.getByRole("button", { name: "Resend verification email" }),
  );
  await waitFor(() => expect(mockResend).toHaveBeenCalledTimes(1));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Resend email (60s)" }),
    ).toBeDisabled(),
  );
  fireEvent.press(screen.getByRole("button", { name: "Back to Sign In" }));
  await waitFor(() => expect(result.getPathname()).toBe("/login"));
});
it("verifies signup and leaves one explicit success screen before Sign In", async () => {
  const result = renderRouter(routes, {
    initialUrl: "/auth/confirm?token_hash=token&type=signup",
  });
  await waitFor(() =>
    expect(result.getPathname()).toBe("/confirmation-success"),
  );
  fireEvent.press(screen.getByRole("button", { name: "Continue to Sign In" }));
  await waitFor(() => expect(result.getPathname()).toBe("/login"));
});
it("keeps recovery active through password update and only opens Home after Continue", async () => {
  const result = renderRouter(routes, {
    initialUrl: "/auth/confirm?token_hash=token&type=recovery",
  });
  await waitFor(() => expect(result.getPathname()).toBe("/reset-password"));
  await waitFor(() =>
    expect(screen.getByLabelText("New Password")).toBeTruthy(),
  );
  fireEvent.changeText(screen.getByLabelText("New Password"), "GoodPass1!");
  fireEvent.changeText(screen.getByLabelText("Confirm Password"), "GoodPass1!");
  fireEvent.press(screen.getByRole("button", { name: "Update Password" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Continue to App" }),
    ).toBeTruthy(),
  );
  expect(result.getPathname()).toBe("/reset-password");
  fireEvent.press(screen.getByRole("button", { name: "Continue to App" }));
  await waitFor(() => expect(screen.getByText("Home screen")).toBeTruthy());
  expect(mockSignOut).not.toHaveBeenCalled();
});
it("signs out recovery before returning to Sign In without a redirect loop", async () => {
  mockInitialRecovery = true;
  mockHasSession = true;
  let finish!: () => void;
  mockSignOut.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = () => {
          mockHasSession = false;
          mockSetAuth({ user: null, isPasswordRecovery: false });
          resolve({ error: null });
        };
      }),
  );
  const result = renderRouter(routes, { initialUrl: "/reset-password" });
  await waitFor(() =>
    expect(screen.getByLabelText("New Password")).toBeTruthy(),
  );
  fireEvent.press(screen.getByRole("button", { name: "Back to Login" }));
  expect(result.getPathname()).toBe("/reset-password");
  await act(async () => finish());
  await waitFor(() => expect(result.getPathname()).toBe("/login"));
  expect(screen.getByRole("header", { name: "Welcome Back" })).toBeTruthy();
});
it("offers a new reset request when a direct link has no usable session", async () => {
  const result = renderRouter(routes, { initialUrl: "/reset-password" });
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Request new reset link" }),
    ).toBeTruthy(),
  );
  fireEvent.press(
    screen.getByRole("button", { name: "Request new reset link" }),
  );
  await waitFor(() => expect(result.getPathname()).toBe("/forgot-password"));
});
