const mockNotificationInsert = jest.fn();

jest.mock("@/netlify/functions/_shared/supabaseAdmin", () => ({
  supabaseAdmin: { from: jest.fn() },
}));

import { supabaseAdmin } from "@/netlify/functions/_shared/supabaseAdmin";
import {
  deliverNotification,
  NotificationPreferences,
  sendExpoPush,
  shouldDeliverNotification,
} from "@/netlify/functions/_shared/notifications";

const mockFrom = supabaseAdmin.from as jest.Mock;

const preferences: NotificationPreferences = {
  user_id: "user-1",
  service_reminders_enabled: true,
  mileage_reminders_enabled: true,
  cost_alerts_enabled: true,
  analytics_insights_enabled: true,
  log_updates_enabled: true,
  group_members_enabled: true,
  invitations_enabled: true,
  push_notifications_enabled: true,
  in_app_toasts_enabled: true,
  service_reminder_days: [30, 7, 3],
  mileage_reminder_thresholds: [5000, 1000],
  monthly_spending_threshold: null,
  fuel_price_alert_percentage: 20,
  analytics_frequency: "weekly",
  quiet_hours_enabled: false,
  quiet_hours_start: "22:00",
  quiet_hours_end: "07:00",
  quiet_days: [],
  timezone: "UTC",
  max_per_type_per_day: 3,
  snoozed_types: {},
};

describe("notification delivery rules", () => {
  beforeEach(() => {
    mockFrom.mockReset();
    mockNotificationInsert.mockReset();
  });

  it("respects type, push, snooze, and quiet-hour preferences", () => {
    expect(
      shouldDeliverNotification(
        { ...preferences, mileage_reminders_enabled: false },
        "mileage_reminder",
      ).deliver,
    ).toBe(false);
    expect(
      shouldDeliverNotification(
        { ...preferences, push_notifications_enabled: false },
        "fuel_log",
      ).deliver,
    ).toBe(false);
    expect(
      shouldDeliverNotification(
        {
          ...preferences,
          snoozed_types: { fuel_log: "2030-01-02T00:00:00.000Z" },
        },
        "fuel_log",
        new Date("2030-01-01T00:00:00.000Z"),
      ).deliver,
    ).toBe(false);
    expect(
      shouldDeliverNotification(
        { ...preferences, quiet_hours_enabled: true },
        "fuel_log",
        new Date("2030-01-01T23:00:00.000Z"),
      ).deliver,
    ).toBe(false);
  });

  it("creates no record when the notification type is disabled", async () => {
    await expect(
      deliverNotification({
        userId: "user-1",
        notificationKey: "reminder-1",
        notificationType: "mileage_reminder",
        title: "Mileage reminder",
        body: "Due soon",
        preferences: { ...preferences, mileage_reminders_enabled: false },
      }),
    ).resolves.toBe("skipped");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("atomically skips a notification that was already claimed", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "notifications") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                gte: async () => ({ count: 0, error: null }),
              }),
            }),
          }),
          insert: mockNotificationInsert,
        };
      }
      return {
        insert: async () => ({ error: { code: "23505" } }),
      };
    });

    await expect(
      deliverNotification({
        userId: "user-1",
        notificationKey: "event-1",
        notificationType: "fuel_log",
        title: "Fuel log",
        body: "Added",
        preferences,
      }),
    ).resolves.toBe("skipped");
    expect(mockNotificationInsert).not.toHaveBeenCalled();
  });
});

describe("sendExpoPush", () => {
  const mockIn = jest.fn();
  const mockDeleteIn = jest.fn().mockResolvedValue({ error: null });

  function mockTokens(tokens: string[], error: unknown = null) {
    mockIn.mockResolvedValue({
      data: tokens.map((token) => ({ token })),
      error,
    });
    mockFrom.mockImplementation((table: string) => {
      if (table !== "push_tokens") throw new Error(`unexpected table ${table}`);
      return {
        select: () => ({ in: mockIn }),
        delete: () => ({ in: mockDeleteIn }),
      };
    });
  }

  function expoResponse(tickets: unknown[], ok = true, status = 200) {
    return {
      ok,
      status,
      json: async () => ({ data: tickets }),
      text: async () => "err",
    } as unknown as Response;
  }

  afterEach(() => {
    jest.restoreAllMocks();
    mockDeleteIn.mockClear();
    delete process.env.EXPO_ACCESS_TOKEN;
  });

  it("posts the user's tokens to Expo and reports delivery", async () => {
    mockTokens(["ExponentPushToken[a]"]);
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(expoResponse([{ status: "ok", id: "t1" }]));

    await expect(
      sendExpoPush({
        recipientIds: ["user-1"],
        title: "Title",
        body: "Body",
        data: { type: "log_update" },
      }),
    ).resolves.toBe(true);

    expect(mockIn).toHaveBeenCalledWith("user_id", ["user-1"]);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://exp.host/--/api/v2/push/send");
    expect(JSON.parse(String(options?.body))).toEqual([
      {
        to: "ExponentPushToken[a]",
        title: "Title",
        body: "Body",
        data: { type: "log_update" },
        sound: "default",
        // High priority so Android wakes a backgrounded/frozen app to show it.
        priority: "high",
        channelId: "default",
      },
    ]);
    expect(
      (options?.headers as Record<string, string>).Authorization,
    ).toBeUndefined();
  });

  it("sends the access token header when configured", async () => {
    process.env.EXPO_ACCESS_TOKEN = "expo-secret";
    mockTokens(["ExponentPushToken[a]"]);
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(expoResponse([{ status: "ok" }]));
    await sendExpoPush({ recipientIds: ["user-1"], title: "T", body: "B" });
    expect(
      (fetchMock.mock.calls[0][1]?.headers as Record<string, string>)
        .Authorization,
    ).toBe("Bearer expo-secret");
  });

  it("returns false without calling Expo when the user has no tokens", async () => {
    mockTokens([]);
    const fetchMock = jest.spyOn(global, "fetch");
    await expect(
      sendExpoPush({ recipientIds: ["user-1"], title: "T", body: "B" }),
    ).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns false when tokens cannot be loaded", async () => {
    mockTokens([], { message: "db down" });
    await expect(
      sendExpoPush({ recipientIds: ["user-1"], title: "T", body: "B" }),
    ).resolves.toBe(false);
  });

  it("deletes tokens Expo reports as DeviceNotRegistered", async () => {
    mockTokens(["ExponentPushToken[dead]", "ExponentPushToken[live]"]);
    jest.spyOn(global, "fetch").mockResolvedValue(
      expoResponse([
        {
          status: "error",
          message: "gone",
          details: { error: "DeviceNotRegistered" },
        },
        { status: "ok" },
      ]),
    );
    await expect(
      sendExpoPush({ recipientIds: ["user-1"], title: "T", body: "B" }),
    ).resolves.toBe(true);
    expect(mockDeleteIn).toHaveBeenCalledWith("token", [
      "ExponentPushToken[dead]",
    ]);
  });

  it("batches by 100 and keeps going when one batch fails", async () => {
    const tokens = Array.from(
      { length: 150 },
      (_, i) => `ExponentPushToken[${i}]`,
    );
    mockTokens(tokens);
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(expoResponse([], false, 500))
      .mockResolvedValueOnce(expoResponse(Array(50).fill({ status: "ok" })));
    await expect(
      sendExpoPush({ recipientIds: ["user-1"], title: "T", body: "B" }),
    ).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toHaveLength(
      100,
    );
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toHaveLength(
      50,
    );
  });

  it("returns false when every ticket fails", async () => {
    mockTokens(["ExponentPushToken[a]"]);
    jest.spyOn(global, "fetch").mockResolvedValue(
      expoResponse([
        {
          status: "error",
          message: "bad",
          details: { error: "MessageRateExceeded" },
        },
      ]),
    );
    await expect(
      sendExpoPush({ recipientIds: ["user-1"], title: "T", body: "B" }),
    ).resolves.toBe(false);
    expect(mockDeleteIn).not.toHaveBeenCalled();
  });
});
