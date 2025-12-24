import React from "react";
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
  return (
    <ResponsiveGrid
      columns={{ mobile: 2, tablet: 2, desktop: 2, largeDesktop: 4 }}
      spacing={16}
    >
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
    </ResponsiveGrid>
  );
}
