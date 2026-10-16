import { withOpacity } from "@/src/design-system";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { storageImageUrl } from "@/lib/utils/storagePath";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { webPageStyles } from "@/components/layout/webPageStyles";
import React, { useEffect, useState } from "react";
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
    const { styles: web } = useStyles(webPageStyles);
    const layout = useResponsiveLayout();
    const isCompact = !layout.isWeb || layout.isMobile;
    const vehicleName = [vehicle.year, vehicle.make, vehicle.model]
      .filter(Boolean)
      .join(" ");
    const status = !vehicle.is_own_vehicle
      ? "Shared with me"
      : vehicle.sharing_info?.is_shared || vehicle.shared_groups?.length
        ? "Shared"
        : "Owned";
    const [imageError, setImageError] = useState(false);
    const scaleAnim = useState(new Animated.Value(1))[0];
    const reduceMotion = useReducedMotion();

    const handlePressIn = () => {
      if (reduceMotion) return;
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: !layout.isWeb,
      }).start();
    };

    const handlePressOut = () => {
      if (reduceMotion) return;
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: !layout.isWeb,
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
        ? storageImageUrl("vehicle-images", vehicle.main_image_url)
        : null;

    useEffect(() => setImageError(false), [imageUrl]);

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          style={[
            styles.vehicleCard,
            isCompact && { padding: 16, gap: 12 },
            layout.isWeb && !layout.isMobile && web.panel,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`View details for ${vehicleName}`}
          onPress={() => onPress(vehicle)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {/* Left: Image/Icon */}
          <View
            style={[
              styles.vehicleImageContainer,
              isCompact && { width: 60, height: 60 },
            ]}
          >
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
                  size={32}
                  color={theme.colors.primary}
                />
              </View>
            )}
          </View>

          {/* Right: Vehicle Info */}
          <View style={[styles.vehicleCardContent, { minWidth: 0 }]}>
            <Text
              style={styles.vehicleName}
              numberOfLines={isCompact ? undefined : 1}
            >
              {vehicleName}
            </Text>
            <Text
              style={styles.vehiclePlate}
              numberOfLines={isCompact ? undefined : 1}
            >
              {vehicle.license_plate || "N/A"}
            </Text>
            <Text
              style={styles.vehicleMileage}
              numberOfLines={isCompact ? undefined : 1}
            >
              {vehicle.current_mileage
                ? `${vehicle.current_mileage.toLocaleString()} km`
                : "0 km"}
            </Text>
            {isCompact && (
              <View
                style={{
                  alignSelf: "flex-start",
                  maxWidth: "100%",
                  borderRadius: theme.borderRadius.sm,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  backgroundColor: withOpacity(theme.colors.primary, 0.08),
                }}
              >
                <Text
                  style={{
                    color: theme.colors.primary,
                    fontSize: theme.fontSize.xs,
                    flexShrink: 1,
                  }}
                >
                  {status}
                </Text>
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
    borderRadius: {
      xs: theme.borderRadius.lg,
      sm: theme.borderRadius.xl,
    },
    flexDirection: "row",
    alignItems: "center",
    padding: {
      xs: theme.spacing.md,
      sm: theme.spacing.lg,
    },
    gap: {
      xs: theme.spacing.md,
      sm: theme.spacing.lg,
    },
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  vehicleImageContainer: {
    width: {
      xs: 80,
      sm: 100,
    },
    height: {
      xs: 80,
      sm: 100,
    },
    borderRadius: {
      xs: theme.borderRadius.md,
      sm: theme.borderRadius.lg,
    },
    overflow: "hidden",
  },
  vehicleHeroImage: {
    width: "100%",
    height: "100%",
  },
  vehiclePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: withOpacity(theme.colors.primary, 0.08),
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleCardContent: {
    flex: 1,
    justifyContent: "center",
    gap: {
      xs: theme.spacing.xs,
      sm: theme.spacing.sm,
    },
  },
  vehicleName: {
    fontSize: {
      xs: theme.fontSize.base,
      sm: theme.fontSize.lg,
    },
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  vehiclePlate: {
    fontSize: {
      xs: theme.fontSize.sm,
      sm: theme.fontSize.base,
    },
    color: theme.colors.textSecondary,
  },
  vehicleMileage: {
    fontSize: {
      xs: theme.fontSize.sm,
      sm: theme.fontSize.base,
    },
    color: theme.colors.textSecondary,
  },
}));
