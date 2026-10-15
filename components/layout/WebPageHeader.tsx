import { storageImageUrl } from "@/lib/utils/storagePath";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useNotifications } from "@/lib/contexts/NotificationContext";
import { useAccessibleVehiclesQuery } from "@/hooks/useAccessibleVehiclesQuery";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { HomeVehicleSearch } from "@/components/dashboard/HomeVehicleSearch";
import { NotificationPopup } from "@/components/ui/NotificationPopup";
import { SidebarBadge } from "@/components/ui/SidebarBadge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { profileInitials } from "@/lib/utils/profileInitials";
import { WEB_PAGE_MAX_WIDTH } from "./webPageStyles";
import { Image } from "expo-image";
import { router, usePathname } from "expo-router";
import React, { useRef, useState, useEffect } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

export function WebPageHeader() {
  const { styles, theme } = useStyles(stylesheet);
  const { user } = useAuth();
  const layout = useResponsiveLayout();
  const pathname = usePathname();
  const vehicleQuery = useAccessibleVehiclesQuery();
  const { refetch } = vehicleQuery;
  const vehicles = vehicleQuery.data || [];
  const { unreadCount } = useNotifications();
  const notificationButtonRef =
    useRef<React.ElementRef<typeof TouchableOpacity>>(null);
  const profileButtonRef =
    useRef<React.ElementRef<typeof TouchableOpacity>>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [profileAnchor, setProfileAnchor] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const avatarUrl = user?.profile?.avatar_url;
  const profileName =
    user?.profile?.full_name?.trim() ||
    user?.profile?.username ||
    user?.email?.split("@")[0] ||
    "User";
  const firstName = user?.profile?.full_name?.split(" ")[0];
  const isAnalytics =
    pathname === "/analytics" || pathname.startsWith("/analytics/");
  const groupHeading =
    pathname === "/groups"
      ? ["Groups", "Manage vehicle sharing and members"]
      : pathname === "/groups/create"
        ? ["Create Group", "Share vehicles with family or your team"]
        : /^\/groups\/[^/]+\/invite$/.test(pathname)
          ? ["Invite Member", "Invite someone to share this group"]
          : pathname.startsWith("/groups/")
            ? ["Group details", "Members, shared vehicles, and invitations"]
            : null;
  const headings: Record<string, [string, string]> = {
    "/vehicles": ["Vehicles", "Manage your fleet and maintenance"],
    "/logs": ["Logs", "Track mileage, fuel, and service history"],
    "/notifications": ["Notifications", "Updates, reminders, and invitations"],
    "/profile": ["Profile", "Account details and preferences"],
  };
  const [title, subtitle] =
    groupHeading ||
    headings[pathname] ||
    (isAnalytics
      ? ["Analytics", "Track costs, fuel, and maintenance"]
      : [
          `Welcome back${firstName ? `, ${firstName}` : ""}`,
          "Your vehicles at a glance",
        ]);

  useEffect(() => setAvatarError(false), [avatarUrl]);
  useEffect(() => {
    void refetch({ cancelRefetch: false });
  }, [pathname, refetch]);
  useEffect(() => {
    setNotificationAnchor(null);
    setProfileAnchor(null);
  }, [pathname, layout.screenWidth, layout.screenHeight]);

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.greeting}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.headerControls}>
          <View style={styles.desktopSearch}>
            <HomeVehicleSearch
              key={pathname}
              vehicles={vehicles}
              loading={vehicleQuery.isLoading}
              error={
                vehicleQuery.error ? "Vehicle lookup unavailable" : undefined
              }
              onRetry={() => void vehicleQuery.refetch()}
            />
          </View>
          <TouchableOpacity
            ref={notificationButtonRef}
            style={styles.headerIconButton}
            accessibilityRole="button"
            accessibilityLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
            accessibilityState={{ expanded: notificationAnchor !== null }}
            onPress={() =>
              notificationButtonRef.current?.measureInWindow(
                (x, y, width, height) =>
                  setNotificationAnchor({
                    top: y + height + 8,
                    left: x + width - 360,
                  }),
              )
            }
          >
            <IconSymbol
              name="bell.fill"
              size={20}
              color={theme.colors.textSecondary}
            />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <SidebarBadge count={unreadCount} />
              </View>
            )}
          </TouchableOpacity>
          {notificationAnchor && (
            <NotificationPopup
              visible
              anchorPosition={notificationAnchor}
              onClose={() => setNotificationAnchor(null)}
            />
          )}
          <TouchableOpacity
            ref={profileButtonRef}
            style={styles.profileButton}
            accessibilityRole="button"
            accessibilityLabel="Profile menu"
            accessibilityState={{ expanded: profileAnchor !== null }}
            onPress={() =>
              profileButtonRef.current?.measureInWindow((x, y, width, height) =>
                setProfileAnchor({
                  top: y + height + 8,
                  left: Math.max(
                    12,
                    Math.min(x + width - 280, layout.screenWidth - 292),
                  ),
                }),
              )
            }
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>
                {profileInitials(profileName)}
              </Text>
              {avatarUrl && !avatarError && (
                <Image
                  source={{
                    uri: storageImageUrl("profile-avatars", avatarUrl),
                  }}
                  style={styles.avatarImage}
                  contentFit="cover"
                  onError={() => setAvatarError(true)}
                />
              )}
            </View>
          </TouchableOpacity>
          <Modal
            visible={profileAnchor !== null}
            transparent
            animationType="none"
            onRequestClose={() => setProfileAnchor(null)}
          >
            <Pressable
              style={styles.menuOverlay}
              onPress={() => setProfileAnchor(null)}
            >
              <Pressable
                style={[
                  styles.profileMenu,
                  profileAnchor && {
                    top: profileAnchor.top,
                    left: profileAnchor.left,
                  },
                ]}
                onPress={(event) => event.stopPropagation()}
              >
                <View style={styles.profileMenuIdentity}>
                  <Text style={styles.profileMenuText}>{profileName}</Text>
                  <Text style={styles.profileMenuEmail}>{user?.email}</Text>
                </View>
                {(["Profile", "Settings"] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={styles.profileMenuItem}
                    accessibilityRole="button"
                    accessibilityLabel={tab}
                    onPress={() => {
                      setProfileAnchor(null);
                      router.push({
                        pathname: "/profile",
                        params: { tab },
                      });
                    }}
                  >
                    <Text style={styles.profileMenuText}>{tab}</Text>
                  </TouchableOpacity>
                ))}
              </Pressable>
            </Pressable>
          </Modal>
        </View>
      </View>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  header: {
    width: "100%",
    maxWidth: WEB_PAGE_MAX_WIDTH,
    alignSelf: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    zIndex: 30,
  },
  titleGroup: { maxWidth: "100%", flexShrink: 1 },
  headerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
  },
  headerControls: {
    flex: 1,
    minWidth: 300,
    justifyContent: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  desktopSearch: { flex: 1, minWidth: 160, maxWidth: 360 },
  headerIconButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },
  notificationBadge: {
    position: "absolute",
    top: -5,
    right: -5,
  },
  profileButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  menuOverlay: { flex: 1 },
  profileMenu: {
    position: "absolute",
    width: 280,
    padding: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
  },
  profileMenuItem: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  profileMenuText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  profileMenuIdentity: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.xs,
  },
  profileMenuEmail: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.xs,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { position: "absolute", width: "100%", height: "100%" },
  avatarInitials: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  greeting: {
    fontSize: theme.fontSize["2xl"],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
}));
