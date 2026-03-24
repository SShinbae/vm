import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useStyles } from "react-native-unistyles";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useSnoozeNotificationType } from "@/hooks/useNotificationPreferences";
import { useNotifications } from "@/lib/contexts/NotificationContext";
import { scheduleSnooze } from "@/lib/services/localNotificationService";
import { IconSymbol } from "@/components/ui/icon-symbol";

const SNOOZE_OPTIONS = [
  { label: "1 day", days: 1 },
  { label: "3 days", days: 3 },
  { label: "1 week", days: 7 },
];

interface SnoozeMenuProps {
  notificationId: string;
  notificationType: string;
  title: string;
  body: string;
  onClose: () => void;
}

export function SnoozeMenu({
  notificationId,
  notificationType,
  title,
  body,
  onClose,
}: SnoozeMenuProps) {
  const { theme } = useStyles();
  const { user } = useAuth();
  const { markAsRead } = useNotifications();
  const snoozeMutation = useSnoozeNotificationType();

  const handleSnooze = async (days: number) => {
    if (!user?.id) return;

    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + days);

    // Update preferences in DB
    snoozeMutation.mutate({
      userId: user.id,
      notificationType,
      snoozedUntil: snoozeUntil.toISOString(),
    });

    // Schedule local notification at snooze-until time
    await scheduleSnooze({
      notificationId,
      title,
      body,
      snoozeUntil,
      data: { type: notificationType },
    });

    // Mark current notification as read
    markAsRead(notificationId);

    onClose();
  };

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.lg,
        gap: theme.spacing.sm,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: theme.spacing.sm,
        }}
      >
        <Text
          style={{
            fontSize: theme.fontSize.lg,
            fontWeight: theme.fontWeight.bold,
            color: theme.colors.text,
          }}
        >
          Snooze
        </Text>
        <TouchableOpacity onPress={onClose}>
          <IconSymbol
            name="xmark"
            size={20}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <Text
        style={{
          fontSize: theme.fontSize.sm,
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing.md,
        }}
      >
        Pause this type of notification for:
      </Text>

      {SNOOZE_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.days}
          onPress={() => handleSnooze(option.days)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.md,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            borderRadius: theme.borderRadius.md,
            backgroundColor: theme.colors.background,
          }}
          activeOpacity={0.7}
        >
          <IconSymbol name="clock" size={18} color={theme.colors.primary} />
          <Text
            style={{
              fontSize: theme.fontSize.base,
              color: theme.colors.text,
              fontWeight: theme.fontWeight.medium,
            }}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
