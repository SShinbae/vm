import { baseColors, withOpacity, spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { VehicleGroupSelector } from "@/components/VehicleGroupSelector";
import { formatDate } from "@/lib/utils/dateUtils";
import { VehicleWithDetails } from "@/types/database-v2";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface VehicleDetailProps {
  vehicle: VehicleWithDetails;
  onVehicleUpdate: () => void;
}

export const VehicleDetail: React.FC<VehicleDetailProps> = ({
  vehicle,
  onVehicleUpdate,
}) => {
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { theme } = useStyles();
  const colors = theme.colors;
  const isWeb = Platform.OS === "web";

  const handleSharingUpdate = (success: boolean) => {
    setShowSharingModal(false);
    if (success) {
      onVehicleUpdate();
    }
  };

  const styles = StyleSheet.create({
    container: {
      padding: isWeb ? 32 : 20,
      maxWidth: isWeb ? 1200 : undefined,
      alignSelf: "center",
      width: "100%",
    },
    contentWrapper: {
      flexDirection: isWeb ? "row" : "column",
      gap: isWeb ? 32 : 0,
      alignItems: "flex-start",
    },
    leftColumn: {
      width: isWeb ? "35%" : "100%",
      minWidth: isWeb ? 300 : undefined,
    },
    rightColumn: {
      flex: isWeb ? 1 : undefined,
      width: isWeb ? undefined : "100%",
    },
    header: {
      flexDirection: "column",
      alignItems: "center",
      marginBottom: isWeb ? 32 : 20,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.xl,
      ...(isWeb && {
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      }),
      borderWidth: 1,
      borderColor: colors.border,
    },
    vehicleIcon: {
      width: isWeb ? 120 : 60,
      height: isWeb ? 120 : 60,
      borderRadius: isWeb ? 60 : 30,
      backgroundColor: vehicle.is_own_vehicle
        ? colors.primary
        : theme.colors.success,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.lg,
      ...(isWeb && {
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      }),
    },
    statusBadge: {
      position: "absolute",
      top: 0,
      right: 0,
      backgroundColor: vehicle.is_own_vehicle ? colors.primary : colors.success,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    statusBadgeText: {
      color: "white",
      fontSize: 12,
      fontWeight: "600",
    },
    vehicleInfo: {
      alignItems: "center",
      width: "100%",
    },
    vehicleName: {
      fontSize: isWeb ? 28 : 24,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: spacing.sm,
      textAlign: "center",
    },
    vehiclePlate: {
      fontSize: isWeb ? 18 : 16,
      color: colors.textSecondary,
      fontWeight: "500",
      textAlign: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginBottom: spacing.sm,
    },
    ownerInfo: {
      fontSize: 14,
      color: colors.success,
      fontStyle: "italic",
      marginTop: spacing.xs,
      textAlign: "center",
    },
    statsContainer: {
      flexDirection: isWeb ? "row" : "column",
      flexWrap: "wrap",
      gap: spacing.lg,
      marginBottom: spacing.xl,
    },
    statCard: {
      flex: isWeb ? 1 : undefined,
      minWidth: isWeb ? 200 : undefined,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      ...(isWeb && {
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      }),
    },
    statValue: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
      marginTop: spacing.sm,
    },
    statLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: spacing.md,
    },
    sharingSection: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: withOpacity(colors.textSecondary, 0.12),
    },
    sharingStatus: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.md,
    },
    sharingText: {
      fontSize: 16,
      color: colors.text,
    },
    shareButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 6,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    shareButtonText: {
      color: "white",
      fontSize: 14,
      fontWeight: "600",
    },
    sharedGroupsList: {
      marginTop: spacing.sm,
    },
    sharedGroupItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.sm,
    },
    groupAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: withOpacity(colors.primary, 0.12),
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.sm,
    },
    groupAvatarImage: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    sharedGroupText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    emptySharing: {
      textAlign: "center",
      color: colors.textSecondary,
      fontSize: 14,
      fontStyle: "italic",
    },
    modal: {
      flex: 1,
      backgroundColor: isWeb
        ? withOpacity(baseColors.black, 0.6)
        : withOpacity(baseColors.black, 0.5),
      justifyContent: "center",
      alignItems: "center",
      ...(isWeb && {
        backdropFilter: "blur(4px)",
      }),
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 16,
      width: isWeb ? "90%" : "90%",
      maxWidth: isWeb ? 600 : undefined,
      maxHeight: "80%",
      ...(isWeb && {
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
      }),
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: withOpacity(colors.textSecondary, 0.12),
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    closeButton: {
      padding: spacing.sm,
    },
    detailsGrid: {
      flexDirection: isWeb ? "row" : "column",
      flexWrap: "wrap",
      gap: spacing.lg,
    },
    detailItem: {
      flex: isWeb ? 1 : undefined,
      minWidth: isWeb ? 280 : undefined,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...(isWeb && {
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        cursor: "pointer",
        transition: "all 0.2s ease",
      }),
    },
    detailItemHovered: {
      ...(isWeb && {
        shadowOpacity: 0.12,
        shadowRadius: 12,
        borderColor: colors.primary,
        transform: [{ translateY: -2 }],
      }),
    },
    detailIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: withOpacity(colors.primary, 0.08),
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.md,
    },
    detailContent: {
      flex: 1,
    },
    detailLabel: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    detailValue: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.contentWrapper}>
        {/* Left Column */}
        <View style={styles.leftColumn}>
          {/* Vehicle Header */}
          <View style={styles.header}>
            <View style={styles.statusBadge}>
              <IconSymbol
                name={vehicle.is_own_vehicle ? "car.fill" : "person.3.fill"}
                size={10}
                color="white"
              />
              <Text style={styles.statusBadgeText}>
                {vehicle.is_own_vehicle ? "Owned" : "Shared"}
              </Text>
            </View>

            {vehicle.main_image_url && !imageError ? (
              <Image
                source={{ uri: vehicle.main_image_url }}
                style={styles.vehicleIcon}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.vehicleIcon}>
                <IconSymbol
                  name={vehicle.is_own_vehicle ? "car.fill" : "person.3.fill"}
                  size={isWeb ? 50 : 30}
                  color="white"
                />
              </View>
            )}
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Text>
              <Text style={styles.vehiclePlate}>{vehicle.license_plate}</Text>
              {!vehicle.is_own_vehicle && vehicle.owner_profile && (
                <Text style={styles.ownerInfo}>
                  Shared by{" "}
                  {vehicle.owner_profile.full_name ||
                    vehicle.owner_profile.email}
                </Text>
              )}
            </View>
          </View>

          {/* Quick Stats */}
          {isWeb && (
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <IconSymbol
                  name="list.bullet.clipboard.fill"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.statValue}>
                  {vehicle.logs?.counts?.mileage_count || 0}
                </Text>
                <Text style={styles.statLabel}>Mileage Logs</Text>
              </View>
              <View style={styles.statCard}>
                <IconSymbol
                  name="fuelpump.fill"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.statValue}>
                  {vehicle.logs?.counts?.fuel_count || 0}
                </Text>
                <Text style={styles.statLabel}>Fuel Logs</Text>
              </View>
              <View style={styles.statCard}>
                <IconSymbol
                  name="wrench.and.screwdriver.fill"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.statValue}>
                  {vehicle.logs?.counts?.service_count || 0}
                </Text>
                <Text style={styles.statLabel}>Service Logs</Text>
              </View>
            </View>
          )}

          {/* Sharing Section - Only for owned vehicles */}
          {vehicle.is_own_vehicle && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vehicle Sharing</Text>
              <View style={styles.sharingSection}>
                <View style={styles.sharingStatus}>
                  <Text style={styles.sharingText}>
                    {vehicle.shared_groups?.length
                      ? `Shared with ${vehicle.shared_groups.length} group${
                          vehicle.shared_groups.length > 1 ? "s" : ""
                        }`
                      : "Not shared with any groups"}
                  </Text>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => setShowSharingModal(true)}
                  >
                    <IconSymbol name="person.3.fill" size={14} color="white" />
                    <Text style={styles.shareButtonText}>Manage</Text>
                  </TouchableOpacity>
                </View>

                {vehicle.shared_groups && vehicle.shared_groups.length > 0 ? (
                  <View style={styles.sharedGroupsList}>
                    {vehicle.shared_groups.map((group) => (
                      <View
                        key={(group as any).id}
                        style={styles.sharedGroupItem}
                      >
                        {(group as any).image_url ? (
                          <Image
                            source={{ uri: (group as any).image_url }}
                            style={styles.groupAvatarImage}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                            transition={200}
                          />
                        ) : (
                          <View style={styles.groupAvatar}>
                            <IconSymbol
                              name="person.3.fill"
                              size={16}
                              color={colors.primary}
                            />
                          </View>
                        )}
                        <Text style={styles.sharedGroupText}>{group.name}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptySharing}>
                    Share this vehicle with your groups to let members view and
                    log activities.
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Right Column */}
        <View style={styles.rightColumn}>
          {/* Vehicle Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle Details</Text>
            <View style={styles.detailsGrid}>
              <TouchableOpacity
                style={[
                  styles.detailItem,
                  hoveredItem === "mileage" && styles.detailItemHovered,
                ]}
                {...(isWeb
                  ? ({
                      onMouseEnter: () => setHoveredItem("mileage"),
                      onMouseLeave: () => setHoveredItem(null),
                    } as any)
                  : {})}
                activeOpacity={1}
              >
                <View style={styles.detailIcon}>
                  <IconSymbol
                    name="speedometer"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Current Mileage</Text>
                  <Text style={styles.detailValue}>
                    {(() => {
                      const currentMileage =
                        vehicle.current_mileage && vehicle.current_mileage > 0
                          ? vehicle.current_mileage
                          : vehicle.logs?.latest_mileage?.odometer_reading;
                      return currentMileage
                        ? `${currentMileage.toLocaleString()} km`
                        : "No data";
                    })()}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.detailItem,
                  hoveredItem === "fuel" && styles.detailItemHovered,
                ]}
                {...(isWeb
                  ? ({
                      onMouseEnter: () => setHoveredItem("fuel"),
                      onMouseLeave: () => setHoveredItem(null),
                    } as any)
                  : {})}
                activeOpacity={1}
              >
                <View style={styles.detailIcon}>
                  <IconSymbol
                    name="fuelpump.fill"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>
                    Fuel Records{" "}
                    {(() => {
                      if (
                        vehicle.logs?.counts?.access_status?.fuel_accessible ===
                        false
                      ) {
                        return vehicle.logs.counts.access_status
                          .has_permission_issues
                          ? "(Limited)"
                          : "(Error)";
                      }
                      return vehicle.logs?.counts?.fuel_count !== undefined
                        ? `(${vehicle.logs.counts.fuel_count})`
                        : "";
                    })()}
                  </Text>
                  <Text style={styles.detailValue}>
                    {vehicle.logs?.latest_fuel
                      ? `${
                          vehicle.logs.latest_fuel.liters_filled
                        }L on ${formatDate(vehicle.logs.latest_fuel.date)}`
                      : "No records"}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.detailItem,
                  hoveredItem === "service" && styles.detailItemHovered,
                ]}
                {...(isWeb
                  ? ({
                      onMouseEnter: () => setHoveredItem("service"),
                      onMouseLeave: () => setHoveredItem(null),
                    } as any)
                  : {})}
                activeOpacity={1}
              >
                <View style={styles.detailIcon}>
                  <IconSymbol
                    name="wrench.and.screwdriver.fill"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>
                    Service Records{" "}
                    {(() => {
                      if (
                        vehicle.logs?.counts?.access_status
                          ?.service_accessible === false
                      ) {
                        return vehicle.logs.counts.access_status
                          .has_permission_issues
                          ? "(Limited)"
                          : "(Error)";
                      }
                      return vehicle.logs?.counts?.service_count !== undefined
                        ? `(${vehicle.logs.counts.service_count})`
                        : "";
                    })()}
                  </Text>
                  <Text style={styles.detailValue}>
                    {vehicle.logs?.latest_service
                      ? `${
                          vehicle.logs.latest_service.service_type
                        } on ${formatDate(vehicle.logs.latest_service.date)}`
                      : "No records"}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.detailItem,
                  hoveredItem === "mileage-records" && styles.detailItemHovered,
                ]}
                {...(isWeb
                  ? ({
                      onMouseEnter: () => setHoveredItem("mileage-records"),
                      onMouseLeave: () => setHoveredItem(null),
                    } as any)
                  : {})}
                activeOpacity={1}
              >
                <View style={styles.detailIcon}>
                  <IconSymbol
                    name="list.bullet.clipboard.fill"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>
                    Mileage Records{" "}
                    {(() => {
                      if (
                        vehicle.logs?.counts?.access_status
                          ?.mileage_accessible === false
                      ) {
                        return vehicle.logs.counts.access_status
                          .has_permission_issues
                          ? "(Limited)"
                          : "(Error)";
                      }
                      return vehicle.logs?.counts?.mileage_count !== undefined
                        ? `(${vehicle.logs.counts.mileage_count})`
                        : "";
                    })()}
                  </Text>
                  <Text style={styles.detailValue}>
                    {vehicle.logs?.latest_mileage
                      ? `${vehicle.logs.latest_mileage.odometer_reading.toLocaleString()} km on ${formatDate(
                          vehicle.logs.latest_mileage.date,
                        )}`
                      : "No records"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Sharing Modal */}
      <Modal
        visible={showSharingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSharingModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Vehicle Sharing</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSharingModal(false)}
              >
                <IconSymbol
                  name="xmark"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <VehicleGroupSelector
              vehicleId={vehicle.id}
              currentSharedGroups={vehicle.shared_groups || []}
              onSharingUpdate={handleSharingUpdate}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};
