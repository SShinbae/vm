import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useStyles } from "react-native-unistyles";
import { useVehicleFilter } from "@/hooks/useAnalytics";
import { Button } from "@/components/ui/Button";
import { AnalyticsMobilePage } from "./AnalyticsMobilePage";
import { EmptyAnalytics } from "./EmptyAnalytics";

type AnalyticsStateProps = {
  loading: boolean;
  error?: Error | null;
  onRetry: () => void;
};

export function AnalyticsStateContent({
  loading,
  error,
  onRetry,
}: AnalyticsStateProps) {
  const { theme } = useStyles();
  return loading ? (
    <View style={{ alignItems: "center", gap: 12, paddingVertical: 32 }}>
      <ActivityIndicator color={theme.colors.primary} />
      <Text style={{ color: theme.colors.textSecondary }}>
        Loading analytics…
      </Text>
    </View>
  ) : error ? (
    <View style={{ gap: 16, paddingVertical: 24 }}>
      <Text accessibilityRole="alert" style={{ color: theme.colors.text }}>
        Couldn&apos;t load analytics. Please try again.
      </Text>
      <Button
        title="Retry analytics"
        onPress={onRetry}
        style={{ minHeight: 48 }}
      />
    </View>
  ) : (
    <EmptyAnalytics />
  );
}

export function AnalyticsCompactState({
  title,
  subtitle,
  loading,
  error,
  onRetry,
}: AnalyticsStateProps & {
  title: string;
  subtitle: string;
}) {
  const vehicles = useVehicleFilter();
  const retry = () => {
    onRetry();
    void vehicles.refetch();
  };
  return (
    <AnalyticsMobilePage
      title={title}
      subtitle={subtitle}
      refreshing={loading}
      onRefresh={retry}
    >
      <AnalyticsStateContent loading={loading} error={error} onRetry={retry} />
    </AnalyticsMobilePage>
  );
}
