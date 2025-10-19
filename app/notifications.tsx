import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NotificationList } from "../components/ui/NotificationList";
import { useThemeColor } from "../hooks/use-theme-color";
import { NotificationData } from "../lib/services/notificationService";

export default function NotificationsScreen() {
  const backgroundColor = useThemeColor({}, "background") as string;
  const textColor = useThemeColor({}, "text") as string;

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
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-1"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"}
              size={24}
              color={textColor}
            />
          </TouchableOpacity>
          <Text className="text-xl font-semibold" style={{ color: textColor }}>
            Notifications
          </Text>
        </View>
      </View>

      {/* Notification List */}
      <NotificationList onNotificationPress={handleNotificationPress} />
    </SafeAreaView>
  );
}
