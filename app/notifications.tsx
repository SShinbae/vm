import React from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useStyles } from "react-native-unistyles";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { NotificationList } from "@/components/ui/NotificationList";
import { NotificationData } from "@/lib/services/notificationService";

export default function NotificationsScreen() {
  const { theme } = useStyles();

  const handleNotificationPress = (notification: NotificationData) => {
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
        }
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginRight: theme.spacing.md, padding: theme.spacing.xs }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <IconSymbol
              name={Platform.OS === "ios" ? "chevron.left" : "arrow.left"}
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: theme.fontSize.xl,
              fontWeight: theme.fontWeight.semibold,
              color: theme.colors.text,
            }}
          >
            Notifications
          </Text>
        </View>
      </View>

      {/* Notification List */}
      <NotificationList onNotificationPress={handleNotificationPress} />
    </SafeAreaView>
  );
}
