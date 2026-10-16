import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useStyles } from "react-native-unistyles";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  CostMetrics,
  FuelEfficiencyMetrics,
  ServiceMetrics,
} from "@/types/analytics";
import { UpcomingServiceCard } from "./UpcomingServiceCard";

export function AnalyticsReportSummaries({
  costMetrics,
  fuelMetrics,
  serviceMetrics,
  includeCosts = false,
}: {
  costMetrics?: CostMetrics | null;
  fuelMetrics?: FuelEfficiencyMetrics | null;
  serviceMetrics?: ServiceMetrics | null;
  includeCosts?: boolean;
}) {
  const { theme } = useStyles();
  const reports = [
    ...(includeCosts
      ? [
          {
            title: "Costs",
            route: "costs",
            description: "Fuel and service spending",
            label: "View cost report",
          },
        ]
      : []),
    {
      title: "Fuel",
      route: "fuel",
      label: "View fuel report",
      description:
        costMetrics && fuelMetrics
          ? `RM${costMetrics.totalFuelCost.toFixed(2)} · ${fuelMetrics.fuelUps} fill-ups · ${fuelMetrics.averageConsumption.toFixed(1)} L/100km`
          : "Fuel spending and efficiency",
    },
    {
      title: "Service",
      route: "service",
      label: "View service report",
      description:
        costMetrics && serviceMetrics
          ? `RM${costMetrics.totalServiceCost.toFixed(2)} · ${serviceMetrics.totalServices} services`
          : "Maintenance costs and upcoming services",
    },
    {
      title: "Performance",
      route: "performance",
      label: "View performance report",
      description: fuelMetrics
        ? `${fuelMetrics.totalDistance.toLocaleString()} km traveled · ${fuelMetrics.averageConsumption.toFixed(1)} L/100km`
        : "Distance and vehicle performance",
    },
  ];
  return (
    <View style={{ gap: 12 }}>
      {reports.map((report) => (
        <View
          key={report.route}
          style={{
            padding: 16,
            gap: 8,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.lg,
          }}
        >
          <Text
            accessibilityRole="header"
            style={{
              color: theme.colors.text,
              fontSize: theme.fontSize.lg,
              fontWeight: "600",
            }}
          >
            {report.title}
          </Text>
          <Text style={{ color: theme.colors.textSecondary }}>
            {report.description}
          </Text>
          {report.route === "service" &&
            serviceMetrics?.upcomingServices[0] && (
              <UpcomingServiceCard
                service={serviceMetrics.upcomingServices[0]}
              />
            )}
          <AnalyticsReportLink
            report={
              report.route as "costs" | "fuel" | "service" | "performance"
            }
            label={report.label}
          />
        </View>
      ))}
    </View>
  );
}

export function AnalyticsReportLink({
  report,
  label,
}: {
  report: "costs" | "fuel" | "service" | "performance";
  label: string;
}) {
  const router = useRouter();
  const { theme } = useStyles();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => router.push(`/analytics/${report}`)}
      style={{
        minHeight: 48,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <Text style={{ color: theme.colors.primary, fontWeight: "600", flex: 1 }}>
        {label}
      </Text>
      <IconSymbol name="chevron.right" size={16} color={theme.colors.primary} />
    </TouchableOpacity>
  );
}
