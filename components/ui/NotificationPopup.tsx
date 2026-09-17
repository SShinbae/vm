import { baseColors, withOpacity, spacing } from "@/src/design-system";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Alert,
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
import {
  formatNotificationText,
  formatNotificationTitle,
  NotificationData,
} from "../../lib/services/notificationService";
import { getNotificationRoute } from "../../lib/utils/notificationNavigation";
import { formatDistanceToNow } from "../../lib/utils/dateUtils";
import { IconSymbol } from "./icon-symbol";
import { GroupInvitationService } from "../../lib/services/groupService";
import { useToast } from "../../hooks/useToast";

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
  const { markAsRead } = useNotifications();

  const handlePress = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
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
}: NotificationPopupProps) {
  const { styles, theme } = useStyles(popupStylesheet);
  const {
    notifications,
    isInitialized,
    markAllAsRead,
    unreadCount,
    refreshNotifications,
  } = useNotifications();
  const { showSuccess, showError, showInfo } = useToast();
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

  const handleAcceptInvitation = async (
    invitationId: string,
    groupName: string,
  ) => {
    try {
      console.log("🔄 Accepting invitation:", { invitationId, groupName });
      const result =
        await GroupInvitationService.acceptInvitation(invitationId);
      console.log("✅ Accept invitation result:", result);

      if (result.error) {
        console.error("❌ Error accepting invitation:", result.error);
        showError(result.error);
      } else {
        console.log("✅ Successfully joined group!");
        showSuccess(`You joined ${groupName}!`);
        await refreshNotifications();
      }
    } catch {
      console.error("❌ Exception accepting invitation");
      showError("Failed to accept invitation");
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      const result =
        await GroupInvitationService.declineInvitation(invitationId);

      if (result.error) {
        showError(result.error);
      } else {
        showInfo("Invitation declined");
        await refreshNotifications();
      }
    } catch {
      showError("Failed to decline invitation");
    }
  };

  const handleNotificationPress = (notification: NotificationData) => {
    if (notification.notification_type === "group_invite") {
      // Extract group name from notification body
      const groupName = notification.body.split("join ")[1] || "this group";
      const invitationId = notification.data?.invitationId;

      if (!invitationId) {
        showError("Invalid invitation");
        return;
      }

      // Use browser confirm on web, Alert.alert on native
      if (Platform.OS === "web") {
        const confirmed = window.confirm(`Do you want to join ${groupName}?`);
        if (confirmed) {
          handleAcceptInvitation(invitationId, groupName);
        } else {
          handleDeclineInvitation(invitationId);
        }
      } else {
        Alert.alert(
          "Group Invitation",
          `Do you want to join ${groupName}?`,
          [
            {
              text: "No",
              style: "cancel",
              onPress: () => handleDeclineInvitation(invitationId),
            },
            {
              text: "Yes",
              onPress: () => handleAcceptInvitation(invitationId, groupName),
            },
          ],
          { cancelable: true },
        );
      }
      return;
    }

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
