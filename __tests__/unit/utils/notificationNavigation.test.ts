import {
  getNotificationRoute,
  getPushNotificationRoute,
} from "../../../lib/utils/notificationNavigation";

const notification = (overrides: Record<string, unknown>) =>
  ({
    notification_type: "analytics_insight",
    related_vehicle_id: null,
    related_group_id: null,
    action_url: null,
    data: null,
    ...overrides,
  }) as any;

describe("notification navigation", () => {
  it("routes every notification family", () => {
    expect(getNotificationRoute(notification({}))).toBe("/analytics/fuel");
    expect(
      getNotificationRoute(notification({ notification_type: "cost_alert" })),
    ).toBe("/analytics/costs");
    expect(
      getNotificationRoute(
        notification({
          notification_type: "fuel_log",
          related_vehicle_id: "vehicle-1",
        }),
      ),
    ).toBe("/vehicles/vehicle-1");
    expect(
      getNotificationRoute(
        notification({
          notification_type: "group_member",
          related_group_id: "group-1",
        }),
      ),
    ).toBe("/groups/group-1");
    expect(
      getNotificationRoute(
        notification({
          notification_type: "service_reminder",
          related_vehicle_id: "vehicle-1",
          data: { serviceLogId: "service-1" },
        }),
      ),
    ).toBe("/logs/service/service-1");
  });

  it("uses safe internal fallbacks and rejects external URLs", () => {
    expect(
      getNotificationRoute(
        notification({ notification_type: "unknown", action_url: "/logs" }),
      ),
    ).toBe("/logs");
    expect(
      getNotificationRoute(
        notification({
          notification_type: "unknown",
          action_url: "https://example.com",
        }),
      ),
    ).toBeNull();
  });

  it("routes push payloads without requiring an id", () => {
    expect(
      getPushNotificationRoute({
        type: "log_update",
        vehicleId: "vehicle-1",
      }),
    ).toBe("/vehicles/vehicle-1");
    expect(getPushNotificationRoute({ type: "group_invite" })).toBe(
      "/notifications",
    );
    expect(getPushNotificationRoute({ type: "analytics_insight" })).toBe(
      "/analytics/fuel",
    );
  });
});
