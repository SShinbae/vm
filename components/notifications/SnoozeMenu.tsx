import React, { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStyles } from "react-native-unistyles";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useSnoozeNotificationType } from "@/hooks/useNotificationPreferences";
import { useNotifications } from "@/lib/contexts/NotificationContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { scheduleSnooze } from "@/lib/services/localNotificationService";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Modal } from "@/components/ui/Modal";

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
  const { isWeb, isMobile } = useResponsiveLayout();
  const compact = !isWeb || isMobile;
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const snoozeMutation = useSnoozeNotificationType();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const pending = useRef(false);
  const mounted = useRef(true);
  const initialUser = useRef(user?.id);
  const currentUser = useRef(user?.id);
  currentUser.current = user?.id;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!user?.id || user.id !== initialUser.current) onClose();
  }, [user?.id, onClose]);

  const close = () => {
    if (!pending.current) onClose();
  };
  const handleSnooze = async (days: number) => {
    if (!user?.id || pending.current) return;
    const userId = user.id;
    pending.current = true;
    setSaving(true);
    setError(false);
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + days);
    try {
      await snoozeMutation.mutateAsync({
        userId,
        notificationType,
        snoozedUntil: snoozeUntil.toISOString(),
      });
      if (!mounted.current || currentUser.current !== userId) return;
      await scheduleSnooze({
        notificationId,
        title,
        body,
        snoozeUntil,
        data: { type: notificationType },
      });
      if (!mounted.current || currentUser.current !== userId) return;
      markAsRead(notificationId);
      onClose();
    } catch {
      if (mounted.current && currentUser.current === userId) setError(true);
    } finally {
      pending.current = false;
      if (mounted.current && currentUser.current === userId) setSaving(false);
    }
  };

  return (
    <Modal
      visible
      onClose={close}
      variant={compact ? "bottom-sheet" : "default"}
      size="small"
      showCloseButton={false}
      closeOnBackdrop={!saving}
      contentStyle={{
        padding: 0,
        maxHeight: height - insets.top,
        paddingBottom: compact ? insets.bottom : 0,
      }}
    >
      <ScrollView
        style={{
          maxHeight: Math.max(120, height - insets.top - insets.bottom - 96),
        }}
        contentContainerStyle={{ padding: 16, gap: 12 }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Text
            accessibilityRole="header"
            style={{
              fontSize: theme.fontSize.lg,
              fontWeight: "700",
              color: theme.colors.text,
              flex: 1,
            }}
          >
            Snooze
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Close snooze"
            accessibilityState={{ disabled: saving }}
            disabled={saving}
            onPress={close}
            style={{
              minWidth: 48,
              minHeight: 48,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
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
          }}
        >
          Pause this type of notification for:
        </Text>
        {error && (
          <Text accessibilityRole="alert" style={{ color: theme.colors.error }}>
            Couldn&apos;t snooze notifications. Please try again.
          </Text>
        )}
        {saving && (
          <Text style={{ color: theme.colors.textSecondary }}>
            Saving snooze…
          </Text>
        )}
        {SNOOZE_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.days}
            onPress={() => {
              void handleSnooze(option.days);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Snooze for ${option.label}`}
            disabled={saving}
            accessibilityState={{ disabled: saving }}
            style={{
              minHeight: 48,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 12,
              borderRadius: theme.borderRadius.md,
              backgroundColor: theme.colors.background,
            }}
          >
            <IconSymbol name="clock" size={18} color={theme.colors.primary} />
            <Text
              style={{
                fontSize: theme.fontSize.base,
                color: theme.colors.text,
                fontWeight: "600",
                flex: 1,
              }}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Modal>
  );
}
