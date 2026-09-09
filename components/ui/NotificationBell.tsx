import React from "react";
import { StyleSheet, TouchableOpacity, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStyles } from "react-native-unistyles";
import { spacing } from "@/src/design-system";
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
  const { theme } = useStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
    >
      <Ionicons
        name={unreadCount > 0 ? "notifications" : "notifications-outline"}
        size={size}
        color={theme.colors.text}
      />
      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.badgeText, { color: theme.colors.white }]}>
            {unreadCount > 99 ? "99+" : unreadCount.toString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "relative",
    padding: spacing.sm,
    minWidth: 48,
    minHeight: 48,
  },
  badge: {
    position: "absolute",
    top: -spacing.xs,
    right: -spacing.xs,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 12, fontWeight: "700" },
});
