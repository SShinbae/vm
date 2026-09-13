import {
  NotificationData,
  notificationService,
} from "@/lib/services/notificationService";
import { supabase } from "@/services/supabaseClient";

const mockRemoveChannel = jest.fn();

const notification: NotificationData = {
  id: "notification-1",
  user_id: "user-1",
  notification_type: "fuel_log",
  title: "Fuel log added",
  body: "A fuel log was added",
  data: null,
  read: false,
  created_at: "2026-09-13T00:00:00.000Z",
};

describe("notificationService", () => {
  beforeEach(() => {
    (supabase as any).removeChannel = mockRemoveChannel;
    notificationService.cleanup();
    mockRemoveChannel.mockClear();
  });

  it("adds and removes notification callbacks", () => {
    const callback = jest.fn();

    notificationService.addCallback(callback);
    (notificationService as any).notifyCallbacks(notification);
    notificationService.removeCallback(callback);
    (notificationService as any).notifyCallbacks(notification);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(notification);
  });

  it("removes active channels during cleanup", () => {
    const channels = [{ id: "channel-1" }, { id: "channel-2" }];
    (notificationService as any).channels = channels;

    notificationService.cleanup();

    expect(mockRemoveChannel.mock.calls.map(([channel]) => channel)).toEqual(
      channels,
    );
  });
});
