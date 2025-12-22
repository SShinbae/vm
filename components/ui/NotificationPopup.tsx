import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { useNotifications } from "../../lib/contexts/NotificationContext";
import { NotificationData } from "../../lib/services/notificationService";
import { formatDistanceToNow } from "../../lib/utils/dateUtils";
import { IconSymbol } from "./icon-symbol";

interface NotificationPopupProps {
  visible: boolean;
  onClose: () => void;
  anchorPosition?: { top: number; left: number };
}

function PopupNotificationItem({
  notification,
  onPress,
}: {
  notification: NotificationData;
  onPress: () => void;
}) {
  const { styles, theme } = useStyles(itemStylesheet);
  const { markAsRead } = useNotifications();

  const handlePress = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    onPress();
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
      default:
        return theme.colors.primary;
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.item, !notification.read && styles.unreadItem]}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: getIconColor() + "15" },
        ]}
      >
        <IconSymbol name={getIcon() as any} size={16} color={getIconColor()} />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          {!notification.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={styles.timestamp}>
          {formatDistanceToNow(new Date(notification.created_at))} ago
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const itemStylesheet = createStyleSheet((theme) => ({
  item: {
    flexDirection: "row",
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  unreadItem: {
    backgroundColor: theme.colors.primary + "08",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.sm,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  title: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    flex: 1,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
  message: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    lineHeight: 16,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
}));

export function NotificationPopup({
  visible,
  onClose,
  anchorPosition,
}: NotificationPopupProps) {
  const { styles, theme } = useStyles(popupStylesheet);
  const { notifications, isInitialized, markAllAsRead, unreadCount } =
    useNotifications();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(-10);
    }
  }, [visible]);

  const handleNotificationPress = (notification: NotificationData) => {
    onClose();
    switch (notification.notification_type) {
      case "mileage_log":
      case "fuel_log":
      case "service_log":
        if (notification.related_vehicle_id) {
          router.push(`/vehicles/${notification.related_vehicle_id}`);
        }
        break;
      case "group_member":
      case "group_invite":
        if (notification.related_group_id) {
          router.push(`/groups/${notification.related_group_id}`);
        }
        break;
      default:
        break;
    }
  };

  const handleViewAll = () => {
    onClose();
    router.push("/profile");
  };

  const displayedNotifications = notifications.slice(0, 5);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.popup,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Notifications</Text>
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
              {unreadCount > 0 && (
                <TouchableOpacity
                  onPress={markAllAsRead}
                  style={styles.markAllButton}
                >
                  <Text style={styles.markAllText}>Mark all read</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Content */}
            {!isInitialized ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Loading...</Text>
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol
                  name="bell.slash"
                  size={32}
                  color={theme.colors.textSecondary}
                />
                <Text style={styles.emptyTitle}>No notifications</Text>
                <Text style={styles.emptyText}>You&apos;re all caught up!</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.list}
                showsVerticalScrollIndicator={false}
              >
                {displayedNotifications.map((notification) => (
                  <PopupNotificationItem
                    key={notification.id}
                    notification={notification}
                    onPress={() => handleNotificationPress(notification)}
                  />
                ))}
              </ScrollView>
            )}

            {/* Footer */}
            {notifications.length > 0 && (
              <TouchableOpacity style={styles.footer} onPress={handleViewAll}>
                <Text style={styles.footerText}>View all notifications</Text>
                <IconSymbol
                  name="chevron.right"
                  size={14}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            )}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const popupStylesheet = createStyleSheet((theme) => ({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    paddingTop: 60,
    paddingLeft: 70,
  },
  popup: {
    width: 360,
    maxHeight: 480,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  markAllButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  markAllText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  list: {
    maxHeight: 320,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  emptyTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.xs,
  },
  footerText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
  },
}));
