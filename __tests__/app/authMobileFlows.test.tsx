import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { Platform } from "react-native";
import { router } from "expo-router";
import Login from "@/app/(auth)/login";
import Register from "@/app/(auth)/register";
import Forgot from "@/app/(auth)/forgot-password";
import Reset from "@/app/(auth)/reset-password";
import EmailConfirmation from "@/app/(auth)/email-confirmation";
import ConfirmationSuccess from "@/app/(auth)/confirmation-success";
import Confirm from "@/app/auth/confirm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

const mockSignIn = jest.fn(),
  mockSignUp = jest.fn(),
  mockReset = jest.fn(),
  mockUpdate = jest.fn(),
  mockSignOut = jest.fn(),
  mockClearRecovery = jest.fn();
const mockError = jest.fn(),
  mockSuccess = jest.fn(),
  mockResend = jest.fn(),
  mockVerify = jest.fn(),
  mockGoogle = jest.fn(),
  mockPostLogin = jest.fn(),
  mockSession = jest.fn();
let mockParams: Record<string, any> = {};
let mockUser: any = null;
let mockInitialized = true;
let mockRecovery = false;
const mockInitialUrl = { search: "", hash: "" };

jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    initialized: mockInitialized,
    loading: false,
    signIn: mockSignIn,
    signUp: mockSignUp,
    resetPassword: mockReset,
    updatePassword: mockUpdate,
    signOut: mockSignOut,
    clearPasswordRecovery: mockClearRecovery,
    isPasswordRecovery: mockRecovery,
  }),
}));
jest.mock("@/lib/config", () => ({ config: { siteUrl: "https://vm.test" } }));
jest.mock("@/services/supabaseClient", () => ({
  get initialUrl() {
    return mockInitialUrl;
  },
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockSession(...args),
      resend: (...args: unknown[]) => mockResend(...args),
      verifyOtp: (...args: unknown[]) => mockVerify(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
  },
}));
jest.mock("@/lib/utils/postLoginRoute", () => ({
  postLoginRoute: (...args: unknown[]) => mockPostLogin(...args),
}));
jest.mock("@/lib/services/googleAuthService", () => ({
  signInWithGoogle: () => mockGoogle(),
}));
jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    showError: mockError,
    showSuccess: mockSuccess,
    showWarning: mockError,
  }),
  toast: { error: (...args: unknown[]) => mockError(...args) },
}));
jest.mock("@/lib/contexts/DialogContext", () => ({
  useDialog: () => ({ confirm: jest.fn().mockResolvedValue(false) }),
}));
jest.mock("@/components/ui", () => ({ PasswordStrengthIndicator: () => null }));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => true }));
jest.mock("react-native-unistyles", () => ({
  useStyles: () => ({ theme: require("@/src/design-system").lightTheme }),
}));
jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(),
  },
  useRouter: () => require("expo-router").router,
  useLocalSearchParams: () => mockParams,
  Link: ({ children, href }: any) =>
    require("react").cloneElement(children, {
      onPress: () => require("expo-router").router.push(href),
    }),
}));

function deferred() {
  let resolve!: (value: any) => void;
  const promise = new Promise<any>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function fill(label: string, value: string) {
  fireEvent.changeText(screen.getByLabelText(label), value);
}
function registration() {
  fill("Full Name", " Wan Ahnaf ");
  fill("Email Address", " WAN@Example.COM ");
  fill("Password", "GoodPass1!");
  fill("Confirm Password", "GoodPass1!");
  fireEvent.press(screen.getByRole("checkbox"));
}
beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  mockUser = null;
  mockInitialized = true;
  mockRecovery = false;
  mockInitialUrl.search = "";
  mockInitialUrl.hash = "";
  mockSignIn.mockResolvedValue({ error: null });
  mockSignUp.mockResolvedValue({ error: null });
  mockReset.mockResolvedValue({ error: null });
  mockUpdate.mockResolvedValue({ error: null });
  mockSignOut.mockResolvedValue({ error: null });
  mockResend.mockResolvedValue({ error: null });
  mockGoogle.mockResolvedValue({ error: null });
  mockVerify.mockResolvedValue({ data: { user: { id: "u" } }, error: null });
  mockSession.mockResolvedValue({
    data: { session: { user: { id: "u" } } },
    error: null,
  });
  mockPostLogin.mockImplementation((_id: string, fallback: string) =>
    Promise.resolve(fallback),
  );
  jest.mocked(router.canGoBack).mockReturnValue(false);
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it("removes Remember Me and submits login once with the original password and safe destination", async () => {
  const request = deferred();
  mockSignIn.mockReturnValue(request.promise);
  mockParams = { next: "/groups/one" };
  render(<Login />);
  fill("Email Address", " WAN@Example.COM ");
  fill("Password", " Password1! ");
  expect(screen.queryByText("Remember me for 30 days")).toBeNull();
  const submit = screen.getByRole("button", { name: "Sign in" });
  act(() => {
    fireEvent.press(submit);
    fireEvent.press(submit);
  });
  expect(mockSignIn).toHaveBeenCalledTimes(1);
  expect(mockSignIn).toHaveBeenCalledWith("wan@example.com", " Password1! ");
  expect(screen.getByLabelText("Email Address").props.editable).toBe(false);
  await act(async () => request.resolve({ error: null }));
  expect(router.replace).toHaveBeenCalledWith("/groups/one");
});

it("retains a failed login draft and ignores completion after leaving the screen", async () => {
  mockSignIn.mockRejectedValueOnce(new Error("Offline"));
  const view = render(<Login />);
  fill("Email Address", "wan@example.com");
  fill("Password", "draft");
  fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
  await waitFor(() => expect(mockError).toHaveBeenCalled());
  expect(screen.getByLabelText("Password").props.value).toBe("draft");
  const request = deferred();
  mockSignIn.mockReturnValue(request.promise);
  fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
  view.unmount();
  await act(async () => request.resolve({ error: null }));
  expect(router.replace).not.toHaveBeenCalled();
});

it("guards registration and recovers from a thrown error without losing the draft", async () => {
  const request = deferred();
  mockSignUp.mockReturnValue(request.promise);
  render(<Register />);
  registration();
  const button = screen.getByRole("button", { name: "Create Account" });
  act(() => {
    fireEvent.press(button);
    fireEvent.press(button);
  });
  expect(mockSignUp).toHaveBeenCalledTimes(1);
  await act(async () => request.resolve({ error: "Offline" }));
  expect(screen.getByLabelText("Full Name").props.value).toBe(" Wan Ahnaf ");
  mockSignUp.mockRejectedValueOnce(new Error("Offline"));
  fireEvent.press(screen.getByRole("button", { name: "Create Account" }));
  await waitFor(() =>
    expect(screen.getByLabelText("Full Name").props.editable).toBe(true),
  );
  expect(router.replace).not.toHaveBeenCalled();
});

it("normalizes registration details and opens email confirmation", async () => {
  render(<Register />);
  registration();
  fireEvent.press(screen.getByRole("button", { name: "Create Account" }));
  await waitFor(() =>
    expect(router.replace).toHaveBeenCalledWith({
      pathname: "/(auth)/email-confirmation",
      params: { email: "wan@example.com" },
    }),
  );
  expect(mockSignUp).toHaveBeenCalledWith(
    "wan@example.com",
    "GoodPass1!",
    "Wan Ahnaf",
  );
});

it("guards reset requests and retains the address after a failure", async () => {
  const request = deferred();
  mockReset.mockReturnValue(request.promise);
  render(<Forgot />);
  fill("Email Address", " WAN@Example.COM ");
  const button = screen.getByRole("button", { name: "Send Reset Link" });
  act(() => {
    fireEvent.press(button);
    fireEvent.press(button);
  });
  expect(mockReset).toHaveBeenCalledTimes(1);
  await act(async () => request.resolve({ error: "Offline" }));
  expect(screen.getByLabelText("Email Address").props.value).toBe(
    " WAN@Example.COM ",
  );
  mockReset.mockResolvedValueOnce({ error: null });
  fireEvent.press(screen.getByRole("button", { name: "Send Reset Link" }));
  await waitFor(() => expect(screen.getByText("wan@example.com")).toBeTruthy());
});

it.each([true, false])(
  "uses history or Sign In fallback from Forgot Password: history=%s",
  (history) => {
    jest.mocked(router.canGoBack).mockReturnValue(history);
    render(<Forgot />);
    fireEvent.press(screen.getByRole("button", { name: "Back to log in" }));
    if (history) expect(router.back).toHaveBeenCalled();
    else expect(router.replace).toHaveBeenCalledWith("/(auth)/login");
  },
);

it("resends verification without registration and starts cooldown only after success", async () => {
  jest.useFakeTimers();
  mockParams = { email: "WAN@example.com" };
  mockResend.mockResolvedValueOnce({ error: { message: "Offline" } });
  render(<EmailConfirmation />);
  fireEvent.press(
    screen.getByRole("button", { name: "Resend verification email" }),
  );
  await act(async () => {});
  expect(mockResend).toHaveBeenCalledWith({
    type: "signup",
    email: "wan@example.com",
    options: { emailRedirectTo: "https://vm.test/auth/confirm" },
  });
  expect(
    screen.getByRole("button", { name: "Resend verification email" }),
  ).toBeEnabled();
  fireEvent.press(
    screen.getByRole("button", { name: "Resend verification email" }),
  );
  await act(async () => {});
  expect(
    screen.getByRole("button", { name: "Resend email (60s)" }),
  ).toBeDisabled();
  act(() => jest.advanceTimersByTime(60000));
  expect(
    screen.getByRole("button", { name: "Resend verification email" }),
  ).toBeEnabled();
  expect(router.replace).not.toHaveBeenCalled();
});

it("does not resend without a valid email", () => {
  render(<EmailConfirmation />);
  expect(
    screen.getByRole("button", { name: "Resend verification email" }),
  ).toBeDisabled();
  expect(mockResend).not.toHaveBeenCalled();
});

it("waits for auth initialization and offers a new reset link without a session", async () => {
  mockInitialized = false;
  mockSession.mockResolvedValue({ data: { session: null }, error: null });
  const view = render(<Reset />);
  expect(screen.queryByLabelText("New Password")).toBeNull();
  mockInitialized = true;
  view.rerender(<Reset />);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Request new reset link" }),
    ).toBeTruthy(),
  );
  expect(mockUpdate).not.toHaveBeenCalled();
});

it("guards password updates and applies pending-deletion routing after Continue", async () => {
  mockUser = { id: "u" };
  mockRecovery = true;
  mockPostLogin.mockResolvedValue("/account-pending-deletion");
  const request = deferred();
  mockUpdate.mockReturnValue(request.promise);
  render(<Reset />);
  await waitFor(() =>
    expect(screen.getByLabelText("New Password")).toBeTruthy(),
  );
  fill("New Password", "GoodPass1!");
  fill("Confirm Password", "GoodPass1!");
  const button = screen.getByRole("button", { name: "Update Password" });
  act(() => {
    fireEvent.press(button);
    fireEvent.press(button);
  });
  expect(mockUpdate).toHaveBeenCalledTimes(1);
  await act(async () => request.resolve({ error: null }));
  expect(mockClearRecovery).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole("button", { name: "Continue to App" }));
  await waitFor(() =>
    expect(router.replace).toHaveBeenCalledWith("/account-pending-deletion"),
  );
  expect(mockClearRecovery).toHaveBeenCalledTimes(1);
});

it("awaits recovery sign-out and stays put if it fails", async () => {
  mockUser = { id: "u" };
  mockRecovery = true;
  const request = deferred();
  mockSignOut.mockReturnValue(request.promise);
  render(<Reset />);
  await waitFor(() =>
    expect(screen.getByLabelText("New Password")).toBeTruthy(),
  );
  fireEvent.press(screen.getByRole("button", { name: "Back to Login" }));
  expect(mockClearRecovery).not.toHaveBeenCalled();
  expect(router.replace).not.toHaveBeenCalled();
  await act(async () => request.resolve({ error: "Offline" }));
  expect(mockClearRecovery).not.toHaveBeenCalled();
  expect(router.replace).not.toHaveBeenCalled();
  mockSignOut.mockResolvedValueOnce({ error: null });
  fireEvent.press(screen.getByRole("button", { name: "Back to Login" }));
  await waitFor(() =>
    expect(router.replace).toHaveBeenCalledWith("/(auth)/login"),
  );
});

it("rejects an expired link even if another user has an existing session", async () => {
  mockParams = { error: "access_denied", error_description: "Expired" };
  mockUser = { id: "u" };
  render(<Reset />);
  await act(async () => {});
  expect(screen.queryByLabelText("New Password")).toBeNull();
  expect(
    screen.getByRole("button", { name: "Request new reset link" }),
  ).toBeTruthy();
});

it.each([
  "#error=access_denied&error_code=otp_expired&error_description=Link+expired",
  "#error=access_denied&error_code=otp_expired",
])(
  "rejects failed recovery fragments instead of editing an existing browser account: %s",
  async (hash) => {
    mockUser = { id: "other-user" };
    mockInitialUrl.hash = hash;
    render(<Reset />);
    await act(async () => {});
    expect(screen.queryByLabelText("New Password")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Request new reset link" }),
    ).toBeTruthy();
    expect(mockUpdate).not.toHaveBeenCalled();
  },
);

it("shows confirmation errors with a real Sign In destination", async () => {
  mockParams = { token_hash: "token", type: "signup" };
  mockVerify.mockResolvedValue({ data: {}, error: { message: "Expired" } });
  render(<Confirm />);
  await waitFor(() => expect(screen.getByText("Expired")).toBeTruthy());
  fireEvent.press(screen.getByRole("button", { name: "Go to Sign In" }));
  expect(router.replace).toHaveBeenCalledWith("/(auth)/login");
});

it("verifies once on rerender and routes signup directly to one success screen", async () => {
  mockParams = { token_hash: "token", type: "signup" };
  const view = render(<Confirm />);
  await waitFor(() =>
    expect(router.replace).toHaveBeenCalledWith("/(auth)/confirmation-success"),
  );
  view.rerender(<Confirm />);
  expect(mockVerify).toHaveBeenCalledTimes(1);
});

it("keeps the verified recovery session and opens reset password", async () => {
  mockParams = { token_hash: "token", type: "recovery" };
  render(<Confirm />);
  await waitFor(() =>
    expect(router.replace).toHaveBeenCalledWith("/(auth)/reset-password"),
  );
  expect(mockSignOut).not.toHaveBeenCalled();
});

it("does not claim success from a failed PKCE exchange", async () => {
  mockInitialUrl.search = "?code=bad";
  mockSession.mockResolvedValue({
    data: { session: null },
    error: { message: "Exchange failed" },
  });
  render(<Confirm />);
  await waitFor(() => expect(screen.getByText(/Exchange failed/)).toBeTruthy());
  expect(router.replace).not.toHaveBeenCalled();
});

it("does not auto-redirect away from the success screen", () => {
  jest.useFakeTimers();
  render(<ConfirmationSuccess />);
  act(() => jest.advanceTimersByTime(10000));
  expect(router.replace).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole("button", { name: "Continue to Sign In" }));
  expect(router.replace).toHaveBeenCalledWith("/(auth)/login");
});

it("guards Google sign-in and releases its busy state after cancellation", async () => {
  jest.replaceProperty(Platform, "OS", "android");
  const request = deferred();
  mockGoogle.mockReturnValue(request.promise);
  const busy = jest.fn();
  render(<GoogleSignInButton onLoadingChange={busy} />);
  const button = screen.getByRole("button", { name: "Continue with Google" });
  act(() => {
    fireEvent.press(button);
    fireEvent.press(button);
  });
  expect(mockGoogle).toHaveBeenCalledTimes(1);
  expect(busy).toHaveBeenCalledWith(true);
  await act(async () => request.resolve({ error: null }));
  expect(busy).toHaveBeenLastCalledWith(false);
});

it("finishes Google sign-in from registration when the session arrives", async () => {
  jest.replaceProperty(Platform, "OS", "android");
  const request = deferred();
  mockGoogle.mockReturnValue(request.promise);
  const view = render(<Register />);
  fireEvent.press(screen.getByRole("button", { name: "Continue with Google" }));
  mockUser = { id: "u" };
  view.rerender(<Register />);
  await act(async () => request.resolve({ error: null }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/(tabs)"));
});

it("does not sign out a later session after leaving confirmation mid-verification", async () => {
  const request = deferred();
  mockVerify.mockReturnValue(request.promise);
  mockParams = { token_hash: "token", type: "signup" };
  const view = render(<Confirm />);
  view.unmount();
  await act(async () =>
    request.resolve({ data: { user: { id: "old" } }, error: null }),
  );
  expect(mockSignOut).not.toHaveBeenCalled();
  expect(router.replace).not.toHaveBeenCalled();
});
