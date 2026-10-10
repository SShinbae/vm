const mockSignInWithOAuth = jest.fn();
const mockExchange = jest.fn();
const mockOpenAuthSession = jest.fn();

jest.mock("expo-web-browser", () => ({
  openAuthSessionAsync: (...a: unknown[]) => mockOpenAuthSession(...a),
}));
jest.mock("expo-linking", () => ({
  createURL: (path: string) => `vehiclesmanagement://${path}`,
  parse: (url: string) => ({
    queryParams: Object.fromEntries(new URLSearchParams(url.split("?")[1])),
  }),
}));
jest.mock("@/lib/config", () => ({
  config: { siteUrl: "https://vm.example" },
}));
jest.mock("@/services/supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithOAuth: (...a: unknown[]) => mockSignInWithOAuth(...a),
      exchangeCodeForSession: (...a: unknown[]) => mockExchange(...a),
    },
  },
}));

import { signInWithGoogle } from "@/lib/services/googleAuthService";

beforeEach(() => {
  jest.clearAllMocks();
  mockSignInWithOAuth.mockResolvedValue({
    data: { url: "https://auth.example/authorize" },
    error: null,
  });
  mockExchange.mockResolvedValue({ error: null });
});

describe("signInWithGoogle (native)", () => {
  it("requests a Google URL for the app scheme without auto-redirecting", async () => {
    mockOpenAuthSession.mockResolvedValue({ type: "cancel" });
    await signInWithGoogle();
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "vehiclesmanagement://login",
        skipBrowserRedirect: true,
      },
    });
    expect(mockOpenAuthSession).toHaveBeenCalledWith(
      "https://auth.example/authorize",
      "vehiclesmanagement://login",
    );
  });

  it("treats a cancelled browser as no error and does not exchange", async () => {
    mockOpenAuthSession.mockResolvedValue({ type: "cancel" });
    await expect(signInWithGoogle()).resolves.toEqual({ error: null });
    expect(mockExchange).not.toHaveBeenCalled();
  });

  it("exchanges the returned code for a session", async () => {
    mockOpenAuthSession.mockResolvedValue({
      type: "success",
      url: "vehiclesmanagement://login?code=abc123",
    });
    await expect(signInWithGoogle()).resolves.toEqual({ error: null });
    expect(mockExchange).toHaveBeenCalledWith("abc123");
  });

  it("surfaces the provider error description", async () => {
    mockOpenAuthSession.mockResolvedValue({
      type: "success",
      url: "vehiclesmanagement://login?error=access_denied&error_description=Denied",
    });
    await expect(signInWithGoogle()).resolves.toEqual({ error: "Denied" });
    expect(mockExchange).not.toHaveBeenCalled();
  });

  it("returns the Supabase error when the OAuth URL cannot be built", async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: null },
      error: { message: "Provider disabled" },
    });
    await expect(signInWithGoogle()).resolves.toEqual({
      error: "Provider disabled",
    });
    expect(mockOpenAuthSession).not.toHaveBeenCalled();
  });
});
