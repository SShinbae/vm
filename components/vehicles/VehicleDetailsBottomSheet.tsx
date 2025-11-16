import React, { useCallback, useMemo, forwardRef } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { VehicleWithDetails } from "@/types/database-v2";

interface VehicleDetailsBottomSheetProps {
  vehicle: VehicleWithDetails | null;
  onClose: () => void;
}

/**
 * VehicleDetailsBottomSheet Component
 * Displays detailed vehicle information in a bottom sheet modal
 * Isolated component for better code organization and reusability
 */
export const VehicleDetailsBottomSheet = forwardRef<
  BottomSheet,
  VehicleDetailsBottomSheetProps
>(({ vehicle, onClose }, ref) => {
  const { styles, theme } = useStyles(stylesheet);
  const snapPoints = useMemo(() => ["50%", "90%"], []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  if (!vehicle) return null;

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.bottomSheetIndicator}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.bottomSheetContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.bottomSheetHeader}>
          <View style={styles.bottomSheetTitleContainer}>
            <Text style={styles.bottomSheetTitle}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </Text>
            <Text style={styles.bottomSheetSubtitle}>
              {vehicle.license_plate}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.bottomSheetCloseButton}
          >
            <IconSymbol name="xmark" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Vehicle Image */}
        {vehicle.main_image_url && (
          <View style={styles.bottomSheetImageContainer}>
            <Image
              source={{ uri: vehicle.main_image_url }}
              style={styles.bottomSheetImage}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          </View>
        )}

        {/* Details Section */}
        <View style={styles.bottomSheetSection}>
          <Text style={styles.bottomSheetSectionTitle}>Details</Text>
          <View style={styles.detailsGrid}>
            {vehicle.vin && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>VIN</Text>
                <Text style={styles.detailValue}>{vehicle.vin}</Text>
              </View>
            )}
            {vehicle.color && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Color</Text>
                <View style={styles.detailValueWithColor}>
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: vehicle.color },
                    ]}
                  />
                  <Text style={styles.detailValue}>{vehicle.color}</Text>
                </View>
              </View>
            )}
            {vehicle.current_mileage && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Mileage</Text>
                <Text style={styles.detailValue}>
                  {vehicle.current_mileage.toLocaleString()} km
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Recent Activity Timeline */}
        {(vehicle.logs?.latest_fuel ||
          vehicle.logs?.latest_service ||
          vehicle.logs?.latest_mileage) && (
          <View style={styles.bottomSheetSection}>
            <Text style={styles.bottomSheetSectionTitle}>Recent Activity</Text>
            <View style={styles.timelineContainer}>
              {vehicle.logs.latest_fuel && (
                <View style={styles.timelineItem}>
                  <View
                    style={[
                      styles.timelineIcon,
                      { backgroundColor: theme.colors.warning + "15" },
                    ]}
                  >
                    <IconSymbol
                      name="fuelpump.fill"
                      size={16}
                      color={theme.colors.warning}
                    />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Fuel Log</Text>
                    <Text style={styles.timelineDescription}>
                      {vehicle.logs.latest_fuel.liters_filled}L • RM
                      {vehicle.logs.latest_fuel.cost?.toFixed(2)}
                    </Text>
                    <Text style={styles.timelineDate}>
                      {new Date(
                        vehicle.logs.latest_fuel.date,
                      ).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              )}
              {vehicle.logs.latest_service && (
                <View style={styles.timelineItem}>
                  <View
                    style={[
                      styles.timelineIcon,
                      { backgroundColor: theme.colors.error + "15" },
                    ]}
                  >
                    <IconSymbol
                      name="wrench.fill"
                      size={16}
                      color={theme.colors.error}
                    />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Service Log</Text>
                    <Text style={styles.timelineDescription}>
                      {vehicle.logs.latest_service.service_type} • RM
                      {vehicle.logs.latest_service.cost?.toFixed(2)}
                    </Text>
                    <Text style={styles.timelineDate}>
                      {new Date(
                        vehicle.logs.latest_service.date,
                      ).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              )}
              {vehicle.logs.latest_mileage && (
                <View style={styles.timelineItem}>
                  <View
                    style={[
                      styles.timelineIcon,
                      { backgroundColor: theme.colors.primary + "15" },
                    ]}
                  >
                    <IconSymbol
                      name="speedometer"
                      size={16}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Mileage Log</Text>
                    <Text style={styles.timelineDescription}>
                      {vehicle.logs.latest_mileage.odometer_reading.toLocaleString()}{" "}
                      km
                    </Text>
                    <Text style={styles.timelineDate}>
                      {new Date(
                        vehicle.logs.latest_mileage.date,
                      ).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Owner Info for Shared Vehicles */}
        {!vehicle.is_own_vehicle && vehicle.owner_profile && (
          <View style={styles.bottomSheetSection}>
            <Text style={styles.bottomSheetSectionTitle}>
              Owner Information
            </Text>
            <View style={styles.ownerCard}>
              <View style={styles.ownerAvatar}>
                <IconSymbol
                  name="person.fill"
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.ownerDetails}>
                <Text style={styles.ownerName}>
                  {vehicle.owner_profile.full_name ||
                    vehicle.owner_profile.email}
                </Text>
                <Text style={styles.ownerEmail}>
                  {vehicle.owner_profile.email}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.bottomSheetActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={() => {
              onClose();
              router.push(`/vehicles/${vehicle.id}` as any);
            }}
          >
            <IconSymbol name="pencil" size={18} color={theme.colors.white} />
            <Text style={styles.actionButtonTextPrimary}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => {
              onClose();
              // Add share functionality
            }}
          >
            <IconSymbol
              name="square.and.arrow.up"
              size={18}
              color={theme.colors.primary}
            />
            <Text style={styles.actionButtonTextSecondary}>Share</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

VehicleDetailsBottomSheet.displayName = "VehicleDetailsBottomSheet";

const stylesheet = createStyleSheet((theme) => ({
  bottomSheetBackground: {
    backgroundColor: theme.colors.background,
  },
  bottomSheetIndicator: {
    backgroundColor: theme.colors.border,
    width: 40,
  },
  bottomSheetContent: {
    paddingBottom: theme.spacing.xxxl,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  bottomSheetTitleContainer: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  bottomSheetTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  bottomSheetSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  bottomSheetCloseButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSheetImageContainer: {
    width: "100%",
    height: 200,
    marginBottom: theme.spacing.lg,
  },
  bottomSheetImage: {
    width: "100%",
    height: "100%",
  },
  bottomSheetSection: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  bottomSheetSectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  detailsGrid: {
    gap: theme.spacing.md,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
  },
  detailLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  detailValue: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  detailValueWithColor: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  timelineContainer: {
    gap: theme.spacing.lg,
  },
  timelineItem: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  timelineDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  timelineDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  ownerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  ownerAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  ownerDetails: {
    flex: 1,
  },
  ownerName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  ownerEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  bottomSheetActions: {
    flexDirection: "row",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  actionButtonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  actionButtonSecondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionButtonTextPrimary: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  actionButtonTextSecondary: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
}));
