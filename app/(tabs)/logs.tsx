import { IconSymbol } from "@/components/ui/icon-symbol";
import { AlertModal, ConfirmModal } from "@/components/ui/Modal";
import { ServiceReceiptIndicator } from "@/components/ui/ReceiptViewer";
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
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Animated,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { SafeAreaView } from "react-native-safe-area-context";
import { createStyleSheet, useStyles } from "react-native-unistyles";

type CombinedLog = (MileageLog | FuelLog | ServiceLog) & {
  vehicles?: VehicleWithDetails;
};

type LogType = "mileage" | "fuel" | "service";

export default function LogsScreen() {
  const { styles, theme } = useStyles(stylesheet);

  const [activeTab, setActiveTab] = useState<LogType>("mileage");
  const [mileageLogs, setMileageLogs] = useState<MileageLog[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedVehicles, setExpandedVehicles] = useState<Set<string>>(
    new Set(),
  );

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
        isFulfilled(mileageResult) &&
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
        isFulfilled(fuelResult) &&
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
        isFulfilled(serviceResult) &&
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

  const toggleVehicle = (vehicleId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newExpanded = new Set(expandedVehicles);
    if (newExpanded.has(vehicleId)) {
      newExpanded.delete(vehicleId);
    } else {
      newExpanded.add(vehicleId);
    }
    setExpandedVehicles(newExpanded);
  };

  const handleDeleteLog = (type: LogType, id: string, description: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/logs/service/${serviceId}` as any);
  };

  const handleEditLog = (type: LogType, id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const renderRightActions = (
    type: LogType,
    id: string,
    description: string,
  ) => {
    const RightActions = (
      progress: Animated.AnimatedInterpolation<number>,
      dragX: Animated.AnimatedInterpolation<number>,
    ) => {
      const trans = dragX.interpolate({
        inputRange: [-160, 0],
        outputRange: [0, 160],
        extrapolate: "clamp",
      });

      return (
        <Animated.View
          style={[
            styles.swipeActions,
            {
              transform: [{ translateX: trans }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.editAction}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleEditLog(type, id);
            }}
          >
            <IconSymbol name="pencil" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteAction}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleDeleteLog(type, id, description);
            }}
          >
            <IconSymbol name="trash" size={20} color="white" />
          </TouchableOpacity>
        </Animated.View>
      );
    };
    return RightActions;
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
      style={[styles.tabButton, activeTab === type && styles.activeTab]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActiveTab(type);
      }}
    >
      <IconSymbol
        name={icon as any}
        size={20}
        color={
          activeTab === type ? theme.colors.primary : theme.colors.textSecondary
        }
      />
      <Text
        style={[
          styles.tabButtonText,
          {
            color:
              activeTab === type
                ? theme.colors.primary
                : theme.colors.textSecondary,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const VehicleHeader = ({
    vehicle,
    isSharedVehicle,
    vehicleId,
    logsCount,
    latestLogDate,
  }: {
    vehicle: any;
    isSharedVehicle: boolean;
    vehicleId: string;
    logsCount: number;
    latestLogDate: string;
  }) => {
    const [imageError, setImageError] = useState(false);
    const isExpanded = expandedVehicles.has(vehicleId);

    return (
      <TouchableOpacity
        style={styles.vehicleHeader}
        onPress={() => toggleVehicle(vehicleId)}
        activeOpacity={0.7}
      >
        {vehicle?.main_image_url && !imageError ? (
          <Image
            source={{ uri: vehicle.main_image_url }}
            style={[
              styles.vehicleHeaderImage,
              isSharedVehicle && styles.sharedVehicleHeaderImage,
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
              isSharedVehicle && styles.sharedVehicleHeaderIcon,
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
            {isSharedVehicle && (
              <View style={styles.sharedVehicleBadge}>
                <IconSymbol
                  name="person.2.fill"
                  size={12}
                  color={theme.colors.primary}
                />
                <Text style={styles.sharedVehicleBadgeText}>Shared</Text>
              </View>
            )}
          </View>
          {vehicle?.license_plate && (
            <Text style={styles.vehicleHeaderPlate}>
              {vehicle.license_plate}
            </Text>
          )}
          <View style={styles.vehicleStats}>
            <Text style={styles.statText}>{logsCount} logs</Text>
            <Text style={styles.statDivider}>•</Text>
            <Text style={styles.statText}>
              Last: {formatDate(latestLogDate)}
            </Text>
          </View>
        </View>
        <IconSymbol
          name={isExpanded ? "chevron.up" : "chevron.down"}
          size={20}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>
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
            color: theme.colors.primary,
          };
        case "fuel":
          return {
            title: `${log.cost ? `RM${log.cost}` : ""} `,
            subtitle: `${log.liters_filled} L`,
            odometer: log.odometer_reading
              ? `${log.odometer_reading.toLocaleString()} km`
              : null,
            icon: "fuelpump",
            color: theme.colors.warning,
          };
        case "service":
          return {
            title: log.service_type?.replace("_", " ").toUpperCase(),
            subtitle: `${formatServiceItems(log.description)}${log.cost ? ` • RM${log.cost}` : ""}`,
            icon: "wrench",
            color: theme.colors.error,
            hasReceipt: !!log.receipt_image_url,
            receiptUrl: log.receipt_image_url,
          };
        default:
          return {
            title: "",
            subtitle: "",
            icon: "doc",
            color: theme.colors.primary,
          };
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

    // Only enable swipe for logs that user can modify
    if (canModify) {
      return (
        <Swipeable
          renderRightActions={renderRightActions(type, log.id, details.title)}
          overshootRight={false}
        >
          <TouchableOpacity
            style={[styles.logCard, isSharedVehicle && styles.sharedLogCard]}
            onPress={handleCardPress}
            activeOpacity={0.7}
          >
            <View style={styles.logHeader}>
              <View
                style={[
                  styles.logIcon,
                  { backgroundColor: details.color + "20" },
                ]}
              >
                <IconSymbol
                  name={details.icon as any}
                  size={24}
                  color={details.color}
                />
              </View>
              <View style={styles.logInfo}>
                <View style={styles.logTitleRow}>
                  <Text style={styles.logTitle}>{details.title}</Text>
                  {type === "service" && details.hasReceipt && (
                    <ServiceReceiptIndicator
                      hasReceipt={details.hasReceipt}
                      receiptUrl={details.receiptUrl}
                      onPress={() => handleViewServiceDetail(log.id)}
                      size={18}
                    />
                  )}
                </View>
                <Text style={styles.logSubtitle}>{details.subtitle}</Text>
                {details.odometer && (
                  <Text style={styles.logOdometer}>{details.odometer}</Text>
                )}
                <Text style={styles.logDate}>{formatDate(log.date)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Swipeable>
      );
    }

    // Non-swipeable card for read-only logs
    return (
      <TouchableOpacity
        style={[styles.logCard, isSharedVehicle && styles.sharedLogCard]}
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        <View style={styles.logHeader}>
          <View
            style={[styles.logIcon, { backgroundColor: details.color + "20" }]}
          >
            <IconSymbol
              name={details.icon as any}
              size={24}
              color={details.color}
            />
          </View>
          <View style={styles.logInfo}>
            <View style={styles.logTitleRow}>
              <Text style={styles.logTitle}>{details.title}</Text>
              {type === "service" && details.hasReceipt && (
                <ServiceReceiptIndicator
                  hasReceipt={details.hasReceipt}
                  receiptUrl={details.receiptUrl}
                  onPress={() => handleViewServiceDetail(log.id)}
                  size={18}
                />
              )}
            </View>
            <Text style={styles.logSubtitle}>{details.subtitle}</Text>
            {details.odometer && (
              <Text style={styles.logOdometer}>{details.odometer}</Text>
            )}
            <Text style={styles.logDate}>{formatDate(log.date)}</Text>
          </View>
          <View style={styles.readOnlyIndicator}>
            <IconSymbol
              name="eye"
              size={18}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.readOnlyText}>View Only</Text>
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

    // Auto-expand all vehicles if expandedVehicles is empty
    if (expandedVehicles.size === 0) {
      const allVehicleIds = Object.keys(grouped);
      setExpandedVehicles(new Set(allVehicleIds));
    }

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

  const SkeletonCard = () => (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonIcon} />
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonSubtitle} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Logs</Text>
        </View>
        <View style={styles.tabs}>
          <TabButton type="mileage" label="Mileage" icon="speedometer" />
          <TabButton type="fuel" label="Fuel" icon="fuelpump" />
          <TabButton type="service" label="Service" icon="wrench" />
        </View>
        <ScrollView style={styles.content}>
          <View style={{ padding: 20 }}>
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const currentLogs = getCurrentLogs();
  const groupedLogs = getGroupedLogsByVehicle();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Logs</Text>
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
              color={theme.colors.textSecondary}
            />
          </View>
          <Text style={styles.emptyTitle}>No {activeTab} logs yet</Text>
          <Text style={styles.emptyDescription}>
            Start tracking your vehicle&apos;s {activeTab} to monitor
            performance and maintenance.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push(getAddRoute() as any);
            }}
          >
            <IconSymbol name="plus" size={16} color={theme.colors.white} />
            <Text style={styles.emptyButtonText}>Add {activeTab} log</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {Object.entries(groupedLogs).map(([vehicleId, { vehicle, logs }]) => {
            const isSharedVehicle =
              logs.length > 0 && (logs[0].is_shared_vehicle || false);
            const isExpanded = expandedVehicles.has(vehicleId);

            return (
              <View key={vehicleId}>
                <VehicleHeader
                  vehicle={vehicle}
                  isSharedVehicle={isSharedVehicle}
                  vehicleId={vehicleId}
                  logsCount={logs.length}
                  latestLogDate={logs[0].date}
                />
                {isExpanded && (
                  <View style={styles.vehicleLogsSection}>
                    {logs.map((log) => (
                      <LogCard key={log.id} log={log} type={activeTab} />
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push(getAddRoute() as any);
        }}
      >
        <IconSymbol name="plus" size={24} color={theme.colors.white} />
      </TouchableOpacity>

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
const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize["3xl"],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  tabs: {
    flexDirection: "row",
    marginHorizontal: theme.spacing.xl,
    marginVertical: theme.spacing.lg,
    backgroundColor: theme.colors.disabled,
    borderRadius: theme.borderRadius.xl,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  activeTab: {
    backgroundColor: theme.colors.surface,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.xxxl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.disabled,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  emptyButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  logCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  sharedLogCard: {
    borderColor: theme.colors.primary + "40",
    backgroundColor: theme.colors.primary + "05",
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  logIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.lg,
  },
  logInfo: {
    flex: 1,
  },
  logTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xs,
  },
  logTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  logSubtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    marginTop: theme.spacing.xs,
  },
  logDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.normal,
    marginTop: theme.spacing.sm,
  },
  logOdometer: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  readOnlyIndicator: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xs,
    opacity: 0.6,
  },
  readOnlyText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
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
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginTop: theme.spacing.md,
  },
  vehicleHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
  },
  vehicleHeaderImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.disabled,
    overflow: "hidden",
  },
  sharedVehicleHeaderIcon: {
    backgroundColor: theme.colors.success,
  },
  sharedVehicleHeaderImage: {
    borderWidth: 2,
    borderColor: theme.colors.success,
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
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    flex: 1,
  },
  sharedVehicleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary + "15",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs,
  },
  sharedVehicleBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
  },
  vehicleHeaderPlate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  vehicleLogsSection: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.sm,
  },
  vehicleStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  statText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  statDivider: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary + "40",
  },
  fab: {
    position: "absolute",
    right: theme.spacing.xl,
    bottom: theme.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  swipeActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  editAction: {
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
  deleteAction: {
    backgroundColor: theme.colors.error,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
  skeletonCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
  },
  skeletonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.disabled,
    marginRight: theme.spacing.lg,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonTitle: {
    height: 18,
    backgroundColor: theme.colors.disabled,
    borderRadius: 4,
    marginBottom: theme.spacing.sm,
    width: "60%",
  },
  skeletonSubtitle: {
    height: 14,
    backgroundColor: theme.colors.disabled,
    borderRadius: 4,
    width: "40%",
  },
}));
