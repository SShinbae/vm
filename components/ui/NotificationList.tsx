import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal as RNModal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { useNotifications } from "../../lib/contexts/NotificationContext";
import { NotificationData } from "../../lib/services/notificationService";
import { formatDistanceToNow } from "../../lib/utils/dateUtils";
import { IconSymbol } from "./icon-symbol";
import { SnoozeMenu } from "../notifications/SnoozeMenu";

interface NotificationItemProps {
  notification: NotificationData;
  onPress?: (notification: NotificationData) => void;
}

function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const { styles, theme } = useStyles(itemStylesheet);
  const { markAsRead, clearNotification } = useNotifications();
  const [showSnooze, setShowSnooze] = useState(false);

  const handlePress = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    onPress?.(notification);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => clearNotification(notification.id),
        },
      ],
    );
  };

  const getIcon = (): string => {
    switch (notification.notification_type) {
      case "mileage_log":
        return "speedometer";
      case "fuel_log":
        return "fuelpump.fill";
      case "service_log":
        return "wrench.fill";
      case "group_member":
        return "person.2.fill";
      case "group_invite":
        return "envelope.fill";
      case "service_reminder":
        return "calendar.badge.clock";
      case "mileage_reminder":
        return "gauge.open.with.lines.needle.33percent";
      case "cost_alert":
        return "dollarsign.circle.fill";
      case "analytics_insight":
        return "chart.bar.fill";
      default:
        return "bell.fill";
    }
  };

  const getIconColor = (): string => {
    switch (notification.notification_type) {
      case "mileage_log":
        return theme.colors.primary;
      case "fuel_log":
        return theme.colors.warning;
      case "service_log":
        return theme.colors.error;
      case "group_member":
        return theme.colors.success;
      case "group_invite":
        return theme.colors.info;
      case "service_reminder":
        return theme.colors.warning;
      case "mileage_reminder":
        return theme.colors.primary;
      case "cost_alert":
        return theme.colors.error;
      case "analytics_insight":
        return theme.colors.info;
      default:
        return theme.colors.primary;
    }
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
      {/* Icon */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: getIconColor() + "15" },
        ]}
      >
        <IconSymbol name={getIcon() as any} size={20} color={getIconColor()} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.titleContainer}>
            <Text
              style={[styles.title, notification.read && styles.readTitle]}
              numberOfLines={1}
            >
              {notification.title}
            </Text>
            {!notification.read && <View style={styles.unreadDot} />}
          </View>
          {action && (
            <View
              style={[
                styles.actionBadge,
                { backgroundColor: getActionColor() + "15" },
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
          {notification.body}
        </Text>

        <View style={styles.footer}>
          <View style={styles.timestampContainer}>
            <IconSymbol
              name="clock"
              size={12}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.timestamp}>
              {formatDistanceToNow(new Date(notification.created_at))} ago
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: theme.spacing.xs }}>
            <TouchableOpacity
              onPress={() => setShowSnooze(true)}
              style={styles.deleteButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <IconSymbol
                name="clock"
                size={14}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.deleteButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <IconSymbol
                name="xmark"
                size={14}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Snooze Menu Modal */}
      <RNModal
        visible={showSnooze}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSnooze(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            padding: 24,
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
    borderColor: theme.colors.primary + "30",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
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
    paddingVertical: 2,
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
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  timestamp: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
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
  const { notifications, isInitialized, markAllAsRead, clearAllNotifications } =
    useNotifications();

  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE);

  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return notifications.slice(start, start + ITEMS_PER_PAGE);
  }, [notifications, currentPage]);

  // Clamp currentPage when notifications shrink (e.g. deletions, clear all)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const hasUnreadNotifications = notifications.some((n) => !n.read);

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: clearAllNotifications,
        },
      ],
    );
  };

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
        <Text style={styles.emptyTitle}>No notifications</Text>
        <Text style={styles.emptyDescription}>
          You&apos;ll see notifications here when group members update logs or
          when you receive invitations.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Actions Bar */}
      <View style={styles.actionsBar}>
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {totalPages > 1
              ? `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}\u2013${Math.min(currentPage * ITEMS_PER_PAGE, notifications.length)} of ${notifications.length}`
              : `${notifications.length} notification${notifications.length !== 1 ? "s" : ""}`}
          </Text>
          {hasUnreadNotifications && (
            <Text style={styles.unreadCountText}>
              ({notifications.filter((n) => !n.read).length} unread)
            </Text>
          )}
        </View>

        <View style={styles.actionsContainer}>
          {hasUnreadNotifications && (
            <TouchableOpacity
              onPress={markAllAsRead}
              style={styles.markAllButton}
              activeOpacity={0.7}
            >
              <IconSymbol
                name="checkmark.circle"
                size={16}
                color={theme.colors.white}
              />
              <Text style={styles.markAllButtonText}>Mark all read</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleClearAll}
            style={styles.clearAllButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <IconSymbol
              name="trash"
              size={18}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications List */}
      <View style={styles.listContainer}>
        {paginatedNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onPress={onNotificationPress}
          />
        ))}
      </View>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </View>
  );
}

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  const { styles, theme } = useStyles(listStylesheet);

  const getPageNumbers = (): (number | "ellipsis-start" | "ellipsis-end")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [1];
    if (currentPage > 3) {
      pages.push("ellipsis-start");
    }
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) {
      pages.push("ellipsis-end");
    }
    pages.push(totalPages);
    return pages;
  };

  return (
    <View style={styles.paginationContainer}>
      {/* Prev Button */}
      <TouchableOpacity
        onPress={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={[
          styles.navButton,
          currentPage === 1 && styles.pageButtonDisabled,
        ]}
        activeOpacity={0.7}
      >
        <IconSymbol
          name="chevron.left"
          size={16}
          color={
            currentPage === 1 ? theme.colors.textSecondary : theme.colors.text
          }
        />
      </TouchableOpacity>

      {/* Page Numbers */}
      {getPageNumbers().map((page, index) =>
        typeof page === "string" ? (
          <Text key={page} style={styles.ellipsisText}>
            ...
          </Text>
        ) : (
          <TouchableOpacity
            key={`page-${page}`}
            onPress={() => onPageChange(page)}
            style={[
              styles.pageButton,
              currentPage === page && styles.pageButtonActive,
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.pageButtonText,
                currentPage === page && styles.pageButtonTextActive,
              ]}
            >
              {page}
            </Text>
          </TouchableOpacity>
        ),
      )}

      {/* Next Button */}
      <TouchableOpacity
        onPress={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={[
          styles.navButton,
          currentPage === totalPages && styles.pageButtonDisabled,
        ]}
        activeOpacity={0.7}
      >
        <IconSymbol
          name="chevron.right"
          size={16}
          color={
            currentPage === totalPages
              ? theme.colors.textSecondary
              : theme.colors.text
          }
        />
      </TouchableOpacity>
    </View>
  );
}

const listStylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
  },
  actionsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  countContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  countText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  unreadCountText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  markAllButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.white,
  },
  clearAllButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
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
  paginationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  pageButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pageButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pageButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  pageButtonTextActive: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.semibold,
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ellipsisText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    paddingHorizontal: theme.spacing.xs,
  },
}));
