import React from "react";
import { View, Text } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Ionicons } from "@expo/vector-icons";
import { UpcomingService } from "../../types/analytics";

interface UpcomingServiceCardProps {
  service: UpcomingService;
}

export function UpcomingServiceCard({ service }: UpcomingServiceCardProps) {
  const { styles, theme } = useStyles(stylesheet);

  const getStatusColor = () => {
    switch (service.status) {
      case "overdue":
        return theme.colors.error;
      case "due_soon":
        return theme.colors.warning;
      default:
        return theme.colors.success;
    }
  };

  const getStatusText = () => {
    switch (service.status) {
      case "overdue":
        return "Overdue";
      case "due_soon":
        return "Due Soon";
      default:
        return "Upcoming";
    }
  };

  const getStatusIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (service.status) {
      case "overdue":
        return "alert-circle";
      case "due_soon":
        return "warning";
      default:
        return "time-outline";
    }
  };

  const formatServiceType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name={getStatusIcon()} size={24} color={getStatusColor()} />
          <View style={styles.headerInfo}>
            <Text style={styles.vehicleName}>{service.vehicleName}</Text>
            <Text style={styles.serviceType}>
              {formatServiceType(service.serviceType)}
            </Text>
          </View>
        </View>
        <View
          style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}
        >
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Due at</Text>
          <Text style={styles.detailValue}>
            {service.serviceDueAt.toLocaleString()} km
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Distance remaining</Text>
          <Text
            style={[
              styles.detailValue,
              service.kmUntilDue < 0 && { color: theme.colors.error },
            ]}
          >
            {service.kmUntilDue < 0
              ? `${Math.abs(service.kmUntilDue)} km overdue`
              : `${service.kmUntilDue} km`}
          </Text>
        </View>
        {service.daysUntilDue !== undefined && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Time remaining</Text>
            <Text
              style={[
                styles.detailValue,
                service.daysUntilDue < 0 && { color: theme.colors.error },
              ]}
            >
              {service.daysUntilDue < 0
                ? `${Math.abs(service.daysUntilDue)} days overdue`
                : `${service.daysUntilDue} days`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    flex: 1,
  },
  headerInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  serviceType: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.white,
    fontWeight: theme.fontWeight.bold,
  },
  details: {
    gap: theme.spacing.sm,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
}));
