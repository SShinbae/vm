import { IconSymbol } from "@/components/ui/icon-symbol";
import { ConfirmModal } from "@/components/ui/Modal";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useAuth } from "@/lib/contexts/AuthContext";
import { router, usePathname } from "expo-router";
import React, { useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import type { SFSymbols6_0 } from "sf-symbols-typescript";

interface NavItem {
  name: string;
  icon: SFSymbols6_0;
  path: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: "dashboard", icon: "house.fill", path: "/", label: "Dashboard" },
  { name: "vehicles", icon: "car.fill", path: "/vehicles", label: "Vehicles" },
  { name: "logs", icon: "doc.text.fill", path: "/logs", label: "Logs" },
  { name: "groups", icon: "person.3.fill", path: "/groups", label: "Groups" },
  { name: "profile", icon: "person.fill", path: "/profile", label: "Profile" },
];

export function WebNavbar() {
  const layout = useResponsiveLayout();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { styles, theme } = useStyles(stylesheet);

  // Only render on web and larger screens
  if (!layout.isWeb || layout.isMobile) {
    return null;
  }

  const handleSignOutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmSignOut = async () => {
    setShowLogoutModal(false);
    await signOut();
    router.replace("/login");
  };

  const NavButton = ({ item }: { item: NavItem }) => {
    const isActive =
      pathname === item.path || pathname.startsWith(item.path + "/");

    return (
      <TouchableOpacity
        style={[
          styles.navButton,
          {
            backgroundColor: isActive ? theme.colors.primary : "transparent",
          },
        ]}
        onPress={() => router.push(item.path as any)}
      >
        <IconSymbol
          name={item.icon}
          size={20}
          color={isActive ? theme.colors.white : theme.colors.text}
        />
        <Text
          style={[
            styles.navButtonText,
            {
              color: isActive ? theme.colors.white : theme.colors.text,
            },
          ]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.navbar, { paddingHorizontal: layout.contentPadding }]}>
      <View style={styles.brand}>
        <IconSymbol name="car.fill" size={24} color={theme.colors.primary} />
        <Text style={styles.brandText}>Vehicle Manager</Text>
      </View>

      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavButton key={item.name} item={item} />
        ))}
      </View>

      <View style={styles.userSection}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.email?.split("@")[0]}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOutClick}
        >
          <IconSymbol name="arrow.right.square" size={16} color="white" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
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

const stylesheet = createStyleSheet((theme) => ({
  navbar: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...Platform.select({
      web: {
        position: "sticky" as any,
        top: 0,
        zIndex: 100,
      },
    }),
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 40,
  },
  brandText: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
    marginLeft: 8,
  },
  nav: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  userInfo: {
    alignItems: "flex-end",
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  userEmail: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: theme.colors.error,
    gap: 6,
  },
  signOutText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
}));
