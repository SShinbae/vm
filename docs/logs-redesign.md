<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# import { IconSymbol } from "@/components/ui/icon-symbol";

import { AlertModal, ConfirmModal } from "@/components/ui/Modal";
import { ServiceReceiptIndicator } from "@/components/ui/ReceiptViewer";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  FuelLogService,
  MileageLogService,
  ServiceLogService,
} from "@/lib/services/loggingService";
import { formatDate } from "@/lib/utils/dateUtils";
import { isFulfilled, safePromiseAll } from "@/lib/utils/networkUtils";
import {
  canUserAccessVehicle,
  formatServiceItems,
} from "@/lib/utils/serviceUtils";
import { supabase } from "@/services/supabaseClient";
import { FuelLog, MileageLog, ServiceLog } from "@/types";
import { VehicleWithDetails } from "@/types/database-v2";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type CombinedLog = (MileageLog | FuelLog | ServiceLog) \& {
  vehicles?: VehicleWithDetails;
};

type LogType = "mileage" | "fuel" | "service";

export default function LogsScreen() {
  const [activeTab, setActiveTab] = useState<LogType>("mileage");
  const [mileageLogs, setMileageLogs] = useState<MileageLog[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

// Modal states
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<{
    type: LogType;
    id: string;
    description: string;
  } | null>(null);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertVariant, setAlertVariant] = useState<
    "info" | "success" | "warning" | "error"
  >("info");

const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

// Helper function to check if user can modify a log
  const canUserModifyLog = async (log: any): Promise<boolean> => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) return false;

// Use the standardized permission function
      return await canUserAccessVehicle(log.vehicle_id, user.id);
    } catch (error) {
      console.error("Error checking modify permission:", error);
      return false;
    }
  };

const fetchAllLogs = useCallback(async () => {
    try {
      // Use network utility for safe promise handling with timeout protection
      const results = await safePromiseAll(
        [
          MileageLogService.getMileageLogs(),
          FuelLogService.getFuelLogs() as any,
          ServiceLogService.getServiceLogs() as any,
        ],
        8000,
      );

// Process results individually using utility type guards
      const [mileageResult, fuelResult, serviceResult] = results;

if (
        isFulfilled(mileageResult) \&\&
        (mileageResult.value as { data: MileageLog[] }).data
      ) {
        setMileageLogs((mileageResult.value as { data: MileageLog[] }).data);
      } else {
        console.warn(
          "Failed to fetch mileage logs:",
          mileageResult.status === "rejected"
            ? mileageResult.reason
            : "No data",
        );
        setMileageLogs([]);
      }

if (
        isFulfilled(fuelResult) \&\&
        (fuelResult.value as { data: FuelLog[] }).data
      ) {
        setFuelLogs((fuelResult.value as { data: FuelLog[] }).data);
      } else {
        console.warn(
          "Failed to fetch fuel logs:",
          fuelResult.status === "rejected" ? fuelResult.reason : "No data",
        );
        setFuelLogs([]);
      }

if (
        isFulfilled(serviceResult) \&\&
        (serviceResult.value as { data: ServiceLog[] }).data
      ) {
        setServiceLogs((serviceResult.value as { data: ServiceLog[] }).data);
      } else {
        console.warn(
          "Failed to fetch service logs:",
          serviceResult.status === "rejected"
            ? serviceResult.reason
            : "No data",
        );
        setServiceLogs([]);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      // Set empty arrays on error to prevent infinite loading
      setMileageLogs([]);
      setFuelLogs([]);
      setServiceLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllLogs();
    setRefreshing(false);
  }, [fetchAllLogs]);

const handleDeleteLog = (type: LogType, id: string, description: string) => {
    setSelectedLog({ type, id, description });
    setDeleteModalVisible(true);
  };

const handleConfirmDelete = async () => {
    if (!selectedLog) return;

setDeleteLoading(true);

let result;
    switch (selectedLog.type) {
      case "mileage":
        result = await MileageLogService.deleteMileageLog(selectedLog.id);
        break;
      case "fuel":
        result = await FuelLogService.deleteFuelLog(selectedLog.id);
        break;
      case "service":
        result = await ServiceLogService.deleteServiceLog(selectedLog.id);
        break;
    }

setDeleteLoading(false);
    setDeleteModalVisible(false);

if (result?.error) {
      console.error(`Error deleting ${selectedLog.type} log:`, result.error);

// Provide more specific error messages based on the error content
      let errorMessage = result.error;
      if (
        result.error.includes("not found") ||
        result.error.includes("Log not found")
      ) {
        errorMessage = `This ${selectedLog.type} log no longer exists. It may have been deleted by another user.`;
      } else if (result.error === "PERMISSION_DENIED_SHARED_VEHICLE") {
        errorMessage = `This ${selectedLog.type} log belongs to a shared vehicle. You can view it but cannot modify or delete it.`;
      } else if (result.error === "PERMISSION_DENIED_ACCESS") {
        errorMessage = `You do not have permission to delete this ${selectedLog.type} log.`;
      } else if (
        result.error.includes("Access denied") ||
        result.error.includes("not authenticated")
      ) {
        errorMessage = `You do not have permission to delete this ${selectedLog.type} log.`;
      } else if (result.error.includes("Failed to delete")) {
        errorMessage = `Unable to delete ${selectedLog.type} log. Please check your internet connection and try again.`;
      }

showAlert("Error", errorMessage, "error");

// Refresh the logs to ensure UI is in sync with actual state
      await fetchAllLogs();
    } else if (result?.data === true) {
      // Only show success if the deletion actually succeeded
      await fetchAllLogs();
      showAlert(
        "Success",
        `${selectedLog.type} log deleted successfully`,
        "success",
      );
    } else {
      // Handle unexpected response (not error, but not successful either)
      console.warn(
        `Unexpected response when deleting ${selectedLog.type} log:`,
        result,
      );
      showAlert(
        "Warning",
        `${selectedLog.type} log deletion status unclear. Please refresh to see current state.`,
        "warning",
      );
      await fetchAllLogs();
    }

setSelectedLog(null);
  };

const showAlert = (
    title: string,
    message: string,
    variant: "info" | "success" | "warning" | "error" = "info",
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVariant(variant);
    setAlertModalVisible(true);
  };

const handleViewServiceDetail = (serviceId: string) => {
    router.push(`/logs/service/${serviceId}` as any);
  };

const handleEditLog = (type: LogType, id: string) => {
    switch (type) {
      case "mileage":
        router.push(`/logs/mileage/${id}/edit` as any);
        break;
      case "fuel":
        router.push(`/logs/fuel/${id}/edit` as any);
        break;
      case "service":
        router.push(`/logs/service/${id}/edit` as any);
        break;
    }
  };

useFocusEffect(
    useCallback(() => {
      fetchAllLogs();
    }, [fetchAllLogs]),
  );

const TabButton = ({
    type,
    label,
    icon,
  }: {
    type: LogType;
    label: string;
    icon: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === type \&\& {
          backgroundColor: colors.tint,
          borderColor: colors.tint,
        },
      ]}
      onPress={() => setActiveTab(type)}
    >
      <IconSymbol
        name={icon as any}
        size={20}
        color={activeTab === type ? "white" : colors.icon}
      />
      <Text
        style={[
          styles.tabButtonText,
          { color: activeTab === type ? "white" : colors.icon },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

const VehicleHeader = ({
    vehicle,
    isSharedVehicle,
  }: {
    vehicle: any;
    isSharedVehicle: boolean;
  }) => {
    const [imageError, setImageError] = useState(false);

return (
      <View style={styles.vehicleHeader}>
        {vehicle?.main_image_url \&\& !imageError ? (
          <Image
            source={{ uri: vehicle.main_image_url }}
            style={[
              styles.vehicleHeaderImage,
              isSharedVehicle \&\& styles.sharedVehicleHeaderImage,
            ]}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
            onError={(error) => {
              console.error(
                "Logs - Image load error for vehicle:",
                vehicle?.id,
                error,
              );
              console.log("Logs - Failed URL:", vehicle?.main_image_url);
              setImageError(true);
            }}
            onLoad={() => {
              console.log(
                "Logs - Image loaded successfully for vehicle:",
                vehicle?.id,
              );
            }}
          />
        ) : (
          <View
            style={[
              styles.vehicleHeaderIcon,
              isSharedVehicle \&\& styles.sharedVehicleHeaderIcon,
            ]}
          >
            <IconSymbol
              name={isSharedVehicle ? "person.2.fill" : "car.fill"}
              size={20}
              color="white"
            />
          </View>
        )}
        <View style={styles.vehicleHeaderInfo}>
          <View style={styles.vehicleHeaderTitleRow}>
            <Text style={styles.vehicleHeaderTitle}>
              {vehicle?.year} {vehicle?.make} {vehicle?.model}
            </Text>
            {isSharedVehicle \&\& (
              <View style={styles.sharedVehicleBadge}>
                <IconSymbol
                  name="person.2.fill"
                  size={12}
                  color={colors.tint}
                />
                <Text style={styles.sharedVehicleBadgeText}>Shared</Text>
              </View>
            )}
          </View>
          {vehicle?.license_plate \&\& (
            <Text style={styles.vehicleHeaderPlate}>
              {vehicle.license_plate}
            </Text>
          )}
        </View>
      </View>
    );
  };

const LogCard = ({ log, type }: { log: any; type: LogType }) => {
    const [canModify, setCanModify] = useState<boolean | null>(null);

// Check modification permissions when component mounts
    useEffect(() => {
      const checkPermissions = async () => {
        const hasPermission = await canUserModifyLog(log);
        setCanModify(hasPermission);
      };
      checkPermissions();
    }, [log]);
    const getLogDetails = () => {
      switch (type) {
        case "mileage":
          return {
            title: `${log.odometer_reading?.toLocaleString()} km`,
            subtitle: log.notes || "Mileage reading",
            icon: "speedometer",
            color: "\#2196F3",
          };
        case "fuel":
          return {
            title: `${log.cost ? `RM${log.cost}` : ""} `,
            subtitle: `${log.liters_filled} L`,             odometer: log.odometer_reading               ? `${log.odometer_reading.toLocaleString()} km`
              : null,
            icon: "fuelpump",
            color: "#4CAF50",
          };
        case "service":
          return {
            title: log.service_type?.replace("_", " ").toUpperCase(),
            subtitle: `${formatServiceItems(log.description)}${log.cost ? ` • RM${log.cost}` : ""}`,
            icon: "wrench",
            color: "\#FF9800",
            hasReceipt: !!log.receipt_image_url,
            receiptUrl: log.receipt_image_url,
          };
        default:
          return { title: "", subtitle: "", icon: "doc", color: colors.tint };
      }
    };

const details = getLogDetails();
    const isSharedVehicle = log.is_shared_vehicle || false;

const handleCardPress = () => {
      if (type === "service") {
        handleViewServiceDetail(log.id);
      } else {
        handleEditLog(type, log.id);
      }
    };

return (
      <TouchableOpacity
        style={[styles.logCard, isSharedVehicle \&\& styles.sharedLogCard]}
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        <View style={styles.logHeader}>
          <View
            style={[styles.logIcon, { backgroundColor: details.color + "20" }]}
          >
            <IconSymbol
              name={details.icon as any}
              size={20}
              color={details.color}
            />
          </View>
          <View style={styles.logInfo}>
            <View style={styles.logTitleRow}>
              <Text style={styles.logTitle}>{details.title}</Text>
              {type === "service" \&\& details.hasReceipt \&\& (
                <ServiceReceiptIndicator
                  hasReceipt={details.hasReceipt}
                  receiptUrl={details.receiptUrl}
                  onPress={() => handleViewServiceDetail(log.id)}
                  size={18}
                />
              )}
            </View>
            {/* <Text style={styles.logSubtitle}>{details.subtitle}</Text> */}
            <Text style={styles.logSubtitle}>{details.subtitle}</Text>
            {details.odometer \&\& (
              <Text style={styles.logOdometer}>{details.odometer}</Text>
            )}
            <Text style={styles.logDate}>{formatDate(log.date)}</Text>
          </View>
          <View style={styles.actionButtons}>
            {canModify === null ? (
              // Loading state - show placeholder
              <View style={styles.actionLoading}>
                <ActivityIndicator size="small" color={colors.icon} />
              </View>
            ) : canModify ? (
              // User can modify - show edit and delete buttons
              <>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEditLog(type, log.id);
                  }}
                >
                  <IconSymbol name="pencil" size={18} color={colors.tint} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteLog(type, log.id, details.title);
                  }}
                >
                  <IconSymbol name="trash" size={18} color="#ff4444" />
                </TouchableOpacity>
              </>
            ) : (
              // Read-only log - show indicator
              <View style={styles.readOnlyIndicator}>
                <IconSymbol name="eye" size={18} color={colors.icon} />
                <Text style={styles.readOnlyText}>View Only</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

const getCurrentLogs = () => {
    switch (activeTab) {
      case "mileage":
        return mileageLogs;
      case "fuel":
        return fuelLogs;
      case "service":
        return serviceLogs;
      default:
        return [];
    }
  };

const getGroupedLogsByVehicle = () => {
    const logs = getCurrentLogs();
    const grouped: { [vehicleId: string]: { vehicle: any; logs: any[] } } = {};

logs.forEach((log) => {
      const vehicleId = log.vehicle_id;
      const vehicle = (log as any).vehicles;

if (!grouped[vehicleId]) {
        grouped[vehicleId] = {
          vehicle,
          logs: [],
        };
      }

grouped[vehicleId].logs.push(log);
    });

// Sort logs within each vehicle group by date (newest first)
    Object.values(grouped).forEach((group) => {
      group.logs.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    });

return grouped;
  };

const getAddRoute = () => {
    switch (activeTab) {
      case "mileage":
        return "/logs/mileage/add";
      case "fuel":
        return "/logs/fuel/add";
      case "service":
        return "/logs/service/add";
      default:
        return "/logs/mileage/add";
    }
  };

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.icon + "20",
    },
    title: {
      fontSize: 32,
      fontWeight: "bold",
      color: colors.text,
    },
    addButton: {
      backgroundColor: colors.tint,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    addButtonText: {
      color: "white",
      fontSize: 14,
      fontWeight: "600",
    },
    tabs: {
      flexDirection: "row",
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 8,
    },
    tabButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.icon + "30",
      backgroundColor: colors.background,
      gap: 8,
    },
    tabButtonText: {
      fontSize: 14,
      fontWeight: "500",
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 60,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.icon + "20",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 14,
      color: colors.icon,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 20,
    },
    emptyButton: {
      backgroundColor: colors.tint,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    emptyButtonText: {
      color: "white",
      fontSize: 14,
      fontWeight: "600",
    },
    logCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.icon + "20",
      elevation: 2,
      shadowColor: "\#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    sharedLogCard: {
      borderColor: colors.tint + "40",
      backgroundColor: colors.tint + "05",
    },
    logHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    logIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    logInfo: {
      flex: 1,
    },
    logTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    logTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      flex: 1,
    },
    sharedBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.tint + "15",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      gap: 4,
    },
    sharedBadgeText: {
      fontSize: 10,
      fontWeight: "500",
      color: colors.tint,
    },
    logSubtitle: {
      fontSize: 14,
      color: colors.icon,
      marginBottom: 4,
    },
    logOdometer: {
      fontSize: 13,
      color: colors.icon + "80",
      marginBottom: 4,
    },
    logDate: {
      fontSize: 12,
      // color: colors.icon,
      color: colors.icon + "80",
    },
    ownedByText: {
      fontSize: 11,
      color: colors.tint,
      fontStyle: "italic",
    },
    actionButtons: {
      flexDirection: "column",
      gap: 8,
    },
    editButton: {
      padding: 8,
    },
    deleteButton: {
      padding: 8,
    },
    actionLoading: {
      padding: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    readOnlyIndicator: {
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 4,
      opacity: 0.6,
    },
    readOnlyText: {
      fontSize: 10,
      color: colors.icon,
      marginTop: 2,
      textAlign: "center",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    vehicleHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.icon + "10",
      marginTop: 12,
    },
    vehicleHeaderIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.tint,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    vehicleHeaderImage: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 12,
      backgroundColor: colors.icon + "20",
      overflow: "hidden",
    },
    sharedVehicleHeaderIcon: {
      backgroundColor: "\#4CAF50",
    },
    sharedVehicleHeaderImage: {
      borderWidth: 2,
      borderColor: "\#4CAF50",
    },
    vehicleHeaderInfo: {
      flex: 1,
    },
    vehicleHeaderTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 2,
    },
    vehicleHeaderTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      flex: 1,
    },
    sharedVehicleBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.tint + "15",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      gap: 4,
    },
    sharedVehicleBadgeText: {
      fontSize: 10,
      fontWeight: "500",
      color: colors.tint,
    },
    vehicleHeaderPlate: {
      fontSize: 14,
      color: colors.icon,
      fontWeight: "500",
    },
    vehicleLogsSection: {
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
  });

if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Logs</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

const currentLogs = getCurrentLogs();
  const groupedLogs = getGroupedLogsByVehicle();

return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Logs</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push(getAddRoute() as any)}
        >
          <IconSymbol name="plus" size={16} color="white" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

<View style={styles.tabs}>
        <TabButton type="mileage" label="Mileage" icon="speedometer" />
        <TabButton type="fuel" label="Fuel" icon="fuelpump" />
        <TabButton type="service" label="Service" icon="wrench" />
      </View>

{currentLogs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <IconSymbol
              name={
                activeTab === "mileage"
                  ? "speedometer"
                  : activeTab === "fuel"
                    ? "fuelpump"
                    : "wrench"
              }
              size={32}
              color={colors.icon}
            />
          </View>
          <Text style={styles.emptyTitle}>No {activeTab} logs yet</Text>
          <Text style={styles.emptyDescription}>
            Start tracking your vehicle's {activeTab} to monitor
            performance and maintenance.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push(getAddRoute() as any)}
          >
            <IconSymbol name="plus" size={16} color="white" />
            <Text style={styles.emptyButtonText}>Add {activeTab} log</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {Object.entries(groupedLogs).map(([vehicleId, { vehicle, logs }]) => {
            const isSharedVehicle =
              logs.length > 0 \&\& (logs[0].is_shared_vehicle || false);

return (
              <View key={vehicleId}>
                <VehicleHeader
                  vehicle={vehicle}
                  isSharedVehicle={isSharedVehicle}
                />
                <View style={styles.vehicleLogsSection}>
                  {logs.map((log) => (
                    <LogCard key={log.id} log={log} type={activeTab} />
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

<ConfirmModal
        visible={deleteModalVisible}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteModalVisible(false);
            setSelectedLog(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Log"
        message={
          selectedLog
            ? `Are you sure you want to delete this ${selectedLog.type} log: ${selectedLog.description}?`
            : ""
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleteLoading}
      />

<AlertModal
        visible={alertModalVisible}
        onClose={() => setAlertModalVisible(false)}
        title={alertTitle}
        message={alertMessage}
        variant={alertVariant}
      />
    </SafeAreaView>
  );
}

i want to redesign my logs tabs/pages to be more modern and user friendly. i just want to redesign

Based on modern React Native UI trends for 2025, here are comprehensive redesign suggestions to make your logs screen more modern and user-friendly:

## Modern Tab Design

**Segmented Control Style** - Replace the current bordered tabs with a modern segmented control that feels more native and polished :[^1][^2]

```tsx
const styles = StyleSheet.create({
  // ... other styles
  
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: colors.icon + '10', // Light background
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    // Remove border
  },
  activeTab: {
    backgroundColor: colors.background, // or 'white'
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});
```

**Animated Sliding Indicator** - Add a smooth sliding indicator under the active tab for better visual feedback.[^3][^1]

## Enhanced Card Design

**Modern Glass Morphism Cards** - Update cards with contemporary styling :[^4][^5]

```tsx
const styles = StyleSheet.create({
  logCard: {
    backgroundColor: colors.background,
    borderRadius: 16, // Increased from 12
    padding: 20, // Increased padding
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.icon + '10', // Lighter border
    
    // Modern shadow
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  
  // Larger, more prominent icons
  logIcon: {
    width: 48, // Increased from 40
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
});
```

**Swipeable Cards** - Implement swipe actions for delete/edit using `react-native-gesture-handler` for a more intuitive mobile experience :[^6][^4]

```tsx
import Swipeable from 'react-native-gesture-handler/Swipeable';

const renderRightActions = () => (
  <View style={styles.swipeActions}>
    <TouchableOpacity style={styles.editAction}>
      <IconSymbol name="pencil" size={20} color="white" />
    </TouchableOpacity>
    <TouchableOpacity style={styles.deleteAction}>
      <IconSymbol name="trash" size={20} color="white" />
    </TouchableOpacity>
  </View>
);

// Wrap LogCard content in Swipeable
<Swipeable renderRightActions={renderRightActions}>
  {/* Card content */}
</Swipeable>
```


## Improved Visual Hierarchy

**Typography Scale** - Use a more defined type hierarchy :[^7][^8]

```tsx
const styles = StyleSheet.create({
  logTitle: {
    fontSize: 18, // Increased from 16
    fontWeight: '700', // Bolder
    color: colors.text,
    letterSpacing: -0.3, // Tighter tracking
  },
  logSubtitle: {
    fontSize: 15, // Increased from 14
    color: colors.icon,
    fontWeight: '500', // Medium weight
    marginTop: 4,
  },
  logDate: {
    fontSize: 13,
    color: colors.icon + '60',
    fontWeight: '400',
    marginTop: 6,
  },
});
```

**Color-Coded Categories** - Use gradient backgrounds for log type indicators :[^4]

```tsx
const getLogGradient = (type: LogType) => {
  switch (type) {
    case 'mileage':
      return ['#2196F3', '#1976D2'];
    case 'fuel':
      return ['#4CAF50', '#388E3C'];
    case 'service':
      return ['#FF9800', '#F57C00'];
  }
};
```


## Modern Interactions

**Pull-to-Refresh Enhancement** - Add a custom animated refresh indicator :[^6]

**Skeleton Loading** - Replace the simple loading spinner with skeleton screens for better perceived performance :[^8][^7]

```tsx
const SkeletonCard = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonIcon} />
    <View style={styles.skeletonContent}>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonSubtitle} />
    </View>
  </View>
);
```

**Haptic Feedback** - Add tactile responses for button presses using `expo-haptics` :[^6]

```tsx
import * as Haptics from 'expo-haptics';

const handleDeletePress = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  handleDeleteLog(type, log.id, details.title);
};
```


## Vehicle Section Redesign

**Collapsible Sections** - Make vehicle headers collapsible to reduce scrolling :[^3]

```tsx
const [expandedVehicles, setExpandedVehicles] = useState<Set<string>>(new Set());

const toggleVehicle = (vehicleId: string) => {
  const newExpanded = new Set(expandedVehicles);
  if (newExpanded.has(vehicleId)) {
    newExpanded.delete(vehicleId);
  } else {
    newExpanded.add(vehicleId);
  }
  setExpandedVehicles(newExpanded);
};
```

**Summary Statistics** - Add quick stats to vehicle headers (total logs, latest update) :[^4]

```tsx
<View style={styles.vehicleStats}>
  <Text style={styles.statText}>{logs.length} logs</Text>
  <Text style={styles.statDivider}>•</Text>
  <Text style={styles.statText}>Last: {formatDate(logs[^0].date)}</Text>
</View>
```


## Additional Modern Features

**Floating Action Button** - Replace the top-right add button with a modern FAB :[^7][^6]

```tsx
<TouchableOpacity style={styles.fab}>
  <IconSymbol name="plus" size={24} color="white" />
</TouchableOpacity>

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
```

**Filter and Sort Options** - Add a filter bar below tabs with chips for quick filtering :[^9][^3]

```tsx
<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
  <TouchableOpacity style={styles.filterChip}>
    <Text>All Time</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.filterChip}>
    <Text>This Month</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.filterChip}>
    <Text>Sort: Date ↓</Text>
  </TouchableOpacity>
</ScrollView>
```

**Empty State Illustration** - Replace the basic empty state with an engaging illustration or animation using `lottie-react-native` :[^7]

These modern design patterns will significantly enhance your logs screen's usability and visual appeal, aligning with 2025 mobile UI standards. The key is maintaining consistency while adding delightful micro-interactions that make the app feel premium and responsive.[^10][^8][^7][^6]
<span style="display:none">[^11][^12][^13][^14][^15][^16][^17][^18][^19][^20]</span>

<div align="center">⁂</div>

[^1]: https://www.eleken.co/blog-posts/tabs-ux

[^2]: https://m3.material.io/components/tabs/guidelines

[^3]: https://www.nngroup.com/articles/tabs-used-right/

[^4]: https://www.uxpin.com/studio/blog/card-design-ui/

[^5]: https://www.eleken.co/blog-posts/card-ui-examples-and-best-practices-for-product-owners

[^6]: https://javascript.plainenglish.io/5-react-native-patterns-that-instantly-level-up-your-ui-02e532b3651f

[^7]: https://www.browserstack.com/guide/react-native-ui-components

[^8]: https://mantraideas.com/ui-kits-for-react-nextjs/

[^9]: https://app.uxcel.com/courses/ui-components-best-practices/navigation-best-practices-771

[^10]: https://blog.logrocket.com/best-react-native-ui-component-libraries/

[^11]: https://www.reddit.com/r/reactnative/comments/1lc7q37/best_crossplatform_ui_library_in_2025/

[^12]: https://dev.to/aneeqakhan/top-5-react-native-ui-libraries-for-stunning-mobile-apps-36n3

[^13]: https://www.youtube.com/watch?v=I_J7N0n5YPs

[^14]: https://ui-patterns.com

[^15]: https://www.supernova.io/blog/top-10-pre-built-react-frontend-ui-libraries-for-2025

[^16]: https://www.justinmind.com/ui-design/list

[^17]: https://reactnative.dev/architecture/landing-page

[^18]: https://www.reddit.com/r/UserExperienceDesign/comments/og7rbn/best_practice_ux_for_tabs_on_mobile_devices_to/

[^19]: https://m2.material.io/components/cards

[^20]: https://blog.logrocket.com/ux-design/tabs-ux-best-practices/

