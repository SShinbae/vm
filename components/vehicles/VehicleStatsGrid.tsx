import React from "react";
import { View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { StatCard } from "./StatCard";
import { DashboardStats } from "@/hooks/useVehicleStats";

interface VehicleStatsGridProps {
  stats: DashboardStats;
}

/**
 * VehicleStatsGrid Component
 * Displays a grid of vehicle statistics cards
 * Isolated component for easier layout management
 */
export function VehicleStatsGrid({ stats }: VehicleStatsGridProps) {
  const { styles } = useStyles(stylesheet);

  return (
    <View style={styles.statsGrid}>
      <StatCard
        title="Total Vehicles"
        value={stats.totalVehicles}
        icon="car.fill"
      />
      <StatCard
        title="Avg Mileage"
        value={`${Math.round(stats.avgMileage).toLocaleString()} km`}
        icon="speedometer"
      />
      <StatCard
        title="Monthly Fuel"
        value={`RM${stats.monthlyFuelCost.toFixed(2)}`}
        icon="fuelpump.fill"
      />
      <StatCard
        title="Services Due"
        value={stats.upcomingServices}
        icon="wrench.fill"
      />
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
}));
