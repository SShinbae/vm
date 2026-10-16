import { goBack } from "@/lib/utils/goBack";
import React from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { useStyles } from "react-native-unistyles";
import { BreadcrumbItem, Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { AUTO_MILEAGE_LOG_READ_ONLY } from "@/lib/services/mileageLogService";
import { Vehicle } from "@/types";

export function LogPageNavigation({
  title,
  vehicleId,
  vehicle,
  serviceDetailId,
  error,
  retry,
  readOnly,
}: {
  title: string;
  vehicleId?: string | null;
  vehicle?: Pick<Vehicle, "year" | "make" | "model"> | null;
  serviceDetailId?: string;
  error?: string | null;
  retry?: () => void;
  readOnly?: boolean;
}) {
  const { theme } = useStyles();
  const layout = useResponsiveLayout();
  const desktop = layout.isWeb && !layout.isMobile;
  if (!desktop && !readOnly && !error) return null;
  const items: BreadcrumbItem[] =
    vehicleId && vehicle
      ? [
          { label: "Vehicles", href: "/vehicles" },
          {
            label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            href: { pathname: "/vehicles/[id]", params: { id: vehicleId } },
          },
        ]
      : [{ label: "Logs", href: "/logs" }];
  if (serviceDetailId)
    items.push({
      label: "Service Details",
      href: { pathname: "/logs/service/[id]", params: { id: serviceDetailId } },
    });
  items.push({ label: title });
  return (
    <View
      style={{
        width: "100%",
        maxWidth: 960,
        alignSelf: "center",
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing.md,
        flexShrink: 0,
      }}
    >
      {desktop && <Breadcrumbs items={items} />}
      {readOnly && (
        <Text
          style={{
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing.md,
          }}
        >
          {AUTO_MILEAGE_LOG_READ_ONLY}
        </Text>
      )}
      {error && (
        <View
          style={{
            gap: theme.spacing.md,
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
          }}
        >
          <Text style={{ color: theme.colors.text }}>{error}</Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: theme.spacing.md,
            }}
          >
            {retry && (
              <Button title="Retry" onPress={retry} style={{ minHeight: 48 }} />
            )}
            <Button
              title="Return to Logs"
              variant="outline"
              style={{ minHeight: 48 }}
              onPress={() =>
                desktop ? router.replace("/logs") : goBack("/logs")
              }
            />
          </View>
        </View>
      )}
    </View>
  );
}
