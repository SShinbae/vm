import { AnalyticsVehiclePicker } from "./AnalyticsVehiclePicker";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { webPageStyles } from "@/components/layout/webPageStyles";
import React, { type ReactNode } from "react";
import { View, Text } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Ionicons } from "@expo/vector-icons";
import { Vehicle } from "../../types";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

interface VehicleFilterProps {
  vehicles: Vehicle[];
  selectedVehicleIds: string[];
  onToggleVehicle: (vehicleId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  periodControl?: ReactNode;
}

export function VehicleFilter({
  vehicles,
  selectedVehicleIds,
  onToggleVehicle,
  onSelectAll,
  periodControl,
}: VehicleFilterProps) {
  const { styles, theme } = useStyles(stylesheet);
  const { isWeb, isMobile } = useResponsiveLayout();

  const isAllSelected = selectedVehicleIds.length === 0;

  const isVehicleSelected = (vehicleId: string) => {
    return isAllSelected || selectedVehicleIds.includes(vehicleId);
  };

  const iconSize = isMobile ? 18 : 20;

  const { styles: web } = useStyles(webPageStyles);
  const isWebPage = isWeb && !isMobile;
  const selectedVehicles = vehicles.filter((vehicle) =>
    selectedVehicleIds.includes(vehicle.id),
  );
  const selectedLabel = isAllSelected
    ? "All vehicles"
    : selectedVehicles.length === 1
      ? `${selectedVehicles[0].year} ${selectedVehicles[0].make} ${selectedVehicles[0].model}`
      : `${selectedVehicles.length} vehicles selected`;

  if (!isWebPage)
    return (
      <AnalyticsVehiclePicker
        vehicles={vehicles}
        selectedVehicleIds={selectedVehicleIds}
        onToggleVehicle={onToggleVehicle}
        onSelectAll={onSelectAll}
      />
    );

  return (
    <View
      style={[
        styles.container,
        isMobile && styles.containerMobile,
        isWebPage && [
          web.panel,
          {
            shadowOpacity: 0,
            elevation: 0,
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            gap: theme.spacing.lg,
          },
        ],
      ]}
    >
      <View style={isWebPage ? { flex: 1, minWidth: 280 } : undefined}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons
              name="car-outline"
              size={iconSize}
              color={theme.colors.textSecondary}
            />
            <View>
              <Text style={[styles.title, isMobile && styles.titleMobile]}>
                {isWebPage ? "Filter by vehicle" : "Filter by Vehicle"}
              </Text>
              {isWebPage && (
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.fontSize.xs,
                  }}
                >
                  Select a vehicle to view its analytics data
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
      {isWebPage && (
        <ActionMenu
          label={selectedLabel}
          items={[
            { label: "All vehicles", icon: "car", onPress: onSelectAll },
            ...vehicles.map((vehicle) => ({
              label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
              icon: isVehicleSelected(vehicle.id) ? "checkmark" : "car",
              onPress: () => onToggleVehicle(vehicle.id),
            })),
          ]}
        />
      )}
      {isWebPage && periodControl && (
        <View
          style={{
            borderLeftWidth: 1,
            borderColor: theme.colors.border,
            paddingLeft: theme.spacing.lg,
          }}
        >
          {periodControl}
        </View>
      )}
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  containerMobile: {
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  titleMobile: {
    fontSize: theme.fontSize.sm,
  },
}));
