import React, { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NotificationToast } from "./NotificationToast";
import { useNotifications } from "../../lib/contexts/NotificationContext";
import { NotificationData } from "../../lib/services/notificationService";
import { router } from "expo-router";

export function NotificationManager() {
  const { notifications } = useNotifications();
  const [currentToast, setCurrentToast] = useState<NotificationData | null>(
    null,
  );
  const [toastVisible, setToastVisible] = useState(false);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const [notificationPrefs, setNotificationPrefs] = useState({
    logUpdates: true,
    groupMembers: true,
    invitations: true,
    inAppToasts: true,
  });

  // Load notification preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const stored = await AsyncStorage.getItem("notification_preferences");
        if (stored) {
          const prefs = JSON.parse(stored);
          setNotificationPrefs(prefs);
        }
      } catch (error) {
        console.error("Error loading notification preferences:", error);
      }
    };
    loadPreferences();
  }, []);

  const shouldShowNotification = useCallback(
    (notification: NotificationData): boolean => {
      switch (notification.type) {
        case "mileage_log":
        case "fuel_log":
        case "service_log":
          return notificationPrefs.logUpdates;
        case "group_member":
          return notificationPrefs.groupMembers;
        case "group_invite":
          return notificationPrefs.invitations;
        default:
          return true;
      }
    },
    [notificationPrefs],
  );

  // Show toast for new notifications
  useEffect(() => {
    if (
      notifications.length > lastNotificationCount &&
      notifications.length > 0
    ) {
      const latestNotification = notifications[0];

      // Check if toasts are disabled
      if (!notificationPrefs.inAppToasts) {
        setLastNotificationCount(notifications.length);
        return;
      }

      // Check if this type of notification is enabled
      const shouldShow = shouldShowNotification(latestNotification);

      // Only show toast if it's unread, not already showing, and enabled
      if (!latestNotification.read && !toastVisible && shouldShow) {
        setCurrentToast(latestNotification);
        setToastVisible(true);
      }
    }
    setLastNotificationCount(notifications.length);
  }, [
    notifications,
    lastNotificationCount,
    toastVisible,
    notificationPrefs,
    shouldShowNotification,
  ]);

  const handleToastDismiss = useCallback(() => {
    setToastVisible(false);
    setCurrentToast(null);
  }, []);

  const handleToastPress = useCallback((notification: NotificationData) => {
    // Navigate based on notification type
    switch (notification.type) {
      case "mileage_log":
      case "fuel_log":
      case "service_log":
        if (notification.vehicleId) {
          router.push(`/vehicles/${notification.vehicleId}`);
        }
        break;
      case "group_member":
      case "group_invite":
        if (notification.groupId) {
          router.push(`/groups/${notification.groupId}`);
        } else if (notification.type === "group_invite") {
          // For group invitations, go to the groups screen where invitations are shown
          router.push("/groups");
        }
        break;
      default:
        break;
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
