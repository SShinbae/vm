import { LineChart } from "@/components/charts/LineChart";
import { FuelCostPoint } from "@/lib/dashboard/homeOverview";
import { WebFilterButton } from "@/components/ui/WebFilterButton";
import { webPageStyles } from "@/components/layout/webPageStyles";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import React, { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

type Props = {
  points: FuelCostPoint[];
  months: 6 | 12;
  onMonthsChange: (months: 6 | 12) => void;
  loading: boolean;
  error: string | null;
};

export function HomeFuelTrend({
  points,
  months,
  onMonthsChange,
  loading,
  error,
}: Props) {
  const { styles, theme } = useStyles(stylesheet);
  const { styles: web } = useStyles(webPageStyles);
  const layout = useResponsiveLayout();
  const isWebPage = layout.isWeb && !layout.isMobile;
  const [chartWidth, setChartWidth] = useState(0);
  const hasCosts = points.some((point) => point.value > 0);

  return (
    <View style={[styles.card, isWebPage && web.panel]}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>Fuel cost trend</Text>
          <Text style={styles.subtitle}>Monthly fuel expenses</Text>
        </View>
        <View style={styles.range}>
          {([6, 12] as const).map((option) =>
            isWebPage ? (
              <WebFilterButton
                key={option}
                label={`${option} months`}
                selected={months === option}
                onPress={() => onMonthsChange(option)}
              />
            ) : (
              <TouchableOpacity
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected: months === option }}
                onPress={() => onMonthsChange(option)}
                style={[
                  styles.rangeButton,
                  months === option && styles.rangeButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.rangeText,
                    months === option && styles.rangeTextActive,
                  ]}
                >
                  {option} months
                </Text>
              </TouchableOpacity>
            ),
          )}
        </View>
      </View>
      <View
        style={styles.chartBody}
        onLayout={(event) => setChartWidth(event.nativeEvent.layout.width)}
      >
        {loading ? (
          <ActivityIndicator
            accessibilityLabel="Loading fuel costs"
            color={theme.colors.analytics.teal}
          />
        ) : error ? (
          <Text style={styles.stateText}>
            Fuel costs unavailable. Pull to refresh.
          </Text>
        ) : !hasCosts ? (
          <Text style={styles.stateText}>No fuel costs in this period</Text>
        ) : (
          <LineChart
            data={points.map((point, index) => ({
              x: point.month,
              y: point.value,
              label:
                months === 12 && chartWidth < 500 && index % 2 === 0
                  ? ""
                  : point.label,
            }))}
            title="Fuel cost trend"
            height={220}
            color={theme.colors.analytics.teal}
            showArea
            embedded
            width={chartWidth || undefined}
          />
        )}
      </View>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  titleGroup: { gap: theme.spacing.xs },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  subtitle: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
  range: { flexDirection: "row", gap: theme.spacing.xs },
  rangeButton: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rangeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  rangeText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  rangeTextActive: { color: theme.colors.white },
  chartBody: { minHeight: 220, justifyContent: "center" },
  stateText: {
    color: theme.colors.textSecondary,
    textAlign: "center",
    fontSize: theme.fontSize.sm,
  },
}));
