import React, { useState } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import { useStyles } from "react-native-unistyles";
import { useAnalyticsData, usePeriodSelector } from "@/hooks/useAnalytics";
import { AnalyticsMobilePage } from "./AnalyticsMobilePage";
import { AnalyticsStateContent } from "./AnalyticsCompactState";
import {
  AnalyticsReportLink,
  AnalyticsReportSummaries,
} from "./AnalyticsReportSummaries";
import { LazyCostLineChart } from "./LazyChartComponents";

type SummaryProps = Pick<
  ReturnType<typeof useAnalyticsData>,
  "costMetrics" | "fuelMetrics" | "serviceMetrics" | "chartDataset"
> & {
  loading: boolean;
  error?: Error | null;
  onRefresh: () => void;
};
export function AnalyticsMobileSummary({
  costMetrics,
  fuelMetrics,
  serviceMetrics,
  chartDataset,
  loading,
  error,
  onRefresh,
}: SummaryProps) {
  const { theme } = useStyles();
  const { width, fontScale } = useWindowDimensions();
  const { period } = usePeriodSelector();
  const hasData =
    costMetrics &&
    (costMetrics.totalCost > 0 ||
      fuelMetrics?.fuelUps ||
      serviceMetrics?.totalServices);
  const stacked = width < 360 || fontScale >= 1.3;
  const [contentHeight, setContentHeight] = useState(0);
  const unavailable = loading || !!error || !hasData;
  return (
    <AnalyticsMobilePage
      title="Analytics"
      subtitle="Track costs, fuel, and maintenance"
      report={false}
      refreshing={loading}
      onRefresh={onRefresh}
    >
      <View
        testID="analytics-summary-content"
        // Keep loading/error content from shortening the page and clamping its scroll offset.
        style={{ minHeight: unavailable ? contentHeight : undefined }}
        onLayout={(event) => {
          if (!unavailable) setContentHeight(event.nativeEvent.layout.height);
        }}
      >
        {loading || error || !hasData ? (
          <View style={{ gap: 16 }}>
            <AnalyticsStateContent
              loading={loading}
              error={error}
              onRetry={onRefresh}
            />
            <AnalyticsReportSummaries includeCosts />
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <View
              style={{ flexDirection: stacked ? "column" : "row", gap: 12 }}
            >
              {[
                {
                  label: "Total spending",
                  value: `RM${costMetrics.totalCost.toFixed(2)}`,
                  subtitle: period.label,
                },
                {
                  label: "Cost per km",
                  value: `RM${costMetrics.costPerKm.toFixed(2)}`,
                  subtitle: "Average",
                },
              ].map((metric) => (
                <View
                  key={metric.label}
                  style={{
                    flex: stacked ? undefined : 1,
                    minWidth: 0,
                    padding: 16,
                    gap: 8,
                    backgroundColor: theme.colors.surface,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: theme.borderRadius.lg,
                  }}
                >
                  <Text style={{ color: theme.colors.textSecondary }}>
                    {metric.label}
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.text,
                      fontWeight: "700",
                      fontSize: theme.fontSize.xl,
                    }}
                  >
                    {metric.value}
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: theme.fontSize.xs,
                    }}
                  >
                    {metric.subtitle}
                  </Text>
                </View>
              ))}
            </View>
            <View>
              <LazyCostLineChart
                title="Cost trend"
                data={chartDataset?.data ?? []}
                height={220}
              />
              <AnalyticsReportLink report="costs" label="View cost report" />
            </View>
            <AnalyticsReportSummaries
              costMetrics={costMetrics}
              fuelMetrics={fuelMetrics}
              serviceMetrics={serviceMetrics}
            />
          </View>
        )}
      </View>
    </AnalyticsMobilePage>
  );
}
