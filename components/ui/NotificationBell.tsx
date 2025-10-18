import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "../../hooks/use-theme-color";
import { useNotifications } from "../../lib/contexts/NotificationContext";

interface NotificationBellProps {
  onPress?: () => void;
  size?: number;
}

export function NotificationBell({
  onPress,
  size = 24,
}: NotificationBellProps) {
  const { unreadCount } = useNotifications();
  const iconColor = useThemeColor({}, "text");
  const badgeColor = useThemeColor({}, "tint");

  return (
    <TouchableOpacity onPress={onPress} className="relative p-2">
      <Ionicons
        name={unreadCount > 0 ? "notifications" : "notifications-outline"}
        size={size}
        color={iconColor}
      />
      {unreadCount > 0 && (
        <View
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full items-center justify-center"
          style={{ backgroundColor: badgeColor }}
        >
          <Text className="text-white text-xs font-bold">
            {unreadCount > 99 ? "99+" : unreadCount.toString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
