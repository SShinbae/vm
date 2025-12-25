import React from "react";
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { NotificationList } from "@/components/ui/NotificationList";
import { NotificationData } from "@/lib/services/notificationService";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useNotifications } from "@/lib/contexts/NotificationContext";
import { GroupInvitationService } from "@/lib/services/groupService";
import { useToast } from "@/hooks/useToast";

export default function NotificationsScreen() {
  const { styles, theme } = useStyles(stylesheet);
  const { isDesktop } = useResponsiveLayout();
  const { unreadCount, refreshNotifications } = useNotifications();
  const { showSuccess, showError, showInfo } = useToast();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleAcceptInvitation = async (
    invitationId: string,
    groupName: string,
  ) => {
    try {
      const result =
        await GroupInvitationService.acceptInvitation(invitationId);

      if (result.error) {
        showError(result.error);
      } else {
        showSuccess(`You joined ${groupName}!`);
        // Refresh notifications to remove the invitation
        await refreshNotifications();
      }
    } catch {
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
        // Refresh notifications
        await refreshNotifications();
      }
    } catch {
      showError("Failed to decline invitation");
    }
  };

  const handleNotificationPress = (notification: NotificationData) => {
    console.log("🔔 Notification pressed:", notification);
    console.log("🔔 Notification type:", notification.notification_type);
    console.log("🔔 Related group ID:", notification.related_group_id);

    switch (notification.notification_type) {
      case "mileage_log":
      case "fuel_log":
      case "service_log":
        if (notification.related_vehicle_id) {
          console.log(
            "📍 Navigating to vehicle:",
            notification.related_vehicle_id,
          );
          router.push(`/vehicles/${notification.related_vehicle_id}`);
        }
        break;
      case "group_member":
        if (notification.related_group_id) {
          console.log("📍 Navigating to group:", notification.related_group_id);
          router.push(`/groups/${notification.related_group_id}`);
        }
        break;
      case "group_invite":
        // Extract group name from notification body
        console.log("🔍 Full notification data:", notification);
        console.log("🔍 notification.data:", notification.data);
        console.log("🔍 notification.data type:", typeof notification.data);

        const groupName = notification.body.split("join ")[1] || "this group";
        const invitationId = notification.data?.invitationId;

        console.log("🔍 Extracted invitationId:", invitationId);
        console.log("🔍 Extracted groupName:", groupName);

        if (!invitationId) {
          console.error("❌ No invitation ID found!");
          console.error(
            "❌ Full notification object:",
            JSON.stringify(notification, null, 2),
          );
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
        break;
      default:
        console.log("❓ Unknown notification type");
        break;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <IconSymbol
              name={Platform.OS === "ios" ? "chevron.left" : "arrow.left"}
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Content wrapper for responsive layout */}
      <View style={styles.contentWrapper}>
        <View
          style={[
            styles.contentContainer,
            isDesktop && styles.contentContainerDesktop,
          ]}
        >
          {/* Notification List with pull-to-refresh */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            <NotificationList onNotificationPress={handleNotificationPress} />
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.fontSize["2xl"],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.sm,
  },
  unreadBadgeText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  contentWrapper: {
    flex: 1,
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    width: "100%",
  },
  contentContainerDesktop: {
    maxWidth: 800,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
}));
