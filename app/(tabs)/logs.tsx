import { MaxWidthContainer } from "@/components/layout/MaxWidthContainer";
import { ActionMenu, ActionMenuItem } from "@/components/ui/ActionMenu";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AlertModal, ConfirmModal } from "@/components/ui/Modal";
import { ServiceReceiptIndicator } from "@/components/ui/ReceiptViewer";
import { SkeletonLogList } from "@/components/ui/Skeleton";
import {
  FuelLogService,
  MileageLogService,
  ServiceLogService,
} from "@/lib/services/loggingService";
import { formatDate } from "@/lib/utils/dateUtils";
import { isFulfilled, safePromiseAll } from "@/lib/utils/networkUtils";
import { canUserAccessVehicle } from "@/lib/utils/serviceUtils";
import { supabase } from "@/services/supabaseClient";
import { FuelLog, MileageLog, ServiceLog, ServiceType } from "@/types";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStyles } from "react-native-unistyles";

// Conditionally import BottomSheet components only on native platforms
// This prevents react-native-reanimated web compatibility issues
let LogDetailsBottomSheet: any;
if (Platform.OS !== "web") {
  LogDetailsBottomSheet =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@/components/logs/LogDetailsBottomSheet").LogDetailsBottomSheet;
}

type LogType = "mileage" | "fuel" | "service";

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  oil_change: "Oil Change",
  tire_rotation: "Tire Rotation",
  brake_service: "Brake Service",
  general_maintenance: "General Maintenance",
  repair: "Repair",
  inspection: "Inspection",
  other: "Other",
};

export default function LogsScreen() {
  const { theme } = useStyles();

  const [activeTab, setActiveTab] = useState<LogType>("mileage");
  const [mileageLogs, setMileageLogs] = useState<MileageLog[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedVehicles, setExpandedVehicles] = useState<Set<string>>(
    new Set(),
  );
  const [showAllLogsForVehicle, setShowAllLogsForVehicle] = useState<
    Set<string>
  >(new Set());

  // OPTIMIZATION: Pagination state
  const [mileagePage, setMileagePage] = useState(0);
  const [fuelPage, setFuelPage] = useState(0);
  const [servicePage, setServicePage] = useState(0);
  const [hasMoreMileage, setHasMoreMileage] = useState(true);
  const [hasMoreFuel, setHasMoreFuel] = useState(true);
  const [hasMoreService, setHasMoreService] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 20;

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

  // Bottom sheet states
  const bottomSheetRef = useRef<any>(null);
  const [selectedBottomSheetLog, setSelectedBottomSheetLog] = useState<
    FuelLog | MileageLog | ServiceLog | null
  >(null);
  const [selectedBottomSheetLogType, setSelectedBottomSheetLogType] =
    useState<LogType | null>(null);
  const [bottomSheetCanModify, setBottomSheetCanModify] = useState(true);

  const canUserModifyLog = async (log: any): Promise<boolean> => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) return false;
      return await canUserAccessVehicle(log.vehicle_id, user.id);
    } catch (error) {
      console.error("Error checking modify permission:", error);
      return false;
    }
  };

  // OPTIMIZATION: Fetch initial logs with pagination
  const fetchAllLogs = useCallback(async () => {
    try {
      const results = await safePromiseAll(
        [
          MileageLogService.getMileageLogs(undefined, {
            limit: PAGE_SIZE,
            offset: 0,
          }),
          FuelLogService.getFuelLogs(undefined, {
            limit: PAGE_SIZE,
            offset: 0,
          }) as any,
          ServiceLogService.getServiceLogs(undefined, {
            limit: PAGE_SIZE,
            offset: 0,
          }) as any,
        ],
        8000,
      );

      const [mileageResult, fuelResult, serviceResult] = results;

      if (
        isFulfilled(mileageResult) &&
        (mileageResult.value as { data: MileageLog[] }).data
      ) {
        const data = (mileageResult.value as { data: MileageLog[] }).data;
        setMileageLogs(data);
        setHasMoreMileage(data.length === PAGE_SIZE);
        setMileagePage(1);
      } else {
        setMileageLogs([]);
        setHasMoreMileage(false);
      }

      if (
        isFulfilled(fuelResult) &&
        (fuelResult.value as { data: FuelLog[] }).data
      ) {
        const data = (fuelResult.value as { data: FuelLog[] }).data;
        setFuelLogs(data);
        setHasMoreFuel(data.length === PAGE_SIZE);
        setFuelPage(1);
      } else {
        setFuelLogs([]);
        setHasMoreFuel(false);
      }

      if (
        isFulfilled(serviceResult) &&
        (serviceResult.value as { data: ServiceLog[] }).data
      ) {
        const data = (serviceResult.value as { data: ServiceLog[] }).data;
        setServiceLogs(data);
        setHasMoreService(data.length === PAGE_SIZE);
        setServicePage(1);
      } else {
        setServiceLogs([]);
        setHasMoreService(false);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      setMileageLogs([]);
      setFuelLogs([]);
      setServiceLogs([]);
      setHasMoreMileage(false);
      setHasMoreFuel(false);
      setHasMoreService(false);
    } finally {
      setLoading(false);
    }
  }, [PAGE_SIZE]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Reset pagination on refresh
    setMileagePage(0);
    setFuelPage(0);
    setServicePage(0);
    await fetchAllLogs();
    setRefreshing(false);
  }, [fetchAllLogs]);

  // OPTIMIZATION: Load more logs for pagination
  const loadMoreLogs = useCallback(
    async (type: LogType) => {
      if (loadingMore) return;

      const currentPage =
        type === "mileage"
          ? mileagePage
          : type === "fuel"
            ? fuelPage
            : servicePage;
      const hasMore =
        type === "mileage"
          ? hasMoreMileage
          : type === "fuel"
            ? hasMoreFuel
            : hasMoreService;

      if (!hasMore) return;

      setLoadingMore(true);
      try {
        const offset = currentPage * PAGE_SIZE;
        let result;

        switch (type) {
          case "mileage":
            result = await MileageLogService.getMileageLogs(undefined, {
              limit: PAGE_SIZE,
              offset,
            });
            break;
          case "fuel":
            result = await FuelLogService.getFuelLogs(undefined, {
              limit: PAGE_SIZE,
              offset,
            });
            break;
          case "service":
            result = await ServiceLogService.getServiceLogs(undefined, {
              limit: PAGE_SIZE,
              offset,
            });
            break;
        }

        if (
          result?.data &&
          Array.isArray(result.data) &&
          result.data.length > 0
        ) {
          switch (type) {
            case "mileage":
              setMileageLogs((prev) => [
                ...prev,
                ...(result.data as MileageLog[]),
              ]);
              setHasMoreMileage(result.data.length === PAGE_SIZE);
              setMileagePage((prev) => prev + 1);
              break;
            case "fuel":
              setFuelLogs((prev) => [...prev, ...(result.data as FuelLog[])]);
              setHasMoreFuel(result.data.length === PAGE_SIZE);
              setFuelPage((prev) => prev + 1);
              break;
            case "service":
              setServiceLogs((prev) => [
                ...prev,
                ...(result.data as ServiceLog[]),
              ]);
              setHasMoreService(result.data.length === PAGE_SIZE);
              setServicePage((prev) => prev + 1);
              break;
          }
        } else {
          // No more logs to load
          switch (type) {
            case "mileage":
              setHasMoreMileage(false);
              break;
            case "fuel":
              setHasMoreFuel(false);
              break;
            case "service":
              setHasMoreService(false);
              break;
          }
        }
      } catch (error) {
        console.error(`Error loading more ${type} logs:`, error);
      } finally {
        setLoadingMore(false);
      }
    },
    [
      loadingMore,
      mileagePage,
      fuelPage,
      servicePage,
      hasMoreMileage,
      hasMoreFuel,
      hasMoreService,
      PAGE_SIZE,
    ],
  );

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
      await fetchAllLogs();
    } else if (result?.data === true) {
      await fetchAllLogs();
      showAlert(
        "Success",
        `${selectedLog.type} log deleted successfully`,
        "success",
      );
    } else {
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

  const handleOpenLogDetails = async (
    log: FuelLog | MileageLog | ServiceLog,
    logType: LogType,
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const canModify = await canUserModifyLog(log);
    setSelectedBottomSheetLog(log);
    setSelectedBottomSheetLogType(logType);
    setBottomSheetCanModify(canModify);
    bottomSheetRef.current?.expand();
  };

  const handleCloseBottomSheet = () => {
    bottomSheetRef.current?.close();
  };

  const handleBottomSheetEdit = (type: LogType, id: string) => {
    handleCloseBottomSheet();
    handleEditLog(type, id);
  };

  const handleBottomSheetDelete = (
    type: LogType,
    id: string,
    description: string,
  ) => {
    handleCloseBottomSheet();
    handleDeleteLog(type, id, description);
  };

  const toggleVehicle = (vehicleId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedVehicles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(vehicleId)) {
        newSet.delete(vehicleId);
      } else {
        newSet.add(vehicleId);
      }
      return newSet;
    });
  };

  const toggleShowAllLogs = (vehicleId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAllLogsForVehicle((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(vehicleId)) {
        newSet.delete(vehicleId);
      } else {
        newSet.add(vehicleId);
      }
      return newSet;
    });
  };

  useFocusEffect(
    useCallback(() => {
      fetchAllLogs();
    }, [fetchAllLogs]),
  );

  // Tab component
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
      style={{
        flex: 1,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        backgroundColor:
          activeTab === type ? theme.colors.primary : "transparent",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing.sm,
      }}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActiveTab(type);
      }}
    >
      <IconSymbol
        name={icon as any}
        size={20}
        color={
          activeTab === type ? theme.colors.white : theme.colors.textSecondary
        }
      />
      <Text
        style={{
          color:
            activeTab === type
              ? theme.colors.white
              : theme.colors.textSecondary,
          fontSize: theme.fontSize.sm,
          fontWeight:
            activeTab === type
              ? theme.fontWeight.semibold
              : theme.fontWeight.normal,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Vehicle header component
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
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.lg,
          backgroundColor: theme.colors.background,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          marginTop: theme.spacing.md,
        }}
        onPress={() => toggleVehicle(vehicleId)}
        activeOpacity={0.7}
      >
        {vehicle?.main_image_url && !imageError ? (
          <Image
            source={{ uri: vehicle.main_image_url }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              marginRight: theme.spacing.md,
              backgroundColor: theme.colors.disabled,
              ...(isSharedVehicle && {
                borderWidth: 2,
                borderColor: theme.colors.success,
              }),
            }}
            onError={() => setImageError(true)}
          />
        ) : (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: isSharedVehicle
                ? theme.colors.success
                : theme.colors.primary,
              alignItems: "center",
              justifyContent: "center",
              marginRight: theme.spacing.md,
            }}
          >
            <IconSymbol name="car" size={18} color={theme.colors.white} />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 2,
            }}
          >
            <Text
              style={{
                fontSize: theme.fontSize.lg,
                fontWeight: theme.fontWeight.semibold,
                color: theme.colors.text,
                flex: 1,
              }}
            >
              {vehicle?.year} {vehicle?.make} {vehicle?.model}
            </Text>
            {isSharedVehicle && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: theme.colors.primary + "15",
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  borderRadius: theme.borderRadius.sm,
                  gap: theme.spacing.xs,
                }}
              >
                <IconSymbol
                  name="person.2"
                  size={12}
                  color={theme.colors.primary}
                />
                <Text
                  style={{
                    fontSize: theme.fontSize.xs,
                    fontWeight: theme.fontWeight.medium,
                    color: theme.colors.primary,
                  }}
                >
                  Shared
                </Text>
              </View>
            )}
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: theme.spacing.sm,
              gap: theme.spacing.sm,
            }}
          >
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
                fontWeight: theme.fontWeight.medium,
              }}
            >
              {vehicle?.license_plate}
            </Text>
            <Text
              style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.textSecondary + "40",
              }}
            >
              •
            </Text>
            <Text
              style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.textSecondary,
                fontWeight: theme.fontWeight.medium,
              }}
            >
              {logsCount} {logsCount === 1 ? "log" : "logs"}
            </Text>
            <Text
              style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.textSecondary + "40",
              }}
            >
              •
            </Text>
            <Text
              style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.textSecondary,
                fontWeight: theme.fontWeight.medium,
              }}
            >
              {formatDate(latestLogDate)}
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

  const parseServiceDescription = (description: string) => {
    try {
      const parsed = JSON.parse(description);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return null;
    }
    return null;
  };

  // Log card component
  const LogCard = ({ log, type }: { log: any; type: LogType }) => {
    const [canModify, setCanModify] = useState(true);

    React.useEffect(() => {
      canUserModifyLog(log).then(setCanModify);
    }, [log]);

    const getLogDetails = () => {
      switch (type) {
        case "mileage":
          return {
            icon: "speedometer",
            color: theme.colors.primary,
            title: `${log.odometer_reading?.toLocaleString() || 0} km`,
            subtitle: log.notes || "No notes",
            odometer: log.odometer_reading
              ? `Odometer: ${log.odometer_reading.toLocaleString()} km`
              : null,
          };
        case "fuel":
          return {
            icon: "fuelpump",
            color: theme.colors.primary,
            title: `${log.liters_filled?.toFixed(2) || 0}L - RM${log.cost?.toFixed(2) || 0}`,
            subtitle: log.location || "No location",
            odometer: log.odometer_reading
              ? `Odometer: ${log.odometer_reading.toLocaleString()} km`
              : null,
          };
        case "service":
          // Legacy check for simple description or JSON description
          const parsedItems = parseServiceDescription(
            log.description || log.service_items,
          );
          const simpleDescription =
            log.description || log.notes || "No description";

          return {
            icon: "wrench",
            color: theme.colors.success,
            title:
              SERVICE_TYPE_LABELS[log.service_type as ServiceType] || "Service",
            subtitle: simpleDescription,
            parsedItems: parsedItems,
            odometer: log.odometer_reading
              ? `Odometer : ${log.odometer_reading.toLocaleString()} km`
              : "Odometer : -",
            hasReceipt: log.receipt_image_url ? true : false,
            receiptUrl: log.receipt_image_url,
            cost: log.cost || 0,
            date: log.date,
          };
      }
    };

    const details = getLogDetails();

    const actionMenuItems: ActionMenuItem[] = [
      {
        label: "Edit",
        icon: "pencil",
        onPress: () => handleEditLog(type, log.id),
        disabled: !canModify,
      },
      {
        label: "Delete",
        icon: "trash",
        onPress: () => handleDeleteLog(type, log.id, details.title),
        variant: "danger",
        disabled: !canModify,
      },
    ];

    if (type === "service") {
      // Special layout for Service Logs
      const serviceDetails = details;
      return (
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.background,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
            ...(log.is_shared_vehicle && {
              borderColor: theme.colors.primary + "40",
              backgroundColor: theme.colors.surface,
            }),
          }}
          onPress={() => handleOpenLogDetails(log, type)}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: serviceDetails.color + "15",
                alignItems: "center",
                justifyContent: "center",
                marginRight: theme.spacing.lg,
              }}
            >
              <IconSymbol
                name={serviceDetails.icon as any}
                size={24}
                color={serviceDetails.color}
              />
            </View>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: theme.spacing.xs,
                }}
              >
                <Text
                  style={{
                    fontSize: theme.fontSize.lg,
                    fontWeight: theme.fontWeight.bold,
                    color: theme.colors.text,
                    letterSpacing: -0.3,
                  }}
                >
                  {serviceDetails.title}
                </Text>
                {serviceDetails.hasReceipt && (
                  <ServiceReceiptIndicator
                    hasReceipt={serviceDetails.hasReceipt}
                    receiptUrl={serviceDetails.receiptUrl}
                    onPress={() => handleViewServiceDetail(log.id)}
                    size={18}
                  />
                )}
              </View>

              {/* Odometer | Date Line */}
              <Text
                style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textSecondary,
                  fontWeight: theme.fontWeight.medium,
                  marginBottom: theme.spacing.md,
                }}
              >
                {serviceDetails.odometer} | {formatDate(serviceDetails.date!)}
              </Text>

              {/* Service Items List */}
              <View style={{ marginBottom: theme.spacing.md }}>
                {serviceDetails.parsedItems &&
                serviceDetails.parsedItems.length > 0 ? (
                  serviceDetails.parsedItems.map((item: any, index: number) => (
                    <Text
                      key={index}
                      style={{
                        fontSize: theme.fontSize.base,
                        color: theme.colors.text,
                        lineHeight: 22,
                      }}
                    >
                      {index + 1}. {item.description} RM{item.price}
                    </Text>
                  ))
                ) : (
                  <Text
                    style={{
                      fontSize: theme.fontSize.base,
                      color: theme.colors.text,
                      lineHeight: 22,
                    }}
                  >
                    {serviceDetails.subtitle}
                  </Text>
                )}
              </View>

              {/* Total Cost */}
              <Text
                style={{
                  fontSize: theme.fontSize.base,
                  fontWeight: theme.fontWeight.bold,
                  color: theme.colors.text,
                }}
              >
                Total : RM {serviceDetails.cost}
              </Text>
            </View>
            <View style={{ marginLeft: theme.spacing.sm }}>
              <ActionMenu items={actionMenuItems} />
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    // Default layout for Mileage and Fuel
    return (
      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.background,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.lg,
          marginBottom: theme.spacing.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...(log.is_shared_vehicle && {
            borderColor: theme.colors.primary + "40",
            backgroundColor: theme.colors.surface,
          }),
        }}
        onPress={() => handleOpenLogDetails(log, type)}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: details.color + "15",
              alignItems: "center",
              justifyContent: "center",
              marginRight: theme.spacing.lg,
            }}
          >
            <IconSymbol
              name={details.icon as any}
              size={24}
              color={details.color}
            />
          </View>
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: theme.spacing.xs,
              }}
            >
              <Text
                style={{
                  fontSize: theme.fontSize.lg,
                  fontWeight: theme.fontWeight.bold,
                  color: theme.colors.text,
                  letterSpacing: -0.3,
                }}
              >
                {details.title}
              </Text>
            </View>
            <Text
              style={{
                fontSize: theme.fontSize.base,
                color: theme.colors.textSecondary,
                fontWeight: theme.fontWeight.medium,
                marginTop: theme.spacing.xs,
              }}
            >
              {details.subtitle}
            </Text>
            {details.odometer && (
              <Text
                style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textSecondary,
                  marginBottom: theme.spacing.xs,
                }}
              >
                {details.odometer}
              </Text>
            )}
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
                fontWeight: theme.fontWeight.normal,
                marginTop: theme.spacing.sm,
              }}
            >
              {formatDate(log.date)}
            </Text>
          </View>
          <View style={{ marginLeft: theme.spacing.sm }}>
            <ActionMenu items={actionMenuItems} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getCurrentLogs = useCallback(() => {
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
  }, [activeTab, mileageLogs, fuelLogs, serviceLogs]);

  const getGroupedLogsByVehicle = useCallback(() => {
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

    Object.values(grouped).forEach((group) => {
      group.logs.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    });

    return grouped;
  }, [getCurrentLogs]);

  // Auto-expand all vehicles when logs are first loaded
  useEffect(() => {
    if (!loading && expandedVehicles.size === 0) {
      const grouped = getGroupedLogsByVehicle();
      const allVehicleIds = Object.keys(grouped);
      if (allVehicleIds.length > 0) {
        setExpandedVehicles(new Set(allVehicleIds));
      }
    }
  }, [loading, expandedVehicles.size, getGroupedLogsByVehicle]);

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

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <View
          style={{
            paddingHorizontal: theme.spacing.xl,
            paddingVertical: theme.spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <Text
            style={{
              fontSize: theme.fontSize["3xl"],
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
            }}
          >
            Logs
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            padding: theme.spacing.lg,
            gap: theme.spacing.sm,
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <TabButton type="mileage" label="Mileage" icon="speedometer" />
          <TabButton type="fuel" label="Fuel" icon="fuelpump" />
          <TabButton type="service" label="Service" icon="wrench" />
        </View>
        <ScrollView style={{ flex: 1 }}>
          <SkeletonLogList itemCount={5} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const currentLogs = getCurrentLogs();
  const groupedLogs = getGroupedLogsByVehicle();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <MaxWidthContainer>
        {/* <View
          style={{
            paddingHorizontal: theme.spacing.xl,
            paddingVertical: theme.spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <Text
            style={{
              fontSize: theme.fontSize["3xl"],
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
            }}
          >
            Logs
          </Text>
        </View> */}

        <View
          style={{
            flexDirection: "row",
            padding: theme.spacing.lg,
            gap: theme.spacing.sm,
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <TabButton type="mileage" label="Mileage" icon="speedometer" />
          <TabButton type="fuel" label="Fuel" icon="fuelpump" />
          <TabButton type="service" label="Service" icon="wrench" />
        </View>

        {currentLogs.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: theme.spacing.xxxl,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: theme.colors.disabled,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: theme.spacing.lg,
              }}
            >
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
            <Text
              style={{
                fontSize: theme.fontSize.xl,
                fontWeight: theme.fontWeight.semibold,
                color: theme.colors.text,
                marginBottom: theme.spacing.sm,
              }}
            >
              No {activeTab} logs yet
            </Text>
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
                textAlign: "center",
                lineHeight: 20,
                marginBottom: theme.spacing.xl,
              }}
            >
              Start tracking your vehicle&apos;s {activeTab} to monitor
              performance and maintenance.
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.primary,
                paddingHorizontal: theme.spacing.xl,
                paddingVertical: theme.spacing.md,
                borderRadius: theme.borderRadius.md,
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.sm,
              }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push(getAddRoute() as any);
              }}
            >
              <IconSymbol name="plus" size={16} color={theme.colors.white} />
              <Text
                style={{
                  color: theme.colors.white,
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.fontWeight.semibold,
                }}
              >
                Add {activeTab} log
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {Object.entries(groupedLogs).map(
              ([vehicleId, { vehicle, logs }]) => {
                const isSharedVehicle =
                  logs.length > 0 && (logs[0].is_shared_vehicle || false);
                const isExpanded = expandedVehicles.has(vehicleId);
                const showAll = showAllLogsForVehicle.has(vehicleId);
                const displayedLogs = showAll ? logs : logs.slice(0, 3);
                const hasMoreLogs = logs.length > 3;

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
                      <View
                        style={{
                          paddingHorizontal: theme.spacing.xl,
                          paddingBottom: theme.spacing.sm,
                        }}
                      >
                        {displayedLogs.map((log) => (
                          <LogCard key={log.id} log={log} type={activeTab} />
                        ))}
                        {hasMoreLogs && !showAll && (
                          <TouchableOpacity
                            style={{
                              backgroundColor: theme.colors.surface,
                              borderRadius: theme.borderRadius.lg,
                              padding: theme.spacing.md,
                              marginBottom: theme.spacing.md,
                              borderWidth: 1,
                              borderColor: theme.colors.border,
                              alignItems: "center",
                              flexDirection: "row",
                              justifyContent: "center",
                              gap: theme.spacing.sm,
                            }}
                            onPress={() => toggleShowAllLogs(vehicleId)}
                          >
                            <Text
                              style={{
                                fontSize: theme.fontSize.base,
                                fontWeight: theme.fontWeight.semibold,
                                color: theme.colors.primary,
                              }}
                            >
                              See {logs.length - 3} more{" "}
                              {logs.length - 3 === 1 ? "log" : "logs"}
                            </Text>
                            <IconSymbol
                              name="chevron.down"
                              size={16}
                              color={theme.colors.primary}
                            />
                          </TouchableOpacity>
                        )}
                        {hasMoreLogs && showAll && (
                          <TouchableOpacity
                            style={{
                              backgroundColor: theme.colors.surface,
                              borderRadius: theme.borderRadius.lg,
                              padding: theme.spacing.md,
                              marginBottom: theme.spacing.md,
                              borderWidth: 1,
                              borderColor: theme.colors.border,
                              alignItems: "center",
                              flexDirection: "row",
                              justifyContent: "center",
                              gap: theme.spacing.sm,
                            }}
                            onPress={() => toggleShowAllLogs(vehicleId)}
                          >
                            <Text
                              style={{
                                fontSize: theme.fontSize.base,
                                fontWeight: theme.fontWeight.semibold,
                                color: theme.colors.primary,
                              }}
                            >
                              Show less
                            </Text>
                            <IconSymbol
                              name="chevron.up"
                              size={16}
                              color={theme.colors.primary}
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                );
              },
            )}

            {/* OPTIMIZATION: Load More Button */}
            {((activeTab === "mileage" && hasMoreMileage) ||
              (activeTab === "fuel" && hasMoreFuel) ||
              (activeTab === "service" && hasMoreService)) && (
              <View
                style={{
                  paddingHorizontal: theme.spacing.xl,
                  paddingBottom: theme.spacing.xl,
                }}
              >
                <TouchableOpacity
                  style={{
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.borderRadius.lg,
                    padding: theme.spacing.lg,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: theme.spacing.sm,
                  }}
                  onPress={() => loadMoreLogs(activeTab)}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator color={theme.colors.white} />
                  ) : (
                    <>
                      <Text
                        style={{
                          fontSize: theme.fontSize.base,
                          fontWeight: theme.fontWeight.semibold,
                          color: theme.colors.white,
                        }}
                      >
                        Load More Logs
                      </Text>
                      <IconSymbol
                        name="arrow.down.circle"
                        size={20}
                        color={theme.colors.white}
                      />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}

        <TouchableOpacity
          style={{
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
          }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push(getAddRoute() as any);
          }}
        >
          <IconSymbol name="plus" size={24} color={theme.colors.white} />
        </TouchableOpacity>

        <ConfirmModal
          visible={deleteModalVisible}
          title="Delete Log"
          message={`Are you sure you want to delete this ${selectedLog?.type} log?\n\n${selectedLog?.description}`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteModalVisible(false)}
          loading={deleteLoading}
          variant="danger"
        />

        <AlertModal
          visible={alertModalVisible}
          title={alertTitle}
          message={alertMessage}
          variant={alertVariant}
          onClose={() => setAlertModalVisible(false)}
        />

        {Platform.OS !== "web" && LogDetailsBottomSheet && (
          <LogDetailsBottomSheet
            ref={bottomSheetRef}
            log={selectedBottomSheetLog}
            logType={selectedBottomSheetLogType}
            canModify={bottomSheetCanModify}
            onClose={handleCloseBottomSheet}
            onEdit={handleBottomSheetEdit}
            onDelete={handleBottomSheetDelete}
          />
        )}
      </MaxWidthContainer>
    </SafeAreaView>
  );
}
