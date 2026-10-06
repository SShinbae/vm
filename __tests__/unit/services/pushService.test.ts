const mockGetPermissions = jest.fn();
const mockRequestPermissions = jest.fn();
const mockGetToken = jest.fn();
const mockSetHandler = jest.fn();
const mockAddResponseListener = jest.fn();
const mockLastResponse = jest.fn().mockReturnValue(null);
const mockClearLast = jest.fn();
const mockWarn = jest.fn();
const mockError = jest.fn();
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
  getLastNotificationResponse: (...a: unknown[]) => mockLastResponse(...a),
  clearLastNotificationResponse: (...a: unknown[]) => mockClearLast(...a),
  AndroidImportance: { MAX: 5 },
}));
jest.mock("@/lib/utils/logger", () => ({
  logger: {
    warn: (...a: unknown[]) => mockWarn(...a),
    error: (...a: unknown[]) => mockError(...a),
  },
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

import { Linking } from "react-native";
import { pushService } from "@/lib/services/pushService";

beforeEach(() => {
  jest.clearAllMocks();
  mockGetToken.mockResolvedValue({ data: "ExponentPushToken[abc]" });
  mockGetPermissions.mockResolvedValue({ granted: false, canAskAgain: true });
});

describe("pushService", () => {
  it("opens Settings instead of prompting once the user has denied", async () => {
    const openSettings = jest
      .spyOn(Linking, "openSettings")
      .mockResolvedValue(undefined);
    mockGetPermissions.mockResolvedValue({
      granted: false,
      canAskAgain: false,
    });
    await expect(pushService.requestPermission()).resolves.toBe(false);
    expect(openSettings).toHaveBeenCalledTimes(1);
    expect(mockRequestPermissions).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
    openSettings.mockRestore();
  });

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
    expect(mockWarn).toHaveBeenCalledWith(
      "Push: could not get Expo push token",
      expect.any(Error),
    );
  });

  it("logs when the logout delete returns an error", async () => {
    mockGetPermissions.mockResolvedValue({ granted: true });
    await pushService.syncUser();
    mockDeleteEq.mockResolvedValueOnce({ error: { message: "rls" } });
    await expect(pushService.onLogout()).resolves.toBeUndefined();
    expect(mockError).toHaveBeenCalledWith(
      "Push: failed to remove token on logout",
      { message: "rls" },
    );
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

  it("returns the launch tap's route once and clears it, without navigating", () => {
    mockLastResponse.mockReturnValue({
      notification: {
        request: { content: { data: { type: "group_member", groupId: "g1" } } },
      },
    });
    expect(pushService.consumeLaunchRoute()).toBe("/groups/g1");
    expect(mockClearLast).toHaveBeenCalledTimes(1);
    // The tabs layout navigates; consuming must not race the index redirect.
    expect(mockPush).not.toHaveBeenCalled();

    mockLastResponse.mockReturnValue(null);
    expect(pushService.consumeLaunchRoute()).toBeNull();
  });

  it("returns null when reading the launch tap throws", () => {
    mockLastResponse.mockImplementation(() => {
      throw new Error("UnavailabilityError");
    });
    expect(pushService.consumeLaunchRoute()).toBeNull();
    mockLastResponse.mockReset();
    mockLastResponse.mockReturnValue(null);
  });

  it("routes a tap while the app is running", async () => {
    mockGetPermissions.mockResolvedValue({ granted: false });
    // Fresh module so the module-level handlersReady flag is unset.
    let fresh!: typeof pushService;
    jest.isolateModules(() => {
      fresh = require("@/lib/services/pushService").pushService;
    });
    await fresh.syncUser();
    expect(mockLastResponse).not.toHaveBeenCalled();

    const listener = mockAddResponseListener.mock.calls[0][0];
    listener({
      notification: {
        request: { content: { data: { type: "group_member", groupId: "g2" } } },
      },
    });
    expect(mockPush).toHaveBeenCalledWith("/groups/g2");
  });
});
