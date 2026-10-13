const mockMaybeSingle = jest.fn();
const mockAbortSignal = jest.fn();
jest.mock("@/services/supabaseClient", () => {
  const q: any = {
    select: () => q,
    eq: () => q,
    abortSignal: (signal: AbortSignal) => {
      mockAbortSignal(signal);
      return q;
    },
    maybeSingle: () => mockMaybeSingle(),
  };
  return { supabase: { from: () => q } };
});

import {
  POST_LOGIN_TIMEOUT_MS,
  postLoginRoute,
} from "@/lib/utils/postLoginRoute";

describe("postLoginRoute", () => {
  it("falls back when the profile query never resolves", async () => {
    jest.useFakeTimers();
    try {
      mockMaybeSingle.mockReturnValueOnce(new Promise(() => {}));
      const pending = postLoginRoute("u", "/(tabs)");
      jest.advanceTimersByTime(POST_LOGIN_TIMEOUT_MS);
      await expect(pending).resolves.toBe("/(tabs)");
      const signal: AbortSignal = mockAbortSignal.mock.lastCall![0];
      expect(signal.aborted).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });
  it("sends a pending-deletion user to the pending page", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { deletion_scheduled_at: "2026-11-10" },
      error: null,
    });
    await expect(postLoginRoute("u", "/(tabs)")).resolves.toBe(
      "/account-pending-deletion",
    );
  });
  it("returns the fallback for an active user", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { deletion_scheduled_at: null },
      error: null,
    });
    await expect(postLoginRoute("u", "/(tabs)")).resolves.toBe("/(tabs)");
  });
  it("falls back on query error", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "x" },
    });
    await expect(postLoginRoute("u", "/x")).resolves.toBe("/x");
  });
});
