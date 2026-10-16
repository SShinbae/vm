import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { baseColors, withOpacity, spacing } from "@/src/design-system";
import { useReducedMotion } from "@/hooks/useReducedMotion";
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
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { useNotifications } from "../../lib/contexts/NotificationContext";
import {
  formatNotificationText,
  formatNotificationTitle,
  NotificationData,
} from "../../lib/services/notificationService";
import { getNotificationRoute } from "../../lib/utils/notificationNavigation";
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
  const { styles } = useStyles(itemStylesheet);
  const { markAsRead, isMarkingRead } = useNotifications();

  const handlePress = () => {
    if (isMarkingRead) return;
    if (!notification.read) {
      markAsRead(notification.id);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isMarkingRead}
      accessibilityState={{ disabled: isMarkingRead }}
      accessibilityRole="button"
      accessibilityLabel={formatNotificationTitle(notification.title)}
      style={[styles.item, !notification.read && styles.unreadItem]}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {formatNotificationTitle(notification.title)}
          </Text>
          {!notification.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {formatNotificationText(notification.body)}
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
    backgroundColor: withOpacity(theme.colors.primary, 0.03),
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
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
    marginBottom: spacing.xs,
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
  const {
    notifications,
    isLoading,
    error,
    isRefreshing,
    refreshNotifications,
    isMarkingRead,
    markAllAsRead,
    unreadCount,
  } = useNotifications();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isMobile: isMobileLayout } = useResponsiveLayout();
  const isCompact = Platform.OS !== "web" || isMobileLayout;
  const compactWidth = Math.max(
    0,
    Math.min(360, width - insets.left - insets.right - 32),
  );
  const compactHeight = Math.max(0, height - insets.top - insets.bottom - 32);
  const ListContainer = isCompact ? View : ScrollView;
  const popupWidth = Math.min(360, width - 24);
  const popupTop = anchorPosition
    ? Math.max(12, Math.min(anchorPosition.top, height - 200))
    : 48;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-10)).current;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: reduceMotion ? 0 : 200,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: reduceMotion ? 0 : 200,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(-10);
    }
  }, [visible, fadeAnim, slideAnim, reduceMotion]);

  const handleNotificationPress = (notification: NotificationData) => {
    const route = getNotificationRoute(notification);
    if (route) {
      onClose();
      router.push(route as any);
    }
  };

  const handleViewAll = () => {
    onClose();
    router.push("/notifications");
  };

  const displayedNotifications = notifications.slice(0, 5);

  const popupBody = (
    <>
      {/* Content */}
      {error && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Couldn&apos;t load notifications</Text>
          <TouchableOpacity
            onPress={() => {
              void refreshNotifications().catch(() => {});
            }}
            disabled={isRefreshing}
            accessibilityState={{ disabled: isRefreshing }}
            accessibilityRole="button"
            accessibilityLabel="Retry notifications"
          >
            <Text style={styles.markAllText}>
              {isRefreshing ? "Retrying..." : "Retry"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {isLoading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : notifications.length === 0 && !error ? (
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
        <ListContainer
          style={[
            !isCompact && styles.list,
            anchorPosition && {
              maxHeight: Math.max(80, height - popupTop - 140),
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {displayedNotifications.map((notification) => (
            <PopupNotificationItem
              key={notification.id}
              notification={notification}
              onPress={() => handleNotificationPress(notification)}
            />
          ))}
        </ListContainer>
      )}
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable
        accessible={isCompact ? false : undefined}
        style={[
          styles.overlay,
          isCompact && {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 16,
            paddingLeft: insets.left + 16,
            paddingRight: insets.right + 16,
            alignItems: "center",
          },
          anchorPosition && {
            paddingTop: 0,
            paddingLeft: 0,
            backgroundColor: "transparent",
          },
        ]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss notifications"
      >
        <Animated.View
          style={[
            styles.popup,
            isCompact && {
              width: compactWidth,
              maxHeight: compactHeight,
              flexShrink: 1,
            },
            anchorPosition && {
              position: "absolute",
              top: popupTop,
              left: Math.max(
                12,
                Math.min(anchorPosition.left, width - popupWidth - 12),
              ),
              width: popupWidth,
              maxHeight: height - popupTop - 12,
            },
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Pressable
            accessible={isCompact ? false : undefined}
            onPress={(e) => e.stopPropagation()}
            style={isCompact && { flexShrink: 1, minHeight: 0 }}
            accessibilityViewIsModal={isCompact}
            onAccessibilityEscape={onClose}
          >
            {/* Header */}
            <View
              style={[
                styles.header,
                isCompact && {
                  flexWrap: "wrap",
                  flexShrink: 0,
                  gap: spacing.sm,
                },
              ]}
            >
              <View
                style={[
                  styles.headerTitleContainer,
                  isCompact && { maxWidth: "100%", flexShrink: 1 },
                ]}
              >
                <Text
                  style={[styles.headerTitle, isCompact && { flexShrink: 1 }]}
                >
                  Notifications
                </Text>
                {unreadCount > 0 && (
                  <View
                    style={[
                      styles.badge,
                      isCompact && { height: undefined, minHeight: 20 },
                    ]}
                  >
                    <Text style={styles.badgeText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
              {unreadCount > 0 && (
                <TouchableOpacity
                  onPress={markAllAsRead}
                  disabled={isMarkingRead}
                  accessibilityState={{ disabled: isMarkingRead }}
                  style={[
                    styles.markAllButton,
                    isCompact && {
                      minHeight: 48,
                      minWidth: 48,
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Mark all notifications as read"
                >
                  <Text style={styles.markAllText}>Mark all read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.markAllButton,
                  isCompact && {
                    minHeight: 48,
                    minWidth: 48,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Close notifications"
              >
                <IconSymbol
                  name="xmark"
                  size={18}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {isCompact ? (
              <ScrollView
                style={{ flexShrink: 1, minHeight: 0 }}
                keyboardShouldPersistTaps="handled"
              >
                {popupBody}
              </ScrollView>
            ) : (
              popupBody
            )}

            {/* Footer */}
            {(isCompact || notifications.length > 0) && (
              <TouchableOpacity
                style={[
                  styles.footer,
                  isCompact && { flexShrink: 0, minHeight: 48 },
                ]}
                onPress={handleViewAll}
                accessibilityRole="button"
                accessibilityLabel="View all notifications"
              >
                <Text
                  style={[
                    styles.footerText,
                    isCompact && { flexShrink: 1, textAlign: "center" },
                  ]}
                >
                  View all notifications
                </Text>
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
    backgroundColor: withOpacity(baseColors.black, 0.3),
    justifyContent: "flex-start",
    alignItems: "flex-start",
    paddingTop: spacing.xxxl,
    paddingLeft: spacing.xxxl,
  },
  popup: {
    width: 360,
    maxHeight: 480,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.xl,
    shadowColor: theme.colors.black,
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
    paddingHorizontal: spacing.sm,
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
