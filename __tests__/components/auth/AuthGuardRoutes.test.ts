jest.mock("@/lib/contexts/AuthContext", () => ({ useAuth: jest.fn() }));

import { getRouteState } from "@/components/AuthGuard";

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
});
