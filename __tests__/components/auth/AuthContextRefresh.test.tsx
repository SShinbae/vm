import { act, renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

const mockSingle = jest.fn();
jest.mock("@/services/supabaseClient", () => {
  const q: any = {
    select: () => q,
    eq: () => q,
    abortSignal: () => q,
    single: (...a: unknown[]) => mockSingle(...a),
  };
  return {
    supabase: {
      from: () => q,
      auth: {
        getUser: jest.fn(),
        onAuthStateChange: (cb: any) => {
          setTimeout(
            () =>
              cb("INITIAL_SESSION", {
                user: { id: "u", email: "u@x", email_confirmed_at: "t" },
              }),
            0,
          );
          return { data: { subscription: { unsubscribe: jest.fn() } } };
        },
      },
    },
  };
});
jest.mock("posthog-react-native", () => ({ usePostHog: () => null }));
jest.mock("@/lib/services/pushService", () => ({
  pushService: { syncUser: jest.fn() },
}));
jest.mock("@/lib/services/sentryService", () => ({
  sentryService: { identifyUser: jest.fn() },
}));

import { AuthProvider, useAuth } from "@/lib/contexts/AuthContext";

const setup = async () => {
  // First single() = background fetch from INITIAL_SESSION; never resolves,
  // so it stays in flight while refreshProfile runs.
  mockSingle.mockReset().mockReturnValueOnce(new Promise(() => {}));
  const hook = renderHook(() => useAuth(), {
    wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
  });
  await waitFor(() => expect(hook.result.current.user?.id).toBe("u"));
  await act(async () => {
    await new Promise((r) => setTimeout(r, 5));
  });
  return hook;
};

describe("refreshProfile", () => {
  it("updates deletion_scheduled_at even while another profile fetch is in flight", async () => {
    const { result } = await setup();
    mockSingle.mockResolvedValueOnce({
      data: { id: "u", username: "bob", deletion_scheduled_at: null },
      error: null,
    });
    await act(async () => {
      await result.current.refreshProfile();
    });
    expect(result.current.user?.profile?.deletion_scheduled_at).toBeNull();
    expect(result.current.user?.username).toBe("bob");
  });

  it("rejects on failure and keeps the existing profile", async () => {
    const { result } = await setup();
    mockSingle.mockResolvedValueOnce({
      data: { id: "u", username: "bob", deletion_scheduled_at: "2026-11-10" },
      error: null,
    });
    await act(async () => {
      await result.current.refreshProfile();
    });
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: "x" } });
    await act(async () => {
      await expect(result.current.refreshProfile()).rejects.toThrow();
    });
    expect(result.current.user?.profile?.deletion_scheduled_at).toBe(
      "2026-11-10",
    );
  });
});
