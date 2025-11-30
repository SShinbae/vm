/**
 * Reusable legend component for charts
 */

import React from "react";
import { View, Text } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

export interface LegendItem {
  name: string;
  color: string;
  value?: string;
}

interface ChartLegendProps {
  items: LegendItem[];
  orientation?: "horizontal" | "vertical";
}

export function ChartLegend({
  items,
  orientation = "horizontal",
}: ChartLegendProps) {
  const { styles } = useStyles(stylesheet);

  return (
    <View
      style={[
        styles.container,
        orientation === "vertical" && styles.verticalContainer,
      ]}
    >
      {items.map((item, index) => (
        <View
          key={index}
          style={[
            styles.legendItem,
            orientation === "vertical" && styles.verticalItem,
          ]}
        >
          <View style={[styles.colorBox, { backgroundColor: item.color }]} />
          <Text style={styles.legendText}>{item.name}</Text>
          {item.value && <Text style={styles.valueText}>{item.value}</Text>}
        </View>
      ))}
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  verticalContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  verticalItem: {
    marginBottom: theme.spacing.sm,
  },
  colorBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  valueText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
}));
