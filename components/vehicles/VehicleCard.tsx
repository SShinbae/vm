import React, { useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { VehicleWithDetails } from "@/types/database-v2";

interface VehicleCardProps {
  vehicle: VehicleWithDetails;
  onPress: (vehicle: VehicleWithDetails) => void;
}

/**
 * VehicleCard Component
 * Displays vehicle information with image, badges, and metadata
 * Isolated component for better performance and reusability
 * Supports memoization for large lists
 */
export const VehicleCard = React.memo(
  ({ vehicle, onPress }: VehicleCardProps) => {
    const { styles, theme } = useStyles(stylesheet);
    const [imageError, setImageError] = useState(false);
    const scaleAnim = useState(new Animated.Value(1))[0];

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    };

    const isValidImageUrl = (url: string | null) => {
      if (!url) return false;
      if (url.startsWith("file://")) return false;
      if (url.includes("undefined") || url.includes("null")) return false;
      return true;
    };

    const imageUrl =
      vehicle.main_image_url && isValidImageUrl(vehicle.main_image_url)
        ? vehicle.main_image_url
        : null;

    // Get service status
    const getServiceStatus = () => {
      const latestService = vehicle.logs?.latest_service;
      if (!latestService?.next_service_due) return null;

      const dueDate = new Date(latestService.next_service_due);
      const now = new Date();
      const diffDays = Math.floor(
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays < 0) return { label: "Overdue", color: theme.colors.error };
      if (diffDays <= 30)
        return { label: "Due Soon", color: theme.colors.warning };
      return { label: "Up to Date", color: theme.colors.success };
    };

    const serviceStatus = getServiceStatus();

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          style={styles.vehicleCard}
          onPress={() => onPress(vehicle)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {/* Hero Image */}
          <View style={styles.vehicleImageContainer}>
            {imageUrl && !imageError ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.vehicleHeroImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.vehiclePlaceholder}>
                <IconSymbol
                  name="car.fill"
                  size={40}
                  color={theme.colors.primary}
                />
              </View>
            )}

            {/* Service Status Badge */}
            {serviceStatus && (
              <View
                style={[
                  styles.serviceBadge,
                  { backgroundColor: serviceStatus.color },
                ]}
              >
                <Text style={styles.serviceBadgeText}>
                  {serviceStatus.label}
                </Text>
              </View>
            )}

            {/* Sharing Badge */}
            {(!vehicle.is_own_vehicle ||
              (vehicle.sharing_info?.is_shared &&
                vehicle.sharing_info.total_shares > 0)) && (
              <View style={styles.sharingBadge}>
                <IconSymbol
                  name="person.2.fill"
                  size={12}
                  color={theme.colors.white}
                />
                <Text style={styles.sharingBadgeText}>
                  {vehicle.sharing_info?.total_shares || "Shared"}
                </Text>
              </View>
            )}
          </View>

          {/* Vehicle Info */}
          <View style={styles.vehicleCardContent}>
            <Text style={styles.vehicleName} numberOfLines={1}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </Text>
            <Text style={styles.vehiclePlate}>{vehicle.license_plate}</Text>

            {/* Mileage and Color */}
            <View style={styles.vehicleMetaRow}>
              {vehicle.current_mileage && (
                <View style={styles.vehicleMeta}>
                  <IconSymbol
                    name="speedometer"
                    size={14}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={styles.vehicleMetaText}>
                    {vehicle.current_mileage.toLocaleString()} km
                  </Text>
                </View>
              )}
              {vehicle.color && (
                <View style={styles.vehicleMeta}>
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: vehicle.color },
                    ]}
                  />
                  <Text style={styles.vehicleMetaText}>{vehicle.color}</Text>
                </View>
              )}
            </View>

            {/* Owner Info for Shared Vehicles */}
            {!vehicle.is_own_vehicle && vehicle.owner_profile && (
              <View style={styles.ownerInfoContainer}>
                <IconSymbol
                  name="person.fill"
                  size={12}
                  color={theme.colors.primary}
                />
                <Text style={styles.ownerInfo}>
                  {vehicle.owner_profile.full_name ||
                    vehicle.owner_profile.email}
                </Text>
              </View>
            )}

            {/* Recent Activity Preview */}
            {(vehicle.logs?.latest_fuel || vehicle.logs?.latest_service) && (
              <View style={styles.recentActivityPreview}>
                {vehicle.logs.latest_fuel && (
                  <View style={styles.activityPreviewItem}>
                    <IconSymbol
                      name="fuelpump.fill"
                      size={12}
                      color={theme.colors.warning}
                    />
                    <Text style={styles.activityPreviewText}>
                      {new Date(
                        vehicle.logs.latest_fuel.date,
                      ).toLocaleDateString()}
                    </Text>
                  </View>
                )}
                {vehicle.logs.latest_service && (
                  <View style={styles.activityPreviewItem}>
                    <IconSymbol
                      name="wrench.fill"
                      size={12}
                      color={theme.colors.error}
                    />
                    <Text style={styles.activityPreviewText}>
                      {vehicle.logs.latest_service.service_type}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  },
);

VehicleCard.displayName = "VehicleCard";

const stylesheet = createStyleSheet((theme) => ({
  vehicleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  vehicleImageContainer: {
    position: "relative",
    width: "100%",
    height: 180,
  },
  vehicleHeroImage: {
    width: "100%",
    height: "100%",
  },
  vehiclePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: theme.colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  serviceBadge: {
    position: "absolute",
    top: theme.spacing.md,
    left: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  serviceBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  sharingBadge: {
    position: "absolute",
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  sharingBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  vehicleCardContent: {
    padding: theme.spacing.lg,
  },
  vehicleName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  vehiclePlate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  vehicleMetaRow: {
    flexDirection: "row",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  vehicleMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  vehicleMetaText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ownerInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  ownerInfo: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  recentActivityPreview: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  activityPreviewItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  activityPreviewText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
}));
