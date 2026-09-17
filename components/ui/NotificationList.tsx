import { baseColors, withOpacity, spacing } from "@/src/design-system";
import React, { useEffect, useMemo, useState } from "react";
import { Modal as RNModal, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { useNotifications } from "../../lib/contexts/NotificationContext";
import {
  formatNotificationText,
  formatNotificationTitle,
  NotificationData,
} from "../../lib/services/notificationService";
import { formatDistanceToNow } from "../../lib/utils/dateUtils";
import { IconSymbol } from "./icon-symbol";
import { Pagination } from "./Pagination";
import { SnoozeMenu } from "../notifications/SnoozeMenu";

interface NotificationItemProps {
  notification: NotificationData;
  onPress?: (notification: NotificationData) => void;
}

function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const { styles, theme } = useStyles(itemStylesheet);
  const { markAsRead } = useNotifications();
  const [showSnooze, setShowSnooze] = useState(false);

  const handlePress = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    onPress?.(notification);
  };

  const action = notification.data?.action as string | undefined;

  const getActionLabel = (): string => {
    switch (action) {
      case "INSERT":
        return "New";
      case "UPDATE":
        return "Updated";
      case "DELETE":
        return "Deleted";
      default:
        return "";
    }
  };

  const getActionColor = (): string => {
    switch (action) {
      case "INSERT":
        return theme.colors.success;
      case "UPDATE":
        return theme.colors.info;
      case "DELETE":
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.container, !notification.read && styles.unreadContainer]}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.titleContainer}>
            <Text
              style={[styles.title, notification.read && styles.readTitle]}
              numberOfLines={1}
            >
              {formatNotificationTitle(notification.title)}
            </Text>
            {!notification.read && <View style={styles.unreadDot} />}
          </View>
          {action && (
            <View
              style={[
                styles.actionBadge,
                { backgroundColor: withOpacity(getActionColor(), 0.08) },
              ]}
            >
              <Text style={[styles.actionText, { color: getActionColor() }]}>
                {getActionLabel()}
              </Text>
            </View>
          )}
        </View>

        <Text
          style={[styles.message, notification.read && styles.readMessage]}
          numberOfLines={2}
        >
          {formatNotificationText(notification.body)}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.timestamp}>
            {formatDistanceToNow(new Date(notification.created_at))} ago
          </Text>

          <TouchableOpacity
            onPress={() => setShowSnooze(true)}
            style={styles.snoozeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Snooze this notification type"
          >
            <Text style={styles.snoozeButtonText}>Snooze</Text>
          </TouchableOpacity>
        </View>
      </View>

      <RNModal
        visible={showSnooze}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSnooze(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: withOpacity(baseColors.black, 0.4),
            justifyContent: "center",
            padding: spacing.xl,
          }}
          activeOpacity={1}
          onPress={() => setShowSnooze(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <SnoozeMenu
              notificationId={notification.id}
              notificationType={notification.notification_type}
              title={notification.title}
              body={notification.body}
              onClose={() => setShowSnooze(false)}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </RNModal>
    </TouchableOpacity>
  );
}

const itemStylesheet = createStyleSheet((theme) => ({
  container: {
    flexDirection: "row",
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  unreadContainer: {
    backgroundColor: theme.colors.primary + "08",
    borderColor: withOpacity(theme.colors.primary, 0.19),
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xs,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    flex: 1,
  },
  readTitle: {
    opacity: 0.7,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  actionBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  actionText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  message: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  readMessage: {
    opacity: 0.7,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timestamp: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  snoozeButton: {
    paddingHorizontal: theme.spacing.sm,
    height: 28,
    borderRadius: theme.borderRadius.md,
    backgroundColor: withOpacity(theme.colors.info, 0.08),
    alignItems: "center",
    justifyContent: "center",
  },
  snoozeButtonText: {
    color: theme.colors.info,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
}));

interface NotificationListProps {
  onNotificationPress?: (notification: NotificationData) => void;
}

const ITEMS_PER_PAGE = 5;

export function NotificationList({
  onNotificationPress,
}: NotificationListProps) {
  const { styles, theme } = useStyles(listStylesheet);
  const { notifications, isInitialized } = useNotifications();

  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE);

  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return notifications.slice(start, start + ITEMS_PER_PAGE);
  }, [notifications, currentPage]);

  // Clamp currentPage when notifications shrink (e.g. mark-all-read shifts state, realtime deletions)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingSpinner} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <IconSymbol
            name="bell.slash"
            size={48}
            color={theme.colors.textSecondary}
          />
        </View>
        <Text style={styles.emptyTitle}>You&apos;re all caught up</Text>
        <Text style={styles.emptyDescription}>
          Updates from your shared vehicles will show up here. Adjust how often
          you get pinged in your notification preferences.
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/profile?tab=Settings" as any)}
          style={styles.emptyCta}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Manage notification preferences"
        >
          <IconSymbol name="lock.shield" size={16} color={theme.colors.white} />
          <Text style={styles.emptyCtaText}>Manage preferences</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.listContainer}>
        {paginatedNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onPress={onNotificationPress}
          />
        ))}
      </View>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={notifications.length}
        pageSize={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />
    </View>
  );
}

const listStylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingVertical: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xxxl,
    gap: theme.spacing.lg,
  },
  loadingSpinner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: theme.colors.border,
    borderTopColor: theme.colors.primary,
  },
  loadingText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  emptyDescription: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: "center",
    maxWidth: 300,
    lineHeight: 24,
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
  },
  emptyCtaText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
}));
