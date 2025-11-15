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

  const formatServiceType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDate = (daysUntilDue?: number) => {
    if (daysUntilDue === undefined) return "";

    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + daysUntilDue);

    return dueDate.toISOString().split("T")[0];
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="build-outline"
            size={20}
            color={theme.colors.warning}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.serviceName}>
            {formatServiceType(service.serviceType)}
          </Text>
          <Text style={styles.vehicleName}>{service.vehicleName}</Text>
        </View>
      </View>
      <Text style={styles.dueDate}>{formatDate(service.daysUntilDue)}</Text>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    flex: 1,
  },
  iconContainer: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.gray?.[100] || "#f3f4f6",
    borderRadius: theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  serviceName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: 2,
  },
  vehicleName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  dueDate: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
}));
