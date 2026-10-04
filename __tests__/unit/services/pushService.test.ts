const mockGetPermissions = jest.fn();
const mockRequestPermissions = jest.fn();
const mockGetToken = jest.fn();
const mockSetHandler = jest.fn();
const mockAddResponseListener = jest.fn();
const mockLastResponse = jest.fn().mockResolvedValue(null);
const mockRpc = jest.fn().mockResolvedValue({ error: null });
const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
const mockPush = jest.fn();

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: (...a: unknown[]) => mockGetPermissions(...a),
  requestPermissionsAsync: (...a: unknown[]) => mockRequestPermissions(...a),
  getExpoPushTokenAsync: (...a: unknown[]) => mockGetToken(...a),
  setNotificationHandler: (...a: unknown[]) => mockSetHandler(...a),
  setNotificationChannelAsync: jest.fn(),
  addNotificationResponseReceivedListener: (...a: unknown[]) =>
    mockAddResponseListener(...a),
  getLastNotificationResponseAsync: (...a: unknown[]) => mockLastResponse(...a),
  AndroidImportance: { MAX: 5 },
}));
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: { projectId: "project-1" } } } },
}));
jest.mock("expo-router", () => ({
  router: { push: (...a: unknown[]) => mockPush(...a) },
}));
jest.mock("@/services/supabaseClient", () => ({
  supabase: {
    rpc: (...a: unknown[]) => mockRpc(...a),
    from: () => ({
      delete: () => ({ eq: (...a: unknown[]) => mockDeleteEq(...a) }),
    }),
  },
}));

import { pushService } from "@/lib/services/pushService";

beforeEach(() => {
  jest.clearAllMocks();
  mockGetToken.mockResolvedValue({ data: "ExponentPushToken[abc]" });
});

describe("pushService", () => {
  it("registers the token after permission is granted", async () => {
    mockRequestPermissions.mockResolvedValue({ granted: true });
    await expect(pushService.requestPermission()).resolves.toBe(true);
    expect(mockGetToken).toHaveBeenCalledWith({ projectId: "project-1" });
    expect(mockRpc).toHaveBeenCalledWith("register_push_token", {
      p_token: "ExponentPushToken[abc]",
      p_device_type: "ios",
    });
  });

  it("does not register when permission is denied", async () => {
    mockRequestPermissions.mockResolvedValue({ granted: false });
    await expect(pushService.requestPermission()).resolves.toBe(false);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("syncUser never prompts and skips without permission", async () => {
    mockGetPermissions.mockResolvedValue({ granted: false });
    await pushService.syncUser();
    expect(mockRequestPermissions).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("syncUser re-registers when permission already granted (account switch)", async () => {
    mockGetPermissions.mockResolvedValue({ granted: true });
    await pushService.syncUser();
    expect(mockRpc).toHaveBeenCalledWith(
      "register_push_token",
      expect.objectContaining({ p_token: "ExponentPushToken[abc]" }),
    );
  });

  it("survives a token failure (simulator)", async () => {
    mockRequestPermissions.mockResolvedValue({ granted: true });
    mockGetToken.mockRejectedValue(
      new Error("no aps-environment on simulator"),
    );
    await expect(pushService.requestPermission()).resolves.toBe(true);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("deletes this device's token on logout and never throws", async () => {
    mockGetPermissions.mockResolvedValue({ granted: true });
    await pushService.syncUser();
    mockDeleteEq.mockRejectedValueOnce(new Error("offline"));
    await expect(pushService.onLogout()).resolves.toBeUndefined();
    expect(mockDeleteEq).toHaveBeenCalledWith(
      "token",
      "ExponentPushToken[abc]",
    );
  });

  it("routes a tap, including the one that cold-started the app", async () => {
    mockLastResponse.mockResolvedValue({
      notification: {
        request: { content: { data: { type: "group_member", groupId: "g1" } } },
      },
    });
    mockGetPermissions.mockResolvedValue({ granted: false });
    // Fresh module so the module-level handlersReady flag is unset.
    let fresh!: typeof pushService;
    jest.isolateModules(() => {
      fresh = require("@/lib/services/pushService").pushService;
    });
    await fresh.syncUser();
    await new Promise(process.nextTick);
    expect(mockPush).toHaveBeenCalledWith("/groups/g1");

    const listener = mockAddResponseListener.mock.calls[0][0];
    listener({
      notification: {
        request: { content: { data: { type: "group_member", groupId: "g2" } } },
      },
    });
    expect(mockPush).toHaveBeenCalledWith("/groups/g2");
  });
});
