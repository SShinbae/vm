import { storageImageUrl } from "@/lib/utils/storagePath";
import { withOpacity, spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SidebarBadge } from "@/components/ui/SidebarBadge";
import { Tooltip } from "@/components/ui/Tooltip";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useSignOut } from "@/hooks/useSignOut";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useNotifications } from "@/lib/contexts/NotificationContext";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { profileInitials } from "@/lib/utils/profileInitials";
import { Image } from "expo-image";
import { router, usePathname } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface NavItem {
  name: string;
  icon: string;
  path: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: "dashboard", icon: "house.fill", path: "/", label: "Dashboard" },
  { name: "vehicles", icon: "car.fill", path: "/vehicles", label: "Vehicles" },
  {
    name: "analytics",
    icon: "chart.line.uptrend.xyaxis",
    path: "/analytics",
    label: "Analytics",
  },
  { name: "logs", icon: "doc.text.fill", path: "/logs", label: "Logs" },
  { name: "groups", icon: "person.2.fill", path: "/groups", label: "Groups" },
  {
    name: "notifications",
    icon: "bell.fill",
    path: "/notifications",
    label: "Notifications",
  },
  { name: "profile", icon: "person.fill", path: "/profile", label: "Profile" },
];

export function WebSidebar() {
  const layout = useResponsiveLayout();
  const { theme } = useStyles();
  const colors = theme.colors;
  const pathname = usePathname();
  const { user } = useAuth();
  const { colorScheme } = useTheme();
  const { signOut } = useSignOut();
  const { isOpen, toggle } = useSidebar();
  const { unreadCount } = useNotifications();
  const [avatarError, setAvatarError] = React.useState(false);
  const avatarUrl = user?.profile?.avatar_url;
  const profileName =
    user?.profile?.full_name?.trim() ||
    user?.profile?.username ||
    user?.email?.split("@")[0] ||
    "User";

  React.useEffect(() => setAvatarError(false), [avatarUrl]);

  // Hide sidebar on auth pages (login, register)
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/(auth)");

  // Only render on web, and not on auth pages
  if (!layout.isWeb || isAuthPage) {
    return null;
  }

  // Show as bottom bar on mobile web
  const showAsBottomBar = layout.isMobile;
  const logoWidth = isOpen ? 72 : 40;
  const logoHeight = isOpen ? 42 : 28;
  // Fit the dark artwork's visible bounds, excluding its transparent padding.
  const darkLogoScale = Math.min(logoWidth / 834, logoHeight / 547);

  const handleSignOutClick = () => signOut({ confirm: true });

  const NavButton = ({ item }: { item: NavItem }) => {
    const [hovered, setHovered] = React.useState(false);
    const isActive =
      pathname === item.path || pathname.startsWith(item.path + "/");

    return (
      <Tooltip
        content={item.label}
        position={showAsBottomBar ? "top" : "right"}
        disabled={showAsBottomBar ? true : isOpen} // Always show label on bottom bar, tooltip on collapsed sidebar
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={item.label}
          accessibilityState={{ selected: isActive }}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          style={[
            styles.navButton,
            showAsBottomBar && isActive && styles.navButtonActiveBottom,
            !showAsBottomBar && {
              backgroundColor: isActive
                ? colors.primary
                : hovered
                  ? withOpacity(colors.primary, 0.08)
                  : "transparent",
              justifyContent: isOpen ? "flex-start" : "center",
              paddingHorizontal: isOpen ? 16 : 12,
            },
            Platform.OS === "web" && {
              // @ts-ignore - web-specific class
              className: "nav-item-transition",
            },
          ]}
          onPress={() => router.push(item.path as any)}
        >
          {/* Top accent line for active state on bottom bar */}
          {showAsBottomBar && isActive && <View style={styles.activeTopLine} />}
          <View style={styles.navIconWrap}>
            <IconSymbol
              name={item.icon as any}
              size={showAsBottomBar ? 22 : 20}
              color={
                isActive
                  ? showAsBottomBar
                    ? colors.primary
                    : colors.white
                  : colors.textSecondary
              }
            />
            {/* Dot indicator when collapsed (desktop sidebar) */}
            {item.name === "notifications" &&
              !showAsBottomBar &&
              !isOpen &&
              unreadCount > 0 && (
                <View style={styles.navIconDot}>
                  <SidebarBadge count={unreadCount} variant="dot" />
                </View>
              )}
          </View>
          {/* Always show labels on bottom bar for corporate clarity */}
          {(showAsBottomBar || isOpen) && (
            <Text
              style={[
                styles.navButtonText,
                {
                  color: isActive
                    ? showAsBottomBar
                      ? colors.primary
                      : colors.white
                    : colors.textSecondary,
                  fontWeight: isActive ? "600" : "500",
                },
                Platform.OS === "web" && {
                  // @ts-ignore - web-specific class
                  className: "text-fade-transition",
                },
              ]}
            >
              {item.label}
            </Text>
          )}
          {/* Full numeric badge when label is visible */}
          {item.name === "notifications" &&
            (showAsBottomBar || isOpen) &&
            unreadCount > 0 && (
              <View style={styles.navTrailingBadge}>
                <SidebarBadge count={unreadCount} variant="full" />
              </View>
            )}
        </Pressable>
      </Tooltip>
    );
  };

  const styles = StyleSheet.create({
    sidebar: showAsBottomBar
      ? {
          width: "100%",
          height: 64,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          ...Platform.select({
            web: {
              position: "fixed" as any,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 100,
            },
          }),
        }
      : {
          width: isOpen ? 240 : 96,
          height: "100%",
          backgroundColor: colors.surface,
          borderRightWidth: 1,
          borderRightColor: withOpacity(colors.textSecondary, 0.12),
          paddingVertical: spacing.xl,
          paddingHorizontal: isOpen ? 16 : 8,
          ...Platform.select({
            web: {
              position: "fixed" as any,
              left: 0,
              top: 0,
              zIndex: 100,
              // @ts-ignore - web-specific class
              className: "sidebar-transition",
            },
          }),
        },
    togglePosition: {
      position: "absolute",
      right: -16,
      top: isOpen ? 37 : 30,
      zIndex: 101,
    },
    toggleButton: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: withOpacity(colors.textSecondary, 0.12),
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        web: {
          zIndex: 101,
          // @ts-ignore - web-specific class
          className: "toggle-button-transition",
        },
      }),
    },
    brand: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.lg,
      paddingHorizontal: isOpen ? 8 : 0,
      justifyContent: isOpen ? "flex-start" : "center",
      paddingVertical: spacing.sm,
      borderRadius: 8,
      ...Platform.select({
        web: {
          // @ts-ignore - web-specific class
          className: "nav-item-transition",
        },
      }),
    },
    brandImage: {
      width: logoWidth,
      height: logoHeight,
      overflow: "hidden",
    },
    darkBrandImage: {
      position: "absolute",
      width: 2048 * darkLogoScale,
      height: 2048 * darkLogoScale,
      left: (logoWidth - 834 * darkLogoScale) / 2 - 608 * darkLogoScale,
      top: (logoHeight - 547 * darkLogoScale) / 2 - 746 * darkLogoScale,
    },
    nav: showAsBottomBar
      ? {
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          flex: 1,
        }
      : {
          flex: 1,
          gap: spacing.xs,
        },
    navGroupLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 1.6,
      paddingHorizontal: 16,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    navDivider: {
      height: 1,
      backgroundColor: withOpacity(colors.textSecondary, 0.16),
      marginVertical: spacing.lg,
      marginHorizontal: isOpen ? 8 : 4,
    },
    navButton: showAsBottomBar
      ? {
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.sm,
          borderRadius: 8,
          gap: spacing.xs,
          flex: 1,
          minWidth: 0,
          position: "relative",
        }
      : {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: spacing.md,
          borderRadius: 8,
          gap: spacing.md,
        },
    navButtonActiveBottom: {
      backgroundColor: withOpacity(colors.primary, 0.08), // 8% opacity for subtle highlight
    },
    navIconWrap: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    },
    navIconDot: {
      position: "absolute",
      top: -2,
      right: -4,
    },
    navTrailingBadge: {
      marginLeft: "auto",
    },
    activeTopLine: {
      position: "absolute",
      top: -8,
      left: "25%",
      width: "50%",
      height: 2,
      backgroundColor: colors.primary,
      borderRadius: 1,
    },
    navButtonText: showAsBottomBar
      ? {
          fontSize: 11,
          fontWeight: "500",
          textAlign: "center",
          ...Platform.select({
            web: {
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              width: "100%",
              maxWidth: "100%",
            },
          }),
        }
      : {
          fontSize: 16,
          fontWeight: "500",
        },
    userSection: {
      borderTopWidth: 1,
      borderTopColor: withOpacity(colors.textSecondary, 0.12),
      paddingTop: spacing.lg,
      gap: spacing.md,
    },
    signOutButtonContainer: {
      paddingHorizontal: isOpen ? 8 : 0,
      alignItems: "center",
    },
    signOutButton: {
      width: isOpen ? "100%" : 32,
      height: isOpen ? 40 : 32,
      borderRadius: 8,
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: theme.colors.error,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      ...Platform.select({
        web: {
          // @ts-ignore - web-specific class
          className: "toggle-button-transition",
        },
      }),
    },
    signOutText: {
      color: theme.colors.error,
      fontSize: 14,
      fontWeight: "500",
    },
    userInfoRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: isOpen ? "space-between" : "center",
      paddingHorizontal: isOpen ? 8 : 0,
      gap: isOpen ? 8 : 12,
    },
    userInfo: {
      flex: isOpen ? 1 : undefined,
      flexDirection: "column",
      alignItems: "center",
      gap: spacing.sm,
    },
    userAvatarRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      width: isOpen ? "100%" : undefined,
      justifyContent: "center",
    },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      flexShrink: 0,
    },
    avatarImage: {
      position: "absolute",
      width: "100%",
      height: "100%",
    },
    avatarInitials: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: "700",
    },
    userDetails: {
      flex: 1,
      minWidth: 0,
      alignItems: isOpen ? "flex-start" : "center",
    },
    userName: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: spacing.xs,
      ...Platform.select({
        web: {
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          width: "100%",
        },
      }),
    },
    userEmail: {
      fontSize: 12,
      color: colors.textSecondary,
      ...Platform.select({
        web: {
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          width: "100%",
        },
      }),
    },
  });

  // Mobile bottom bar layout
  if (showAsBottomBar) {
    return (
      <View style={styles.sidebar}>
        {/* Navigation */}
        <View style={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavButton key={item.name} item={item} />
          ))}
        </View>
      </View>
    );
  }

  // Desktop sidebar layout
  return (
    <View style={styles.sidebar}>
      {/* Brand Section */}
      <View style={styles.brand}>
        <View style={styles.brandImage}>
          <Image
            source={
              colorScheme === "dark"
                ? require("@/assets/images/vm_dark.png")
                : require("@/assets/images/vm_logo.png")
            }
            style={
              colorScheme === "dark" ? styles.darkBrandImage : styles.brandImage
            }
            contentFit="contain"
            tintColor={colorScheme === "dark" ? undefined : colors.primary}
            accessibilityLabel="VM logo"
          />
        </View>
      </View>
      <View style={styles.togglePosition}>
        <Tooltip
          content={`${isOpen ? "Collapse" : "Expand"} sidebar (Ctrl+B)`}
          position="right"
        >
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={toggle}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <IconSymbol
              name={isOpen ? "chevron.left" : "chevron.right"}
              size={16}
              color={colors.text}
            />
          </TouchableOpacity>
        </Tooltip>
      </View>

      {/* Navigation */}
      <View style={styles.nav}>
        {isOpen && <Text style={styles.navGroupLabel}>MAIN</Text>}
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <NavButton key={item.name} item={item} />
        ))}
        <View style={styles.navDivider} />
        {isOpen && <Text style={styles.navGroupLabel}>ACCOUNT</Text>}
        {NAV_ITEMS.slice(5).map((item) => (
          <NavButton key={item.name} item={item} />
        ))}
      </View>

      {/* User Section */}
      <View style={styles.userSection}>
        {/* User Info */}
        <View style={styles.userInfoRow}>
          <Tooltip content="Profile" position="right" disabled={isOpen}>
            <TouchableOpacity
              style={styles.userInfo}
              onPress={() => router.push("/profile" as any)}
              activeOpacity={0.7}
            >
              <View style={styles.userAvatarRow}>
                {/* Avatar */}
                <View style={styles.avatar}>
                  <Text style={styles.avatarInitials}>
                    {profileInitials(profileName)}
                  </Text>
                  {avatarUrl && !avatarError ? (
                    <Image
                      source={{
                        uri: storageImageUrl("profile-avatars", avatarUrl),
                      }}
                      style={styles.avatarImage}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      onError={() => setAvatarError(true)}
                    />
                  ) : null}
                </View>

                {/* User Details - only show when expanded */}
                {isOpen && (
                  <View
                    style={[
                      styles.userDetails,
                      Platform.OS === "web" && {
                        // @ts-ignore - web-specific class
                        className: "text-fade-transition",
                      },
                    ]}
                  >
                    <Text style={styles.userName}>
                      {user?.profile?.username || profileName}
                    </Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </Tooltip>
        </View>

        {/* Sign Out Button */}
        <View style={styles.signOutButtonContainer}>
          <Tooltip content="Sign Out" position="right" disabled={isOpen}>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOutClick}
              activeOpacity={0.8}
            >
              <IconSymbol
                name="arrow.right.square"
                size={18}
                color={theme.colors.error}
              />
              {isOpen && <Text style={styles.signOutText}>Sign Out</Text>}
            </TouchableOpacity>
          </Tooltip>
        </View>
      </View>
    </View>
  );
}
