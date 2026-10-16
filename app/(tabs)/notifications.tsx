import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { Button } from "@/components/ui/Button";
import { webPageStyles } from "@/components/layout/webPageStyles";
import { WebFilterButton } from "@/components/ui/WebFilterButton";
import { withOpacity } from "@/src/design-system";
import React from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/lib/contexts/AuthContext";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { NotificationList } from "@/components/ui/NotificationList";
import { NotificationData } from "@/lib/services/notificationService";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useNotifications } from "@/lib/contexts/NotificationContext";
import { GroupInvitationService } from "@/lib/services/groupService";
import { useToast } from "@/hooks/useToast";
import { useDialog } from "@/lib/contexts/DialogContext";
import { getNotificationRoute } from "@/lib/utils/notificationNavigation";

export default function NotificationsScreen() {
  const { styles, theme } = useStyles(stylesheet);
  const { styles: web } = useStyles(webPageStyles);
  const { isWeb, isMobile, isDesktop } = useResponsiveLayout();
  const isWebPage = isWeb && !isMobile;
  const { width, fontScale } = useWindowDimensions();
  const stackActions = !isWebPage && (width < 360 || fontScale >= 1.3);
  const scrollRef = React.useRef<ScrollView>(null);
  const [unreadOnly, setUnreadOnly] = React.useState(false);
  const {
    unreadCount,
    notifications,
    markAllAsRead,
    refreshNotifications,
    isMarkingRead,
  } = useNotifications();
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const { choose } = useDialog();
  const [refreshing, setRefreshing] = React.useState(false);
  const [invitations, setInvitations] = React.useState<
    { id: string; groups?: { name?: string } | null }[]
  >([]);

  const [invitationsLoading, setInvitationsLoading] = React.useState(true);
  const [invitationsError, setInvitationsError] = React.useState(false);
  const [pendingInvitation, setPendingInvitation] = React.useState<
    string | null
  >(null);
  const invitationRequest = React.useRef(0);
  const invitationPending = React.useRef(false);
  const refreshPending = React.useRef(false);
  const currentUserId = React.useRef(user?.id);
  currentUserId.current = user?.id;

  React.useEffect(() => {
    setInvitations([]);
    setInvitationsError(false);
    setUnreadOnly(false);
  }, [user?.id]);

  // Invitations matched by email also cover people invited before signup.
  const loadInvitations = React.useCallback(async () => {
    const request = ++invitationRequest.current;
    if (!user?.id) {
      setInvitations([]);
      setInvitationsLoading(false);
      return;
    }
    setInvitationsLoading(true);
    try {
      const result = await GroupInvitationService.getUserInvitations();
      if (result.error) throw new Error(result.error);
      if (request !== invitationRequest.current) return;
      setInvitations(result.data || []);
      setInvitationsError(false);
    } catch (error) {
      if (request === invitationRequest.current) setInvitationsError(true);
      throw error;
    } finally {
      if (request === invitationRequest.current) setInvitationsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      void Promise.allSettled([refreshNotifications(), loadInvitations()]);
      return () => {
        invitationRequest.current++;
      };
    }, [refreshNotifications, loadInvitations]),
  );

  const respondToInvitation = async (
    invitationId: string,
    groupName?: string,
  ) => {
    if (
      !user?.id ||
      invitationPending.current ||
      invitationsLoading ||
      invitationsError
    )
      return;
    const respondingUserId = user.id;
    invitationPending.current = true;
    setPendingInvitation(invitationId);
    try {
      const result = groupName
        ? await GroupInvitationService.acceptInvitation(invitationId)
        : await GroupInvitationService.declineInvitation(invitationId);
      if (respondingUserId !== currentUserId.current) return;
      if (result.error) {
        showError(result.error);
        return;
      }
      invitationRequest.current++;
      setInvitations((current) =>
        current.filter((inv) => inv.id !== invitationId),
      );
      if (groupName) showSuccess(`You joined ${groupName}!`);
      else showInfo("Invitation declined");
      const results = await Promise.allSettled([
        refreshNotifications(),
        loadInvitations(),
      ]);
      if (results.some((result) => result.status === "rejected")) {
        showError("Invitation updated, but refresh failed. Please retry.");
      }
    } catch {
      showError(
        groupName
          ? "Failed to accept invitation"
          : "Failed to decline invitation",
      );
    } finally {
      invitationPending.current = false;
      setPendingInvitation(null);
    }
  };

  const handleNotificationPress = async (notification: NotificationData) => {
    if (notification.notification_type === "group_invite") {
      if (invitationPending.current || invitationsLoading || invitationsError)
        return;
      const groupName = notification.body.split("join ")[1] || "this group";
      const invitationId = notification.data?.invitationId;

      if (!invitationId) {
        showError("Invalid invitation");
        return;
      }

      // `invitations` holds only pending, unexpired ones; don't re-prompt
      // for an invitation that was already accepted, declined or expired.
      if (!invitations.some((inv) => inv.id === invitationId)) {
        showInfo("This invitation has already been answered or has expired.");
        return;
      }

      const pick = await choose({
        title: "Group invitation",
        message: `Join ${groupName}?`,
        options: [
          { label: "Join", value: "join" },
          { label: "Decline", value: "decline", destructive: true },
        ],
      });
      // null (Cancel, backdrop, back): leave the invitation pending
      if (pick === "join") respondToInvitation(invitationId, groupName);
      else if (pick === "decline") respondToInvitation(invitationId);
      return;
    }

    const route = getNotificationRoute(notification);
    if (route) {
      router.push(route as any);
    }
  };

  const onRefresh = async () => {
    if (refreshPending.current) return;
    refreshPending.current = true;
    setRefreshing(true);
    try {
      const results = await Promise.allSettled([
        refreshNotifications(),
        loadInvitations(),
      ]);
      if (results.some((result) => result.status === "rejected"))
        throw new Error("Refresh failed");
    } catch {
      showError("Failed to refresh notifications");
    } finally {
      refreshPending.current = false;
      setRefreshing(false);
    }
  };

  const selectFilter = (unread: boolean) => {
    if (unread === unreadOnly) return;
    setUnreadOnly(unread);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.contentWrapper}>
        <View
          style={[
            styles.contentContainer,
            isDesktop && !isWebPage && styles.contentContainerDesktop,
            isWebPage && web.frame,
          ]}
        >
          {isWebPage && (
            <View style={web.toolbar}>
              <View style={web.filters}>
                <WebFilterButton
                  label={`All (${notifications.length})`}
                  selected={!unreadOnly}
                  onPress={() => setUnreadOnly(false)}
                />
                <WebFilterButton
                  label={`Unread (${unreadCount})`}
                  selected={unreadOnly}
                  onPress={() => setUnreadOnly(true)}
                />
              </View>
              <View style={web.filters}>
                <TouchableOpacity
                  onPress={onRefresh}
                  disabled={refreshing}
                  accessibilityRole="button"
                  accessibilityLabel="Refresh notifications"
                  accessibilityState={{ disabled: refreshing }}
                  style={[styles.markAllButton, styles.webActionButton]}
                >
                  <Text style={styles.markAllText}>
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </Text>
                </TouchableOpacity>
                {unreadCount > 0 && (
                  <TouchableOpacity
                    onPress={markAllAsRead}
                    disabled={isMarkingRead}
                    accessibilityState={{ disabled: isMarkingRead }}
                    style={[styles.markAllButton, styles.webActionButton]}
                    accessibilityRole="button"
                    accessibilityLabel="Mark all as read"
                  >
                    <IconSymbol
                      name="checkmark"
                      size={16}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.markAllText}>Mark all as read</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          <ScrollView
            ref={scrollRef}
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              isWebPage
                ? {
                    paddingHorizontal: theme.spacing.xl,
                    paddingBottom: theme.spacing.xl,
                  }
                : { paddingHorizontal: 16, paddingBottom: 32 },
            ]}
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
            {!isWebPage && (
              <>
                <MobilePageHeader
                  title="Notifications"
                  subtitle="Vehicle updates and invitations"
                  onBack={() => {
                    if (router.canGoBack()) router.back();
                    else router.replace("/");
                  }}
                />
                <View
                  style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}
                >
                  {[
                    { label: `All (${notifications.length})`, unread: false },
                    { label: `Unread (${unreadCount})`, unread: true },
                  ].map((filter) => (
                    <TouchableOpacity
                      key={String(filter.unread)}
                      accessibilityRole="tab"
                      accessibilityLabel={filter.label}
                      accessibilityState={{
                        selected: unreadOnly === filter.unread,
                      }}
                      onPress={() => selectFilter(filter.unread)}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        minHeight: 48,
                        padding: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: theme.borderRadius.md,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        backgroundColor:
                          unreadOnly === filter.unread
                            ? theme.colors.primary
                            : theme.colors.surface,
                      }}
                    >
                      <Text
                        style={{
                          color:
                            unreadOnly === filter.unread
                              ? theme.colors.white
                              : theme.colors.textSecondary,
                          fontWeight: "600",
                        }}
                      >
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {unreadCount > 0 && (
                  <Button
                    title="Mark all as read"
                    icon="checkmark"
                    variant="outline"
                    onPress={markAllAsRead}
                    disabled={isMarkingRead}
                    fullWidth
                    style={{ minHeight: 48, marginBottom: 16 }}
                  />
                )}
              </>
            )}
            {invitationsLoading && invitations.length === 0 && (
              <Text style={styles.invitationText}>Loading invitations...</Text>
            )}
            {invitationsError && (
              <View
                style={[
                  styles.invitationsSection,
                  !isWebPage && {
                    paddingHorizontal: 0,
                    paddingTop: 0,
                    marginBottom: 16,
                  },
                ]}
              >
                <Text style={styles.invitationText}>
                  Couldn&apos;t load invitations
                </Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Retry invitations"
                  style={
                    !isWebPage
                      ? { minHeight: 48, justifyContent: "center" }
                      : undefined
                  }
                  disabled={invitationsLoading}
                  onPress={() => {
                    void loadInvitations().catch(() => {});
                  }}
                >
                  <Text style={styles.markAllText}>
                    {invitationsLoading ? "Retrying..." : "Retry"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {invitations.length > 0 && (
              <View
                style={[
                  styles.invitationsSection,
                  {
                    paddingHorizontal: 0,
                    paddingTop: 0,
                    marginBottom: theme.spacing.lg,
                  },
                ]}
              >
                <Text style={styles.sectionTitle}>Invitations</Text>
                {invitations.map((invitation) => {
                  const groupName = invitation.groups?.name || "a group";
                  return (
                    <View
                      key={invitation.id}
                      style={[styles.invitationCard, isWebPage && web.panel]}
                    >
                      <Text style={styles.invitationText}>
                        {"You've been invited to join "}
                        <Text style={styles.invitationGroup}>{groupName}</Text>
                      </Text>
                      <View
                        style={[
                          styles.invitationActions,
                          !isWebPage && {
                            flexDirection: stackActions ? "column" : "row",
                          },
                        ]}
                      >
                        <TouchableOpacity
                          onPress={() => respondToInvitation(invitation.id)}
                          style={[
                            styles.invitationButton,
                            styles.declineButton,
                            !isWebPage && {
                              minHeight: 48,
                              flex: stackActions ? undefined : 1,
                              alignItems: "center",
                              justifyContent: "center",
                            },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Decline invitation to ${groupName}`}
                          disabled={
                            !!pendingInvitation ||
                            invitationsLoading ||
                            invitationsError
                          }
                          accessibilityState={{
                            disabled:
                              !!pendingInvitation ||
                              invitationsLoading ||
                              invitationsError,
                          }}
                        >
                          <Text style={styles.declineButtonText}>
                            {pendingInvitation === invitation.id
                              ? "Updating..."
                              : "Decline"}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            respondToInvitation(invitation.id, groupName)
                          }
                          style={[
                            styles.invitationButton,
                            styles.acceptButton,
                            !isWebPage && {
                              minHeight: 48,
                              flex: stackActions ? undefined : 1,
                              alignItems: "center",
                              justifyContent: "center",
                            },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Accept invitation to ${groupName}`}
                          disabled={
                            !!pendingInvitation ||
                            invitationsLoading ||
                            invitationsError
                          }
                          accessibilityState={{
                            disabled:
                              !!pendingInvitation ||
                              invitationsLoading ||
                              invitationsError,
                          }}
                        >
                          <Text style={styles.acceptButtonText}>
                            {pendingInvitation === invitation.id
                              ? "Updating..."
                              : "Accept"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
            <NotificationList
              key={`${user?.id || "signed-out"}-${unreadOnly ? "unread" : "all"}`}
              unreadOnly={unreadOnly}
              onNotificationPress={handleNotificationPress}
            />
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
  webActionButton: {
    minHeight: 36,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
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
