import { act, renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

const mockSingle = jest.fn();
const mockClearUser = jest.fn();
const mockOrder: string[] = [];
const mockReset = jest.fn(() => mockOrder.push("reset"));
const mockIdentify = jest.fn();
const mockIdentifyUser = jest.fn();
let mockAuthCb: any;
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
        signOut: jest.fn(async () => {
          // real supabase fires SIGNED_OUT before signOut() resolves
          await mockAuthCb("SIGNED_OUT", null);
          return { error: null };
        }),
        onAuthStateChange: (cb: any) => {
          mockAuthCb = cb;
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
jest.mock("posthog-react-native", () => ({
  usePostHog: () => ({
    reset: mockReset,
    capture: (e: string) => mockOrder.push(`capture:${e}`),
    identify: (...a: unknown[]) => mockIdentify(...a),
  }),
}));
jest.mock("@/lib/services/pushService", () => ({
  pushService: { syncUser: jest.fn(), onLogout: jest.fn() },
}));
jest.mock("@/lib/services/sentryService", () => ({
  sentryService: {
    identifyUser: (...a: unknown[]) => mockIdentifyUser(...a),
    clearUser: () => mockClearUser(),
  },
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

describe("refreshProfile timeout", () => {
  it("rejects within 5s when the query hangs", async () => {
    const { result } = await setup();
    mockSingle.mockReturnValueOnce(new Promise(() => {}));
    jest.useFakeTimers();
    try {
      let p!: Promise<void>;
      act(() => {
        p = result.current.refreshProfile();
      });
      const assertion = expect(p).rejects.toThrow("Profile refresh timed out");
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });
      await assertion;
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("analytics identify", () => {
  it("sends only the user id to Sentry and PostHog, never the email", async () => {
    await setup();
    expect(mockIdentifyUser).toHaveBeenCalledWith("u");
    expect(mockIdentify).toHaveBeenCalledWith("u");
    expect(JSON.stringify(mockIdentifyUser.mock.calls)).not.toContain("u@x");
    expect(JSON.stringify(mockIdentify.mock.calls)).not.toContain("u@x");
  });
});

describe("analytics cleanup", () => {
  it("clears Sentry and PostHog on any SIGNED_OUT event", async () => {
    await setup();
    await act(async () => {
      await mockAuthCb("SIGNED_OUT", null);
    });
    expect(mockClearUser).toHaveBeenCalled();
    expect(mockReset).toHaveBeenCalled();
  });
});

describe("signOut analytics mockOrder", () => {
  it("captures user_signed_out before posthog reset", async () => {
    const { result } = await setup();
    mockOrder.length = 0;
    await act(async () => {
      await result.current.signOut();
    });
    expect(mockOrder).toEqual(["capture:user_signed_out", "reset"]);
  });
});
