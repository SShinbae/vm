import { withOpacity } from "@/src/design-system";
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
import { getNotificationRoute } from "@/lib/utils/notificationNavigation";

export default function NotificationsScreen() {
  const { styles, theme } = useStyles(stylesheet);
  const { isDesktop } = useResponsiveLayout();
  const { unreadCount, notifications, markAllAsRead, refreshNotifications } =
    useNotifications();
  const { showSuccess, showError, showInfo } = useToast();
  const [refreshing, setRefreshing] = React.useState(false);
  const [invitations, setInvitations] = React.useState<
    { id: string; groups?: { name?: string } | null }[]
  >([]);

  // Pending invitations matched by email — this is the accept surface for
  // people invited before they had an account (they have no notification row).
  const loadInvitations = React.useCallback(async () => {
    const result = await GroupInvitationService.getUserInvitations();
    if (result.data) setInvitations(result.data as any);
  }, []);

  React.useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

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
        await Promise.all([refreshNotifications(), loadInvitations()]);
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
        await Promise.all([refreshNotifications(), loadInvitations()]);
      }
    } catch {
      showError("Failed to decline invitation");
    }
  };

  const handleNotificationPress = (notification: NotificationData) => {
    if (notification.notification_type === "group_invite") {
      const groupName = notification.body.split("join ")[1] || "this group";
      const invitationId = notification.data?.invitationId;

      if (!invitationId) {
        showError("Invalid invitation");
        return;
      }

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
      router.push(route as any);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshNotifications(), loadInvitations()]);
    setRefreshing(false);
  };

  const hasNotifications = notifications.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
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
        {hasNotifications && unreadCount > 0 && (
          <TouchableOpacity
            onPress={markAllAsRead}
            style={styles.markAllButton}
            accessibilityRole="button"
            accessibilityLabel="Mark all as read"
          >
            <IconSymbol
              name="checkmark"
              size={16}
              color={theme.colors.primary}
            />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.contentWrapper}>
        <View
          style={[
            styles.contentContainer,
            isDesktop && styles.contentContainerDesktop,
          ]}
        >
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
            {invitations.length > 0 && (
              <View style={styles.invitationsSection}>
                <Text style={styles.sectionTitle}>Invitations</Text>
                {invitations.map((invitation) => {
                  const groupName = invitation.groups?.name || "a group";
                  return (
                    <View key={invitation.id} style={styles.invitationCard}>
                      <Text style={styles.invitationText}>
                        {"You've been invited to join "}
                        <Text style={styles.invitationGroup}>{groupName}</Text>
                      </Text>
                      <View style={styles.invitationActions}>
                        <TouchableOpacity
                          onPress={() => handleDeclineInvitation(invitation.id)}
                          style={[
                            styles.invitationButton,
                            styles.declineButton,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Decline invitation to ${groupName}`}
                        >
                          <Text style={styles.declineButtonText}>Decline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            handleAcceptInvitation(invitation.id, groupName)
                          }
                          style={[styles.invitationButton, styles.acceptButton]}
                          accessibilityRole="button"
                          accessibilityLabel={`Accept invitation to ${groupName}`}
                        >
                          <Text style={styles.acceptButtonText}>Accept</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
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
    gap: theme.spacing.md,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flex: 1,
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
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: withOpacity(theme.colors.primary, 0.08),
  },
  markAllText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
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
  invitationsSection: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  invitationCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.md,
  },
  invitationText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
  },
  invitationGroup: {
    fontWeight: theme.fontWeight.bold,
  },
  invitationActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: theme.spacing.sm,
  },
  invitationButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  declineButton: {
    backgroundColor: withOpacity(theme.colors.text, 0.08),
  },
  declineButtonText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  acceptButton: {
    backgroundColor: theme.colors.primary,
  },
  acceptButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
}));
