import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ServiceReceiptIndicator } from "@/components/ui/ReceiptViewer";
import { formatDate } from "@/lib/utils/dateUtils";
import { formatServiceItems } from "@/lib/utils/serviceUtils";
import type { FuelLog, MileageLog, ServiceLog } from "@/types";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { forwardRef, useCallback, useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

type LogType = "mileage" | "fuel" | "service";

interface LogDetailsBottomSheetProps {
  log: (FuelLog | MileageLog | ServiceLog) | null;
  logType: LogType | null;
  canModify: boolean;
  onClose: () => void;
  onEdit: (type: LogType, id: string) => void;
  onDelete: (type: LogType, id: string, description: string) => void;
}

/**
 * LogDetailsBottomSheet Component
 * Displays detailed log information in a bottom sheet modal
 * Supports Fuel, Mileage, and Service log types
 */
export const LogDetailsBottomSheet = forwardRef<
  BottomSheet,
  LogDetailsBottomSheetProps
>(({ log, logType, canModify, onClose, onEdit, onDelete }, ref) => {
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

  // Get vehicle data from the log (logs have vehicle data joined)
  const vehicle = log ? (log as any).vehicles : null;

  // Type-specific details
  const getLogDetails = () => {
    if (!log || !logType) {
      return {
        icon: "questionmark.circle",
        iconColor: theme.colors.textSecondary,
        title: "No log selected",
        details: [],
      };
    }

    switch (logType) {
      case "fuel": {
        const fuelLog = log as FuelLog;
        const costPerLiter =
          fuelLog.cost && fuelLog.liters_filled
            ? (fuelLog.cost / fuelLog.liters_filled).toFixed(2)
            : null;

        return {
          icon: "fuelpump",
          iconColor: theme.colors.primary,
          title: `${fuelLog.liters_filled?.toFixed(2) || 0}L - RM${fuelLog.cost?.toFixed(2) || 0}`,
          details: [
            {
              label: "Liters Filled",
              value: `${fuelLog.liters_filled?.toFixed(2) || 0} L`,
              icon: "fuelpump.fill",
            },
            {
              label: "Total Cost",
              value: `RM ${fuelLog.cost?.toFixed(2) || "0.00"}`,
              icon: "dollarsign.circle.fill",
            },
            ...(costPerLiter
              ? [
                  {
                    label: "Cost per Liter",
                    value: `RM ${costPerLiter}/L`,
                    icon: "chart.bar.fill",
                  },
                ]
              : []),
            ...(fuelLog.location
              ? [
                  {
                    label: "Location",
                    value: fuelLog.location,
                    icon: "location.fill",
                  },
                ]
              : []),
            {
              label: "Odometer",
              value: `${fuelLog.odometer_reading?.toLocaleString() || 0} km`,
              icon: "speedometer",
            },
            {
              label: "Date",
              value: formatDate(fuelLog.date),
              icon: "calendar",
            },
          ],
        };
      }
      case "mileage": {
        const mileageLog = log as MileageLog;
        return {
          icon: "speedometer",
          iconColor: theme.colors.primary,
          title: `${mileageLog.odometer_reading?.toLocaleString() || 0} km`,
          details: [
            {
              label: "Odometer Reading",
              value: `${mileageLog.odometer_reading?.toLocaleString() || 0} km`,
              icon: "speedometer",
            },
            ...(mileageLog.notes
              ? [
                  {
                    label: "Notes",
                    value: mileageLog.notes,
                    icon: "note.text",
                  },
                ]
              : []),
            {
              label: "Date",
              value: formatDate(mileageLog.date),
              icon: "calendar",
            },
          ],
        };
      }
      case "service": {
        const serviceLog = log as ServiceLog;
        const serviceItems = formatServiceItems(serviceLog.description);

        return {
          icon: "wrench.and.screwdriver.fill",
          iconColor: theme.colors.success,
          title: serviceLog.service_type || "Service",
          details: [
            {
              label: "Service Type",
              value: serviceLog.service_type || "General Service",
              icon: "wrench.fill",
            },
            ...(serviceItems
              ? [
                  {
                    label: "Description",
                    value: serviceItems,
                    icon: "list.bullet",
                  },
                ]
              : []),
            ...(serviceLog.cost
              ? [
                  {
                    label: "Cost",
                    value: `RM ${serviceLog.cost.toFixed(2)}`,
                    icon: "dollarsign.circle.fill",
                  },
                ]
              : []),
            {
              label: "Odometer",
              value: `${serviceLog.odometer_reading?.toLocaleString() || 0} km`,
              icon: "speedometer",
            },
            ...(serviceLog.next_service_due
              ? [
                  {
                    label: "Next Service Due",
                    value: formatDate(serviceLog.next_service_due),
                    icon: "clock.fill",
                  },
                ]
              : []),
            {
              label: "Date",
              value: formatDate(serviceLog.date),
              icon: "calendar",
            },
          ],
          hasReceipt: !!serviceLog.receipt_image_url,
          receiptUrl: serviceLog.receipt_image_url,
        };
      }
    }
  };

  const logDetails = getLogDetails();

  const handleEdit = () => {
    if (!log || !logType) return;
    onClose();
    onEdit(logType, log.id);
  };

  const handleDelete = () => {
    if (!log || !logType) return;
    onClose();
    onDelete(logType, log.id, logDetails.title);
  };

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.bottomSheetIndicator}
      onClose={onClose}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.bottomSheetContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.bottomSheetHeader}>
          <View style={styles.bottomSheetTitleContainer}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: logDetails.iconColor + "15" },
              ]}
            >
              <IconSymbol
                name={logDetails.icon as any}
                size={32}
                color={logDetails.iconColor}
              />
            </View>
            <View style={styles.titleTextContainer}>
              <Text style={styles.bottomSheetTitle}>{logDetails.title}</Text>
              <Text style={styles.bottomSheetSubtitle}>
                {logType
                  ? logType.charAt(0).toUpperCase() + logType.slice(1) + " Log"
                  : "Log Details"}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.bottomSheetCloseButton}
          >
            <IconSymbol name="xmark" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Service Receipt Indicator */}
        {logType === "service" && logDetails.hasReceipt && (
          <View style={styles.receiptBadgeContainer}>
            <ServiceReceiptIndicator
              hasReceipt={logDetails.hasReceipt}
              receiptUrl={logDetails.receiptUrl}
              onPress={() => {}}
              size={20}
            />
            <Text style={styles.receiptBadgeText}>Receipt Available</Text>
          </View>
        )}

        {/* Details Section */}
        <View style={styles.bottomSheetSection}>
          <Text style={styles.bottomSheetSectionTitle}>Details</Text>
          <View style={styles.detailsCard}>
            {logDetails.details.map((detail, index) => (
              <View key={index} style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <IconSymbol
                    name={detail.icon as any}
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>{detail.label}</Text>
                  <Text style={styles.detailValue}>{detail.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Vehicle Information Section */}
        {vehicle && (
          <View style={styles.bottomSheetSection}>
            <Text style={styles.bottomSheetSectionTitle}>Vehicle</Text>
            <TouchableOpacity
              style={styles.vehicleCard}
              onPress={() => {
                onClose();
                router.push(`/vehicles/${vehicle.id}` as any);
              }}
            >
              <View style={styles.vehicleCardContent}>
                {vehicle.main_image_url ? (
                  <Image
                    source={{ uri: vehicle.main_image_url }}
                    style={styles.vehicleImage}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <View style={styles.vehicleImagePlaceholder}>
                    <IconSymbol
                      name="car.fill"
                      size={24}
                      color={theme.colors.textSecondary}
                    />
                  </View>
                )}
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleName}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </Text>
                  <Text style={styles.vehiclePlate}>
                    {vehicle.license_plate}
                  </Text>
                  {(log as any).is_shared_vehicle && (
                    <View style={styles.sharedBadge}>
                      <IconSymbol
                        name="person.3.fill"
                        size={10}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.sharedBadgeText}>Shared Vehicle</Text>
                    </View>
                  )}
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Metadata Section */}
        {log && (
          <View style={styles.bottomSheetSection}>
            <Text style={styles.bottomSheetSectionTitle}>Metadata</Text>
            <View style={styles.metadataCard}>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Created</Text>
                <Text style={styles.metadataValue}>
                  {formatDate(log.created_at)}
                </Text>
              </View>
              <View style={styles.metadataDivider} />
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Log ID</Text>
                <Text style={[styles.metadataValue, styles.metadataIdText]}>
                  {log.id.substring(0, 8)}...
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <Button
            title="Edit Log"
            onPress={handleEdit}
            variant="primary"
            icon="pencil"
            iconPosition="left"
            style={styles.actionButton}
            disabled={!canModify}
            fullWidth
          />

          <Button
            title="Delete Log"
            onPress={handleDelete}
            variant="danger"
            icon="trash"
            iconPosition="left"
            style={styles.actionButton}
            disabled={!canModify}
            fullWidth
          />

          {!canModify && (
            <Text style={styles.permissionWarning}>
              You don&apos;t have permission to modify this log
            </Text>
          )}
        </View>

        {/* Bottom padding for safe area */}
        <View style={styles.bottomPadding} />
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

LogDetailsBottomSheet.displayName = "LogDetailsBottomSheet";

const stylesheet = createStyleSheet((theme) => ({
  bottomSheetBackground: {
    backgroundColor: theme.colors.background,
  },
  bottomSheetIndicator: {
    backgroundColor: theme.colors.border,
    width: 40,
    height: 4,
  },
  bottomSheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingTop: 8,
  },
  bottomSheetTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  titleTextContainer: {
    flex: 1,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  bottomSheetSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  bottomSheetCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  receiptBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.success + "10",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.success + "30",
  },
  receiptBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.success,
  },
  bottomSheetSection: {
    marginBottom: 24,
  },
  bottomSheetSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  detailsCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: "500",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  vehicleCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  vehicleCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  vehicleImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  vehicleImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  vehiclePlate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  sharedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  sharedBadgeText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metadataCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
  },
  metadataItem: {
    flex: 1,
  },
  metadataLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "500",
    marginBottom: 6,
  },
  metadataValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: "600",
  },
  metadataIdText: {
    fontFamily: "monospace",
    fontSize: 13,
  },
  metadataDivider: {
    width: 1,
    height: "100%",
    backgroundColor: theme.colors.border,
    marginHorizontal: 16,
  },
  actionButtonsContainer: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    width: "100%",
  },
  permissionWarning: {
    fontSize: 13,
    color: theme.colors.error,
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 4,
  },
  bottomPadding: {
    height: 20,
  },
}));
