import React from "react";
import { Text, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

interface CostBreakdownCardProps {
  totalCost: number;
  fuelCost: number;
  serviceCost: number;
}

export function CostBreakdownCard({
  totalCost,
  fuelCost,
  serviceCost,
}: CostBreakdownCardProps) {
  const { styles } = useStyles(stylesheet);

  const safeTotal = totalCost === 0 ? 1 : totalCost;
  const fuelPercentage = (fuelCost / safeTotal) * 100;
  const servicePercentage = (serviceCost / safeTotal) * 100;

  return (
    <View style={styles.container}>
      {/* Horizontal Bar */}
      <View style={styles.barContainer}>
        <View
          style={[
            styles.barSegment,
            styles.fuelBar,
            { width: `${fuelPercentage}%` },
          ]}
        />
        <View
          style={[
            styles.barSegment,
            styles.serviceBar,
            { width: `${servicePercentage}%` },
          ]}
        />
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, styles.fuelDot]} />
            <Text style={styles.legendLabel}>Fuel</Text>
            <Text style={styles.legendPercentage}>
              ({fuelPercentage.toFixed(0)}%)
            </Text>
          </View>
          <Text style={styles.legendValue}>RM{fuelCost.toFixed(2)}</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, styles.serviceDot]} />
            <Text style={styles.legendLabel}>Service</Text>
            <Text style={styles.legendPercentage}>
              ({servicePercentage.toFixed(0)}%)
            </Text>
          </View>
          <Text style={styles.legendValue}>RM{serviceCost.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  barContainer: {
    flexDirection: "row",
    height: 16,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.gray?.[200] || "#e5e7eb",
    overflow: "hidden",
    marginBottom: theme.spacing.lg,
  },
  barSegment: {
    height: "100%",
  },
  fuelBar: {
    backgroundColor: theme.colors.analytics.fuel,
  },
  serviceBar: {
    backgroundColor: theme.colors.analytics.service,
  },
  legend: {
    gap: theme.spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: theme.borderRadius.full,
  },
  fuelDot: {
    backgroundColor: theme.colors.analytics.fuel,
  },
  serviceDot: {
    backgroundColor: theme.colors.analytics.service,
  },
  legendLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  legendPercentage: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  legendValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
}));
