import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View, ViewStyle } from "react-native";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  animated?: boolean;
}

export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = 4,
  style,
  animated = true,
}: SkeletonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue, animated]);

  const backgroundColor = animated
    ? animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.icon + "20", colors.icon + "40"],
      })
    : colors.icon + "20";

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        } as any,
        style,
      ]}
    />
  );
}

export function SkeletonCard({
  showAvatar = false,
  lines = 3,
  style,
}: {
  showAvatar?: boolean;
  lines?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardContent}>
        {showAvatar && (
          <View style={styles.avatarRow}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <View style={styles.avatarText}>
              <Skeleton width="60%" height={16} />
              <Skeleton width="40%" height={12} style={{ marginTop: 4 }} />
            </View>
          </View>
        )}

        <View style={styles.textLines}>
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton
              key={index}
              width={index === lines - 1 ? "70%" : "100%"}
              height={14}
              style={{ marginBottom: 8 }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

export function SkeletonList({
  itemCount = 5,
  showAvatar = false,
  lines = 2,
}: {
  itemCount?: number;
  showAvatar?: boolean;
  lines?: number;
}) {
  return (
    <View style={styles.list}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <SkeletonCard
          key={index}
          showAvatar={showAvatar}
          lines={lines}
          style={{ marginBottom: 12 }}
        />
      ))}
    </View>
  );
}

export function SkeletonButton({
  width = 120,
  height = 40,
  style,
}: {
  width?: number;
  height?: number;
  style?: ViewStyle;
}) {
  return (
    <Skeleton width={width} height={height} borderRadius={8} style={style} />
  );
}

export function SkeletonHeader({
  showBackButton = true,
  showActions = true,
  style,
}: {
  showBackButton?: boolean;
  showActions?: boolean;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.header, style]}>
      {showBackButton && <Skeleton width={24} height={24} borderRadius={4} />}
      <Skeleton
        width="40%"
        height={24}
        style={{ marginLeft: showBackButton ? 16 : 0 }}
      />
      <View style={styles.spacer} />
      {showActions && (
        <View style={styles.headerActions}>
          <Skeleton width={60} height={32} borderRadius={6} />
        </View>
      )}
    </View>
  );
}

export function SkeletonStats({
  count = 3,
  style,
}: {
  count?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.stats, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.statItem}>
          <Skeleton width={40} height={20} style={{ marginBottom: 4 }} />
          <Skeleton width={60} height={12} />
        </View>
      ))}
    </View>
  );
}

// Dashboard Skeleton
export function SkeletonDashboard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.dashboardContainer, style]}>
      {/* Header */}
      <View style={styles.dashboardHeader}>
        <Skeleton width="50%" height={28} style={{ marginBottom: 8 }} />
        <Skeleton width="70%" height={16} />
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.statCard}>
            <Skeleton width={32} height={32} borderRadius={16} />
            <Skeleton width="60%" height={20} style={{ marginTop: 12 }} />
            <Skeleton width="40%" height={14} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>

      {/* Vehicle Cards */}
      <View style={styles.section}>
        <Skeleton width="40%" height={20} style={{ marginBottom: 16 }} />
        {[1, 2].map((i) => (
          <View key={i} style={styles.vehicleCard}>
            <Skeleton width={80} height={80} borderRadius={12} />
            <View style={styles.vehicleCardContent}>
              <Skeleton width="70%" height={18} style={{ marginBottom: 8 }} />
              <Skeleton width="50%" height={14} style={{ marginBottom: 8 }} />
              <Skeleton width="40%" height={14} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// Vehicle List Skeleton
export function SkeletonVehicleList({
  itemCount = 3,
  style,
}: {
  itemCount?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.list, style]}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <View key={index} style={styles.vehicleCard}>
          <Skeleton width={80} height={80} borderRadius={12} />
          <View style={styles.vehicleCardContent}>
            <Skeleton width="70%" height={18} style={{ marginBottom: 8 }} />
            <Skeleton width="50%" height={14} style={{ marginBottom: 8 }} />
            <Skeleton width="40%" height={14} />
          </View>
        </View>
      ))}
    </View>
  );
}

// Analytics Skeleton
export function SkeletonAnalytics({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.analyticsContainer, style]}>
      {/* Filter Section */}
      <View style={styles.filterSection}>
        <Skeleton width="30%" height={36} borderRadius={8} />
        <Skeleton width="40%" height={36} borderRadius={8} />
      </View>

      {/* Metric Cards */}
      <View style={styles.metricsGrid}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.metricCard}>
            <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
            <Skeleton width="80%" height={24} style={{ marginBottom: 4 }} />
            <Skeleton width="40%" height={14} />
          </View>
        ))}
      </View>

      {/* Chart Section */}
      <View style={styles.chartSection}>
        <Skeleton width="50%" height={20} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={200} borderRadius={12} />
      </View>
    </View>
  );
}

// Profile Skeleton
export function SkeletonProfile({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.profileContainer, style]}>
      {/* Header with Avatar */}
      <View style={styles.profileHeader}>
        <Skeleton width={100} height={100} borderRadius={50} />
        <Skeleton
          width="60%"
          height={24}
          style={{ marginTop: 16, marginBottom: 8 }}
        />
        <Skeleton width="40%" height={16} />
      </View>

      {/* Stats */}
      <View style={styles.profileStats}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.profileStatItem}>
            <Skeleton width={60} height={28} style={{ marginBottom: 4 }} />
            <Skeleton width={80} height={14} />
          </View>
        ))}
      </View>

      {/* Settings List */}
      <View style={styles.settingsList}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <Skeleton width={24} height={24} borderRadius={6} />
              <Skeleton width={120} height={16} style={{ marginLeft: 12 }} />
            </View>
            <Skeleton width={40} height={20} borderRadius={10} />
          </View>
        ))}
      </View>
    </View>
  );
}

// Log List Skeleton
export function SkeletonLogList({
  itemCount = 5,
  style,
}: {
  itemCount?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.logList, style]}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <View key={index} style={styles.logItem}>
          <View style={styles.logItemHeader}>
            <Skeleton width={60} height={60} borderRadius={8} />
            <View style={styles.logItemContent}>
              <Skeleton width="70%" height={16} style={{ marginBottom: 8 }} />
              <Skeleton width="50%" height={14} style={{ marginBottom: 6 }} />
              <Skeleton width="40%" height={12} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

// Vehicle Detail Skeleton
export function SkeletonVehicleDetail({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.vehicleDetailContainer, style]}>
      {/* Hero Image */}
      <Skeleton width="100%" height={250} />

      {/* Vehicle Info */}
      <View style={styles.vehicleDetailInfo}>
        <Skeleton width="80%" height={28} style={{ marginBottom: 12 }} />
        <Skeleton width="60%" height={18} style={{ marginBottom: 20 }} />

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.quickStatItem}>
              <Skeleton width={60} height={20} style={{ marginBottom: 4 }} />
              <Skeleton width={40} height={14} />
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              width={80}
              height={40}
              borderRadius={8}
              style={{ marginRight: 12 }}
            />
          ))}
        </View>

        {/* Log Items */}
        <SkeletonLogList itemCount={3} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    // Base skeleton styles are handled by the component
  },
  card: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: "transparent",
  },
  cardContent: {
    // Card content container
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    flex: 1,
    marginLeft: 12,
  },
  textLines: {
    // Text lines container
  },
  list: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  spacer: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
  },
  statItem: {
    alignItems: "center",
  },
  dashboardContainer: {
    flex: 1,
    padding: 20,
  },
  dashboardHeader: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  section: {
    marginBottom: 24,
  },
  vehicleCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  vehicleCardContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  analyticsContainer: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: 150,
    padding: 16,
    borderRadius: 12,
  },
  chartSection: {
    marginBottom: 24,
  },
  profileContainer: {
    flex: 1,
  },
  profileHeader: {
    alignItems: "center",
    padding: 24,
  },
  profileStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  profileStatItem: {
    alignItems: "center",
  },
  settingsList: {
    padding: 20,
  },
  settingsItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingsItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logList: {
    padding: 16,
  },
  logItem: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  logItemHeader: {
    flexDirection: "row",
  },
  logItemContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  vehicleDetailContainer: {
    flex: 1,
  },
  vehicleDetailInfo: {
    padding: 20,
  },
  quickStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  quickStatItem: {
    alignItems: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
});
