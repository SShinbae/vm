import { withOpacity, spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ConfirmModal } from "@/components/ui/Modal";
import { SidebarBadge } from "@/components/ui/SidebarBadge";
import { Tooltip } from "@/components/ui/Tooltip";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useNotifications } from "@/lib/contexts/NotificationContext";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import { Image } from "expo-image";
import { router, usePathname } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
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
  const { user, signOut } = useAuth();
  const { isOpen, toggle } = useSidebar();
  const { unreadCount } = useNotifications();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

  const handleSignOutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmSignOut = async () => {
    setShowLogoutModal(false);
    await signOut();
    router.replace("/(auth)/login");
  };

  const NavButton = ({ item }: { item: NavItem }) => {
    const isActive =
      pathname === item.path || pathname.startsWith(item.path + "/");

    return (
      <Tooltip
        content={item.label}
        position={showAsBottomBar ? "top" : "right"}
        disabled={showAsBottomBar ? true : isOpen} // Always show label on bottom bar, tooltip on collapsed sidebar
      >
        <TouchableOpacity
          style={[
            styles.navButton,
            showAsBottomBar && isActive && styles.navButtonActiveBottom,
            !showAsBottomBar && {
              backgroundColor: isActive ? colors.primary : "transparent",
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
                    : theme.colors.white
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
                      : theme.colors.white
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
        </TouchableOpacity>
      </Tooltip>
    );
  };

  const styles = StyleSheet.create({
    sidebar: showAsBottomBar
      ? {
          width: "100%",
          height: 64,
          backgroundColor: colors.background,
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
          width: isOpen ? 240 : 60,
          height: "100%",
          backgroundColor: colors.background,
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
    toggleButton: {
      position: "absolute",
      top: 36, // Align with "Vehicle Manager" text
      right: -15,
      width: 30,
      height: 30,
      borderRadius: 15,
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
      marginBottom: spacing.xxl,
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
    brandText: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginLeft: spacing.sm,
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
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.error,
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
      color: "white",
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
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      flexShrink: 0,
    },
    avatarImage: {
      width: "100%",
      height: "100%",
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

        <ConfirmModal
          visible={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleConfirmSignOut}
          title="Sign Out"
          message="Are you sure you want to sign out?"
          confirmText="Sign Out"
          cancelText="Cancel"
          variant="danger"
        />
      </View>
    );
  }

  // Desktop sidebar layout
  return (
    <View style={styles.sidebar}>
      {/* Toggle Button */}
      <Tooltip
        content={`${isOpen ? "Collapse" : "Expand"} sidebar (Ctrl+B)`}
        position="right"
      >
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={toggle}
          activeOpacity={0.7}
        >
          <IconSymbol
            name={isOpen ? "chevron.left" : "chevron.right"}
            size={16}
            color={colors.text}
          />
        </TouchableOpacity>
      </Tooltip>

      {/* Brand Section */}
      <Tooltip content="Vehicle Management" position="right" disabled={isOpen}>
        <View style={styles.brand}>
          <IconSymbol name="car.fill" size={24} color={colors.primary} />
          {isOpen && (
            <Text
              style={[
                styles.brandText,
                Platform.OS === "web" && {
                  // @ts-ignore - web-specific class
                  className: "text-fade-transition",
                },
              ]}
            >
              Vehicle Manager
            </Text>
          )}
        </View>
      </Tooltip>

      {/* Navigation */}
      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavButton key={item.name} item={item} />
        ))}
      </View>

      {/* User Section */}
      <View style={styles.userSection}>
        {/* Sign Out Button */}
        <View style={styles.signOutButtonContainer}>
          <Tooltip content="Sign Out" position="right" disabled={isOpen}>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOutClick}
              activeOpacity={0.8}
            >
              <IconSymbol name="arrow.right.square" size={14} color="white" />
              {isOpen && (
                <Text
                  style={[
                    styles.signOutText,
                    Platform.OS === "web" && {
                      // @ts-ignore - web-specific class
                      className: "text-fade-transition",
                    },
                  ]}
                >
                  Sign Out
                </Text>
              )}
            </TouchableOpacity>
          </Tooltip>
        </View>

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
                  {user?.profile?.avatar_url ? (
                    <Image
                      source={{ uri: user.profile.avatar_url }}
                      style={styles.avatarImage}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <IconSymbol
                      name="person.fill"
                      size={16}
                      color={colors.primary}
                    />
                  )}
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
                      {user?.profile?.username || user?.email?.split("@")[0]}
                    </Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </Tooltip>
        </View>
      </View>

      <ConfirmModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmSignOut}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="danger"
      />
    </View>
  );
}
