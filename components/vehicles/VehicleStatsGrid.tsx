import React from "react";
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
  const MetricCard = layout.isWeb && !layout.isMobile ? HomeStatCard : StatCard;
  return (
    <ResponsiveGrid
      columns={{
        mobile: 2,
        tablet: 2,
        desktop: layout.isWeb && !layout.isMobile ? 4 : 2,
        largeDesktop: 4,
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
