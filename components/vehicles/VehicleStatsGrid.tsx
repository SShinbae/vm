import React from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatCard as HomeStatCard } from "@/components/dashboard/StatCard";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { ResponsiveGrid } from "@/components/layout/ResponsiveGrid";
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
  const layout = useResponsiveLayout();
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isCompact = !layout.isWeb || layout.isMobile;
  const columns =
    width - insets.left - insets.right - 32 < 328 || fontScale >= 1.3 ? 1 : 2;
  const MetricCard = layout.isWeb && !layout.isMobile ? HomeStatCard : StatCard;
  return (
    <ResponsiveGrid
      columns={{
        mobile: isCompact ? columns : 2,
        tablet: isCompact ? columns : 2,
        desktop: isCompact ? columns : 4,
        largeDesktop: isCompact ? columns : 4,
      }}
      spacing={16}
    >
      <MetricCard
        title="Total Vehicles"
        value={stats.totalVehicles}
        icon="car.fill"
      />
      <MetricCard
        title="Avg Mileage"
        value={`${Math.round(stats.avgMileage).toLocaleString()} km`}
        icon="speedometer"
      />
      <MetricCard
        title="Monthly Fuel"
        value={`RM${stats.monthlyFuelCost.toFixed(2)}`}
        icon="fuelpump.fill"
      />
      <MetricCard
        title="Services Due"
        value={stats.upcomingServices}
        icon="wrench.fill"
      />
    </ResponsiveGrid>
  );
}
