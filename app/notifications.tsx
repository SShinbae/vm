import React from "react";
import {
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

export default function NotificationsScreen() {
  const { styles, theme } = useStyles(stylesheet);
  const { isDesktop } = useResponsiveLayout();
  const { unreadCount, refreshNotifications } = useNotifications();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleNotificationPress = (notification: NotificationData) => {
    switch (notification.notification_type) {
      case "mileage_log":
      case "fuel_log":
      case "service_log":
        if (notification.related_vehicle_id) {
          router.push(`/vehicles/${notification.related_vehicle_id}`);
        }
        break;
      case "group_member":
      case "group_invite":
        if (notification.related_group_id) {
          router.push(`/vehicles/${notification.related_group_id}`);
        }
        break;
      default:
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
