import { goBack } from "@/lib/utils/goBack";
import { LogPageNavigation } from "@/components/logs/LogPageNavigation";
import { logPageStyles } from "@/components/logs/logPageStyles";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useLogRecord } from "@/hooks/useLogRecord";
import { Button } from "@/components/ui/Button";
import { withOpacity, spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ReceiptViewer } from "@/components/ui/ReceiptViewer";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { ServiceLogService } from "@/lib/services/loggingService";
import { OCRExtractedData, ServiceType } from "@/types";
import { useToast } from "@/hooks/useToast";
import { useDialog } from "@/lib/contexts/DialogContext";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  oil_change: "Oil Change",
  tire_rotation: "Tire Rotation",
  brake_service: "Brake Service",
  general_maintenance: "General Maintenance",
  repair: "Repair",
  inspection: "Inspection",
  other: "Other",
};

const SERVICE_TYPE_ICONS: Record<ServiceType, string> = {
  oil_change: "drop",
  tire_rotation: "circle",
  brake_service: "stop",
  general_maintenance: "wrench",
  repair: "hammer",
  inspection: "checkmark.shield",
  other: "ellipsis",
};

export default function ServiceLogDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const layout = useResponsiveLayout();
  const isDesktopWeb = layout.isWeb && !layout.isMobile;
  const { styles: logWeb } = useStyles(logPageStyles);
  const {
    record: serviceLog,
    loading,
    error: loadError,
    retry,
    canModify,
    canDelete,
  } = useLogRecord(id, "service", ServiceLogService.getServiceLogById);
  const [deleting, setDeleting] = useState(false);
  const { theme } = useStyles();
  const colors = theme.colors;
  const { showError, showSuccess, showWarning } = useToast();
  const { confirm } = useDialog();

  const handleEdit = () => {
    if (!canModify) return;
    router.push(`/logs/service/${id}/edit` as any);
  };

  const handleDelete = async () => {
    if (!canDelete || deleting) return;
    if (!id) {
      showError("Cannot delete: Invalid service log ID");
      return;
    }

    const performDelete = async () => {
      setDeleting(true);
      try {
        console.log("Attempting to delete service log with ID:", id);
        const result = await ServiceLogService.deleteServiceLog(id);
        console.log("Delete result:", result);

        if (result.error) {
          let errorMessage = result.error;
          // Handle specific error codes with user-friendly messages
          if (result.error === "PERMISSION_DENIED_SHARED_VEHICLE") {
            errorMessage =
              "This service log belongs to a shared vehicle. Only the vehicle owner can delete logs.";
          } else if (result.error === "PERMISSION_DENIED_ACCESS") {
            errorMessage =
              "You do not have permission to delete this service log.";
          } else if (result.error.includes("not found")) {
            errorMessage =
              "This service log no longer exists. It may have been deleted already.";
          }
          showError("Couldn't delete service log", { message: errorMessage });
        } else if (result.data === true) {
          showSuccess("Service log deleted");
          if (isDesktopWeb) router.replace("/logs");
          else goBack("/logs");
        } else {
          showWarning("Delete status unclear", {
            message:
              "Couldn't confirm the deletion. Check the service log list.",
          });
          if (isDesktopWeb) router.replace("/logs");
          else goBack("/logs");
        }
      } catch (error) {
        console.error("Error deleting service log:", error);
        showError("Failed to delete service log", {
          message: "Please check your connection and try again.",
        });
      } finally {
        setDeleting(false);
      }
    };

    const ok = await confirm({
      title: "Delete service log?",
      message:
        "Are you sure you want to delete this service log? This action cannot be undone.",
      confirmText: "Delete",
      destructive: true,
    });
    if (ok) performDelete();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-MY", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: "MYR",
    }).format(amount);
  };

  const parseServiceDescription = (description: string) => {
    try {
      const parsed = JSON.parse(description);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // If it's not valid JSON, return as is
    }
    return null;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: withOpacity(colors.textSecondary, 0.12),
    },
    backButton: {
      marginRight: spacing.lg,
      padding: spacing.xs,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      flex: 1,
    },
    actionsContainer: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    actionButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    deleteButton: {
      backgroundColor: theme.colors.error,
    },
    actionButtonText: {
      color: "white",
      fontSize: 14,
      fontWeight: "600",
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.xl,
    },
    card: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: spacing.xl,
      borderWidth: 1,
      borderColor: withOpacity(colors.textSecondary, 0.12),
      marginBottom: spacing.lg,
    },
    serviceTypeHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.lg,
      gap: spacing.md,
    },
    serviceTypeIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    serviceTypeInfo: {
      flex: 1,
    },
    serviceTypeTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      // textTransform removed
    },
    serviceTypeSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    vehicleInfo: {
      backgroundColor: withOpacity(colors.textSecondary, 0.06),
      borderRadius: 8,
      padding: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    vehicleIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    vehicleText: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
    },
    vehiclePlate: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    detailSection: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: spacing.md,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: withOpacity(colors.textSecondary, 0.06),
    },
    detailLabel: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    detailValue: {
      fontSize: 16,
      color: colors.text,
      fontWeight: "600",
      textAlign: "right",
      flex: 1,
      marginLeft: spacing.lg,
    },
    description: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
      backgroundColor: withOpacity(colors.textSecondary, 0.02),
      padding: spacing.lg,
      borderRadius: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    autoFillIndicator: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: withOpacity(theme.colors.success, 0.08),
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    autoFillText: {
      fontSize: 14,
      color: theme.colors.success,
      fontWeight: "500",
    },
    subHeader: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
      marginTop: -spacing.sm,
    },
    itemRow: {
      flexDirection: "row",
      marginBottom: spacing.sm,
      alignItems: "flex-start",
    },
    itemText: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
      lineHeight: 22,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: spacing.lg,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: withOpacity(colors.textSecondary, 0.12),
    },
    totalLabel: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    totalAmount: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
  });

  const pageNavigation = (
    <LogPageNavigation
      title="Service Details"
      vehicleId={serviceLog?.vehicle_id}
      vehicle={serviceLog?.vehicles}
      error={loadError}
      retry={retry}
    />
  );

  if (loadError)
    return (
      <SafeAreaView style={styles.container}>{pageNavigation}</SafeAreaView>
    );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {pageNavigation}
        {!isDesktopWeb && (
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => goBack("/logs")}
            >
              <IconSymbol name="chevron.left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Service Details</Text>
          </View>
        )}
        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.scrollContent,
            isDesktopWeb && logWeb.content,
          ]}
        >
          <SkeletonCard lines={6} style={{ marginBottom: spacing.lg }} />
          <SkeletonCard lines={4} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!serviceLog) {
    return (
      <SafeAreaView style={styles.container}>
        {pageNavigation}
        {!isDesktopWeb && (
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => goBack("/logs")}
            >
              <IconSymbol name="chevron.left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Service Details</Text>
          </View>
        )}
        <View style={styles.loadingContainer}>
          <Text style={[styles.detailLabel, { textAlign: "center" }]}>
            Service log not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const parsedItems = parseServiceDescription(serviceLog.description);

  return (
    <SafeAreaView style={styles.container}>
      {pageNavigation}
      {!isDesktopWeb && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => goBack("/logs")}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Service Details</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleEdit}
              disabled={!canModify || deleting}
            >
              <IconSymbol name="pencil" size={14} color="white" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
              disabled={!canDelete || deleting}
            >
              <IconSymbol name="trash" size={14} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      {isDesktopWeb && (
        <View
          style={{
            flexDirection: "row",
            gap: 12,
            justifyContent: "flex-end",
            paddingHorizontal: 24,
            paddingBottom: 16,
          }}
        >
          <Button
            title="Edit Service Log"
            onPress={handleEdit}
            disabled={!canModify || deleting}
          />
          <Button
            title="Delete"
            variant="outline"
            onPress={handleDelete}
            disabled={!canDelete || deleting}
            loading={deleting}
          />
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktopWeb && logWeb.content,
        ]}
      >
        <View style={[styles.card, isDesktopWeb && logWeb.panel]}>
          <View style={styles.serviceTypeHeader}>
            <View style={styles.serviceTypeIcon}>
              <IconSymbol
                name={
                  SERVICE_TYPE_ICONS[
                    serviceLog.service_type as ServiceType
                  ] as any
                }
                size={24}
                color="white"
              />
            </View>
            <View style={styles.serviceTypeInfo}>
              <Text style={styles.serviceTypeTitle}>
                {SERVICE_TYPE_LABELS[serviceLog.service_type as ServiceType]}
              </Text>
            </View>
          </View>

          {/* Odometer | Date */}
          <Text style={styles.subHeader}>
            Odometer : {serviceLog.odometer_reading?.toLocaleString()} km |{" "}
            {formatDate(serviceLog.date)}
          </Text>

          {(serviceLog as any).vehicles && (
            <View style={styles.vehicleInfo}>
              <View style={styles.vehicleIcon}>
                <IconSymbol name="car.fill" size={16} color="white" />
              </View>
              <View>
                <Text style={styles.vehicleText}>
                  {(serviceLog as any).vehicles.year}{" "}
                  {(serviceLog as any).vehicles.make}{" "}
                  {(serviceLog as any).vehicles.model}
                </Text>
                <Text style={styles.vehiclePlate}>
                  {(serviceLog as any).vehicles.license_plate}
                </Text>
              </View>
            </View>
          )}

          {serviceLog.auto_filled && (
            <View style={styles.autoFillIndicator}>
              <IconSymbol
                name="checkmark.circle.fill"
                size={16}
                color={theme.colors.success}
              />
              <Text style={styles.autoFillText}>
                Data auto-filled from receipt
              </Text>
            </View>
          )}

          {/* Service Items List */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Service Items</Text>

            {parsedItems ? (
              parsedItems.map((item: any, index: number) => (
                <View key={index} style={styles.itemRow}>
                  <Text style={styles.itemText}>
                    {index + 1}. {item.description} RM{item.price}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.description}>{serviceLog.description}</Text>
            )}

            {/* Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total :</Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(serviceLog.cost || 0)}
              </Text>
            </View>
          </View>

          {/* Extra details at the bottom if needed, e.g. next service due */}
          {serviceLog.next_service_due && (
            <View
              style={{
                marginTop: spacing.sm,
                paddingTop: spacing.lg,
                borderTopWidth: 1,
                borderTopColor: withOpacity(colors.textSecondary, 0.12),
              }}
            >
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Next Service Due</Text>
                <Text style={styles.detailValue}>
                  {formatDate(serviceLog.next_service_due)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {serviceLog.receipt_image_url && (
          <View style={[styles.card, isDesktopWeb && logWeb.panel]}>
            <ReceiptViewer
              receiptImageUrl={serviceLog.receipt_image_url}
              ocrData={
                serviceLog.ocr_extracted_data as OCRExtractedData | undefined
              }
              showOcrData={!!serviceLog.ocr_extracted_data}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
