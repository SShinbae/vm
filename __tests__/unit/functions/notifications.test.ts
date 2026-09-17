const mockNotificationInsert = jest.fn();

jest.mock("@/netlify/functions/_shared/supabaseAdmin", () => ({
  supabaseAdmin: { from: jest.fn() },
}));

import { supabaseAdmin } from "@/netlify/functions/_shared/supabaseAdmin";
import {
  deliverNotification,
  NotificationPreferences,
  sendOneSignalPush,
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

  it("uses OneSignal aliases and current API authentication", async () => {
    process.env.ONESIGNAL_REST_API_KEY = "test-key";
    process.env.ONESIGNAL_APP_ID = "test-app";
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValue({ ok: true } as Response);

    await expect(
      sendOneSignalPush({
        recipientIds: ["user-1"],
        title: "Title",
        body: "Body",
        webUrl: "https://example.com/notifications",
      }),
    ).resolves.toBe(true);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.onesignal.com/notifications?c=push");
    expect((options?.headers as Record<string, string>).Authorization).toBe(
      "Key test-key",
    );
    expect(JSON.parse(String(options?.body))).toMatchObject({
      include_aliases: { external_id: ["user-1"] },
      target_channel: "push",
      web_url: "https://example.com/notifications",
    });
    expect(JSON.parse(String(options?.body))).not.toHaveProperty("url");
    fetchMock.mockRestore();
  });
});
