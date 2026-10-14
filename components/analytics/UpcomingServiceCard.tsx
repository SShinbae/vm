import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { webPageStyles } from "@/components/layout/webPageStyles";
import { spacing, withOpacity } from "@/src/design-system";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
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

  const formatOtherServices = (otherData: any) => {
    if (!otherData) return null;

    try {
      // Handle if it's already parsed or a string
      const services =
        typeof otherData === "string" ? JSON.parse(otherData) : otherData;
      if (!Array.isArray(services) || services.length === 0) return null;

      return services
        .map((item: any) => `${item.description}, RM${item.price}`)
        .join("; ");
    } catch (error) {
      console.error("Error parsing other services:", error);
      return null;
    }
  };

  const otherServicesText = formatOtherServices((service as any).other);

  const { isWeb, isMobile } = useResponsiveLayout();

  const { styles: web } = useStyles(webPageStyles);
  const isWebPage = isWeb && !isMobile;
  const statusLabel = {
    overdue: "Overdue",
    due_soon: "Due soon",
    upcoming: "Upcoming",
  }[service.status];
  const statusColor =
    service.status === "overdue"
      ? theme.colors.error
      : service.status === "due_soon"
        ? theme.colors.warning
        : theme.colors.primary;
  return (
    <View
      style={[
        styles.container,
        isWebPage && [
          web.panel,
          {
            shadowOpacity: 0,
            elevation: 0,
            flexDirection: "column",
            alignItems: "stretch",
            gap: theme.spacing.md,
            marginBottom: 0,
          },
        ],
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="build-outline"
            size={20}
            color={isWebPage ? statusColor : theme.colors.warning}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.serviceName}>
            {formatServiceType(service.serviceType)}
          </Text>
          <Text style={styles.vehicleName}>{service.vehicleName}</Text>
          {isWebPage && Number.isFinite(service.serviceDueAt) && (
            <Text style={styles.odometer}>
              Due at {service.serviceDueAt.toLocaleString("en-US")} km
            </Text>
          )}
          {otherServicesText && (
            <Text style={styles.otherServices}>{otherServicesText}</Text>
          )}
          {(service as any).odometer && (
            <Text style={styles.odometer}>
              Odometer:{" "}
              {Number((service as any).odometer).toLocaleString("en-US")} km
            </Text>
          )}
        </View>
      </View>
      {isWebPage ? (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: theme.spacing.sm,
          }}
        >
          <View
            style={{
              backgroundColor: withOpacity(statusColor, 0.12),
              borderRadius: theme.borderRadius.full,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
            }}
          >
            <Text
              style={{
                color: statusColor,
                fontSize: theme.fontSize.sm,
                fontWeight: theme.fontWeight.medium,
              }}
            >
              {statusLabel}
            </Text>
          </View>
          {Number.isFinite(service.daysUntilDue) && (
            <Text style={styles.dueDate}>
              Due {formatDate(service.daysUntilDue)}
            </Text>
          )}
        </View>
      ) : (
        <Text style={styles.dueDate}>{formatDate(service.daysUntilDue)}</Text>
      )}
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
    shadowColor: theme.colors.black,
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
    backgroundColor: theme.colors.gray[100],
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
    marginBottom: spacing.xs,
  },
  vehicleName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  otherServices: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: spacing.xs,
  },
  odometer: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: spacing.xs,
  },
  dueDate: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
}));
