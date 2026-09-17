import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NotificationToast } from "./NotificationToast";
import { useNotifications } from "../../lib/contexts/NotificationContext";
import { NotificationData } from "../../lib/services/notificationService";
import { router } from "expo-router";
import { getNotificationRoute } from "../../lib/utils/notificationNavigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { notificationPreferencesDefaultValues } from "@/src/shared/schemas/notificationPreferencesSchema";

export function NotificationManager() {
  const { latestNotification } = useNotifications();
  const { user } = useAuth();
  const { data, isLoading } = useNotificationPreferences(user?.id);
  const preferences = useMemo(
    () => ({ ...notificationPreferencesDefaultValues, ...data }),
    [data],
  );
  const [currentToast, setCurrentToast] = useState<NotificationData | null>(
    null,
  );
  const [toastVisible, setToastVisible] = useState(false);
  const shownNotificationId = useRef<string | null>(null);

  const shouldShowNotification = useCallback(
    (notification: NotificationData): boolean => {
      switch (notification.notification_type) {
        case "mileage_log":
        case "fuel_log":
        case "service_log":
          return preferences.log_updates_enabled;
        case "group_member":
          return preferences.group_members_enabled;
        case "group_invite":
          return preferences.invitations_enabled;
        case "service_reminder":
          return preferences.service_reminders_enabled;
        case "mileage_reminder":
          return preferences.mileage_reminders_enabled;
        case "cost_alert":
          return preferences.cost_alerts_enabled;
        case "analytics_insight":
          return preferences.analytics_insights_enabled;
        default:
          return true;
      }
    },
    [preferences],
  );

  useEffect(() => {
    if (
      isLoading ||
      !latestNotification ||
      latestNotification.id === shownNotificationId.current
    ) {
      return;
    }
    shownNotificationId.current = latestNotification.id;

    if (
      !latestNotification.read &&
      preferences.in_app_toasts_enabled &&
      shouldShowNotification(latestNotification)
    ) {
      setCurrentToast(latestNotification);
      setToastVisible(true);
    }
  }, [
    latestNotification,
    isLoading,
    preferences.in_app_toasts_enabled,
    shouldShowNotification,
  ]);

  const handleToastDismiss = useCallback(() => {
    setToastVisible(false);
    setCurrentToast(null);
  }, []);

  const handleToastPress = useCallback((notification: NotificationData) => {
    const route = getNotificationRoute(notification);
    if (route) {
      router.push(route as any);
    }
  }, []);

  return (
    <NotificationToast
      notification={currentToast}
      visible={toastVisible}
      onDismiss={handleToastDismiss}
      onPress={handleToastPress}
    />
  );
}
