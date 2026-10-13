jest.mock("@/lib/contexts/AuthContext", () => ({ useAuth: jest.fn() }));

import {
  getRouteState,
  pendingDeletionRedirect,
  shouldRetryProfile,
} from "@/components/AuthGuard";

describe("AuthGuard route classification", () => {
  it("treats /auth/confirm as an auth page so signed-out users are not bounced to login", () => {
    const state = getRouteState(["auth", "confirm"]);

    expect(state.isOnAuthPage).toBe(true);
    // Not in the (auth) group: signed-in users must not be sent to tabs.
    expect(state.inAuthGroup).toBe(false);
  });

  it("still treats protected routes as non-auth pages", () => {
    expect(getRouteState(["(tabs)", "vehicles"]).isOnAuthPage).toBe(false);
  });

  it("treats /privacy and /terms as public pages anyone can open", () => {
    expect(getRouteState(["privacy"]).inPublicPage).toBe(true);
    expect(getRouteState(["terms"]).inPublicPage).toBe(true);
    expect(getRouteState(["delete-account"]).inPublicPage).toBe(true);
    expect(getRouteState(["(tabs)", "profile"]).inPublicPage).toBe(false);
  });
});

describe("pendingDeletionRedirect", () => {
  const user = (deletion_scheduled_at: string | null | undefined) =>
    ({
      id: "u",
      email: "u@x",
      username: null,
      profile:
        deletion_scheduled_at === undefined
          ? undefined
          : ({ deletion_scheduled_at } as never),
    }) as never;

  it("sends a pending user to the pending screen from anywhere, including auth pages", () => {
    expect(
      pendingDeletionRedirect(user("2026-11-10T00:00:00Z"), ["(tabs)"]),
    ).toBe("/account-pending-deletion");
    expect(
      pendingDeletionRedirect(user("2026-11-10T00:00:00Z"), [
        "(auth)",
        "login",
      ]),
    ).toBe("/account-pending-deletion");
  });
  it("leaves a pending user on the pending screen and public pages", () => {
    expect(
      pendingDeletionRedirect(user("2026-11-10T00:00:00Z"), [
        "account-pending-deletion",
      ]),
    ).toBeNull();
    expect(
      pendingDeletionRedirect(user("2026-11-10T00:00:00Z"), ["privacy"]),
    ).toBeNull();
  });
  it("does nothing for active users, signed-out users, or while the profile is still loading", () => {
    expect(pendingDeletionRedirect(user(null), ["(tabs)"])).toBeNull();
    expect(pendingDeletionRedirect(null, ["(tabs)"])).toBeNull();
    expect(pendingDeletionRedirect(user(undefined), ["(tabs)"])).toBeNull();
  });
  it("sends a user who is no longer pending away from the pending screen", () => {
    expect(
      pendingDeletionRedirect(user(null), ["account-pending-deletion"]),
    ).toBe("/(tabs)");
  });
});

describe("shouldRetryProfile", () => {
  const u = (profile?: object) => ({ id: "u", profile }) as never;
  it("retries once for a user whose profile never loaded", () => {
    expect(shouldRetryProfile(u(), null, true)).toBe(true);
    expect(shouldRetryProfile(u(), "other", true)).toBe(true);
    expect(shouldRetryProfile(u(), "u", true)).toBe(false);
  });
  it("does not retry without a user or when a profile exists", () => {
    expect(shouldRetryProfile(null, null, true)).toBe(false);
    expect(shouldRetryProfile(u({}), null, true)).toBe(false);
  });
  it("waits until auth has settled", () => {
    expect(shouldRetryProfile(u(), null, false)).toBe(false);
  });
});
