const mockRequestPermission = jest.fn().mockResolvedValue(true);
const mockOptIn = jest.fn();
const mockLogin = jest.fn();

jest.mock("@/lib/config", () => ({
  config: { oneSignalAppId: "test-app-id" },
}));

jest.mock("react-native-onesignal", () => ({
  LogLevel: { Verbose: 6 },
  OneSignal: {
    Debug: { setLogLevel: jest.fn() },
    Notifications: {
      addEventListener: jest.fn(),
      requestPermission: mockRequestPermission,
    },
    User: {
      addEmail: jest.fn(),
      addTags: jest.fn(),
      pushSubscription: { optIn: mockOptIn },
    },
    initialize: jest.fn(),
    login: mockLogin,
  },
}));

jest.mock("@/services/supabaseClient", () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "user@example.com" } },
      }),
    },
  },
}));

import { oneSignalService } from "@/lib/services/oneSignalService";

describe("OneSignal mobile push", () => {
  it("opts in and links the device after permission is granted", async () => {
    await oneSignalService.initialize();

    await expect(oneSignalService.requestPermission()).resolves.toBe(true);
    expect(mockOptIn).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith("user-1");
  });
});
