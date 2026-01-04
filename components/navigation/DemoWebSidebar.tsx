import { IconSymbol } from "@/components/ui/icon-symbol";
import { ConfirmModal } from "@/components/ui/Modal";
import { Tooltip } from "@/components/ui/Tooltip";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import { router, usePathname } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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

const DEMO_NAV_ITEMS: NavItem[] = [
  {
    name: "dashboard",
    icon: "house.fill",
    path: "/demo/dashboard",
    label: "Dashboard",
  },
  {
    name: "vehicles",
    icon: "car.fill",
    path: "/demo/vehicles-list",
    label: "Kenderaan",
  },
  {
    name: "analytics",
    icon: "chart.line.uptrend.xyaxis",
    path: "/demo/analytics",
    label: "Analitik",
  },
  {
    name: "profile",
    icon: "person.fill",
    path: "/demo/profile",
    label: "Profil",
  },
];

export function DemoWebSidebar() {
  const layout = useResponsiveLayout();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebar();
  const [showExitModal, setShowExitModal] = useState(false);

  // Only render on web and demo pages
  const isDemoPage = pathname.startsWith("/demo");
  if (!layout.isWeb || !isDemoPage) {
    return null;
  }

  // Show as bottom bar on mobile web
  const showAsBottomBar = layout.isMobile;

  const handleExitDemo = () => {
    setShowExitModal(true);
  };

  const handleConfirmExit = () => {
    setShowExitModal(false);
    router.replace("/(auth)/login");
  };

  const handleCreateAccount = () => {
    Alert.alert(
      "Cipta Akaun",
      "Untuk menyimpan data anda, sila cipta akaun percuma!",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Cipta Akaun",
          onPress: () => router.push("/(auth)/register" as any),
        },
      ],
    );
  };

  const NavButton = ({ item }: { item: NavItem }) => {
    const isActive =
      pathname === item.path || pathname.startsWith(item.path + "/");

    return (
      <Tooltip
        content={item.label}
        position={showAsBottomBar ? "top" : "right"}
        disabled={showAsBottomBar ? true : isOpen}
      >
        <TouchableOpacity
          style={[
            styles.navButton,
            showAsBottomBar && isActive && styles.navButtonActiveBottom,
            !showAsBottomBar && {
              backgroundColor: isActive ? colors.tint : "transparent",
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
          {showAsBottomBar && isActive && <View style={styles.activeTopLine} />}
          <IconSymbol
            name={item.icon as any}
            size={showAsBottomBar ? 22 : 20}
            color={
              isActive
                ? showAsBottomBar
                  ? colors.tint
                  : "#ffffff"
                : colors.textSecondary
            }
          />
          {(showAsBottomBar || isOpen) && (
            <Text
              style={[
                styles.navButtonText,
                {
                  color: isActive
                    ? showAsBottomBar
                      ? colors.tint
                      : "#ffffff"
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
          paddingVertical: 8,
          paddingHorizontal: 16,
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
          borderRightColor: colors.border,
          paddingVertical: 24,
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
      top: 36,
      right: -15,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
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
    demoBadge: {
      backgroundColor: colors.warning || "#F59E0B",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      marginBottom: 16,
      alignSelf: isOpen ? "flex-start" : "center",
    },
    demoBadgeText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "700",
    },
    brand: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
      paddingHorizontal: isOpen ? 8 : 0,
      justifyContent: isOpen ? "flex-start" : "center",
      paddingVertical: 8,
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
      marginLeft: 8,
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
          gap: 4,
        },
    navButton: showAsBottomBar
      ? {
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 8,
          paddingHorizontal: 8,
          borderRadius: 8,
          gap: 4,
          flex: 1,
          minWidth: 0,
          position: "relative",
        }
      : {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 12,
          borderRadius: 8,
          gap: 12,
        },
    navButtonActiveBottom: {
      backgroundColor: colors.tint + "14",
    },
    activeTopLine: {
      position: "absolute",
      top: -8,
      left: "25%",
      width: "50%",
      height: 2,
      backgroundColor: colors.tint,
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
      borderTopColor: colors.border,
      paddingTop: 16,
      gap: 12,
    },
    createAccountButton: {
      width: isOpen ? "100%" : 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.tint,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginBottom: 8,
      ...Platform.select({
        web: {
          // @ts-ignore - web-specific class
          className: "toggle-button-transition",
        },
      }),
    },
    exitButtonContainer: {
      paddingHorizontal: isOpen ? 8 : 0,
      alignItems: "center",
    },
    exitButton: {
      width: isOpen ? "100%" : 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "#ff4444",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      ...Platform.select({
        web: {
          // @ts-ignore - web-specific class
          className: "toggle-button-transition",
        },
      }),
    },
    buttonText: {
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
      gap: 8,
    },
    userAvatarRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      width: isOpen ? "100%" : undefined,
      justifyContent: "center",
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.tint,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      flexShrink: 0,
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
      marginBottom: 2,
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
        <View style={styles.nav}>
          {DEMO_NAV_ITEMS.map((item) => (
            <NavButton key={item.name} item={item} />
          ))}
        </View>

        <ConfirmModal
          visible={showExitModal}
          onClose={() => setShowExitModal(false)}
          onConfirm={handleConfirmExit}
          title="Keluar Demo?"
          message="Adakah anda pasti mahu keluar dari mod demo?"
          confirmText="Keluar"
          cancelText="Batal"
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
        content={`${isOpen ? "Kecilkan" : "Besarkan"} sidebar`}
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
          <IconSymbol name="car.fill" size={24} color={colors.tint} />
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

      {/* Demo Badge */}
      <View style={styles.demoBadge}>
        <Text style={styles.demoBadgeText}>{isOpen ? "MOD DEMO" : "DEMO"}</Text>
      </View>

      {/* Navigation */}
      <View style={styles.nav}>
        {DEMO_NAV_ITEMS.map((item) => (
          <NavButton key={item.name} item={item} />
        ))}
      </View>

      {/* User Section */}
      <View style={styles.userSection}>
        {/* Create Account Button */}
        <View style={styles.exitButtonContainer}>
          <Tooltip content="Cipta Akaun" position="right" disabled={isOpen}>
            <TouchableOpacity
              style={styles.createAccountButton}
              onPress={handleCreateAccount}
              activeOpacity={0.8}
            >
              <IconSymbol name="person.badge.plus" size={14} color="white" />
              {isOpen && (
                <Text
                  style={[
                    styles.buttonText,
                    Platform.OS === "web" && {
                      // @ts-ignore - web-specific class
                      className: "text-fade-transition",
                    },
                  ]}
                >
                  Cipta Akaun
                </Text>
              )}
            </TouchableOpacity>
          </Tooltip>
        </View>

        {/* Exit Demo Button */}
        <View style={styles.exitButtonContainer}>
          <Tooltip content="Keluar Demo" position="right" disabled={isOpen}>
            <TouchableOpacity
              style={styles.exitButton}
              onPress={handleExitDemo}
              activeOpacity={0.8}
            >
              <IconSymbol name="arrow.right.square" size={14} color="white" />
              {isOpen && (
                <Text
                  style={[
                    styles.buttonText,
                    Platform.OS === "web" && {
                      // @ts-ignore - web-specific class
                      className: "text-fade-transition",
                    },
                  ]}
                >
                  Keluar Demo
                </Text>
              )}
            </TouchableOpacity>
          </Tooltip>
        </View>

        {/* Demo User Info */}
        <View style={styles.userInfoRow}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatarRow}>
              <View style={styles.avatar}>
                <IconSymbol name="person.fill" size={16} color={colors.tint} />
              </View>
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
                  <Text style={styles.userName}>Ahmad bin Abdullah</Text>
                  <Text style={styles.userEmail}>demo@example.com</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      <ConfirmModal
        visible={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={handleConfirmExit}
        title="Keluar Demo?"
        message="Adakah anda pasti mahu keluar dari mod demo?"
        confirmText="Keluar"
        cancelText="Batal"
        variant="danger"
      />
    </View>
  );
}
