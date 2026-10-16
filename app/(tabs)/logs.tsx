import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { LogVehicleFilter } from "@/components/logs/LogVehicleFilter";
import { VehicleService } from "@/lib/services/vehicleService";
import { VehicleWithDetails } from "@/types/database-v2";
import { storageImageUrl } from "@/lib/utils/storagePath";
import { withOpacity, spacing } from "@/src/design-system";
import { LogDetailsBottomSheet } from "@/components/logs";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { webPageStyles } from "@/components/layout/webPageStyles";
import { WebFilterButton } from "@/components/ui/WebFilterButton";
import { Button } from "@/components/ui/Button";
import { MaxWidthContainer } from "@/components/layout/MaxWidthContainer";
import { ActionMenu, ActionMenuItem } from "@/components/ui/ActionMenu";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ServiceReceiptIndicator } from "@/components/ui/ReceiptViewer";
import { SkeletonLogList } from "@/components/ui/Skeleton";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useDialog } from "@/lib/contexts/DialogContext";
import {
  FuelLogService,
  MileageLogService,
  isAutoMileageLog,
  ServiceLogService,
} from "@/lib/services/loggingService";
import { formatDate } from "@/lib/utils/dateUtils";
import { isFulfilled, safePromiseAll } from "@/lib/utils/networkUtils";
import { canUserAccessVehicle } from "@/lib/utils/serviceUtils";
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
  const { styles: web } = useStyles(webPageStyles);
  const layout = useResponsiveLayout();
  const isWebPage = layout.isWeb && !layout.isMobile;
  const { user } = useAuth();

  const [vehicleSelection, setVehicleSelection] = useState<{
    userId?: string;
    id: string;
  } | null>(null);
  const selectedVehicleId =
    !isWebPage && vehicleSelection?.userId === user?.id
      ? vehicleSelection?.id
      : undefined;
  const [vehicleOptions, setVehicleOptions] = useState<VehicleWithDetails[]>(
    [],
  );
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [vehiclesError, setVehiclesError] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const vehiclesRequest = useRef(0);
  const vehiclesFocused = useRef(false);
  const loadedScope = useRef<string | undefined>(undefined);
  const [ascending, setAscending] = useState(false);
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
  const fetchRequest = useRef(0);
  const pageRequest = useRef(0);
  const pagePending = useRef(false);
  const fetching = useRef(false);
  const focused = useRef(false);
  const loadedUser = useRef(user?.id);
  const autoExpanded = useRef(new Set<string>());
  const [errors, setErrors] = useState<Partial<Record<LogType, string>>>({});

  // Modal states
  const { confirm } = useDialog();
  const { showSuccess, showError, showWarning } = useToast();
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Bottom sheet states
  const bottomSheetRef = useRef<any>(null);
  const [selectedBottomSheetLog, setSelectedBottomSheetLog] = useState<
    FuelLog | MileageLog | ServiceLog | null
  >(null);
  const [selectedBottomSheetLogType, setSelectedBottomSheetLogType] =
    useState<LogType | null>(null);
  const [bottomSheetCanModify, setBottomSheetCanModify] = useState(false);
  const [bottomSheetCanDelete, setBottomSheetCanDelete] = useState(false);
  const bottomSheetRequest = useRef(0);
  useEffect(() => {
    bottomSheetRequest.current += 1;
    setBottomSheetCanModify(false);
    setBottomSheetCanDelete(false);
  }, [user?.id]);

  const canUserModifyLog = async (log: any): Promise<boolean> => {
    try {
      if (!user) return false;
      return await canUserAccessVehicle(log.vehicle_id, user.id);
    } catch (error) {
      console.error("Error checking modify permission:", error);
      return false;
    }
  };

  // OPTIMIZATION: Fetch initial logs with pagination
  const fetchAllLogs = useCallback(async () => {
    if (!focused.current) return;
    fetching.current = true;
    setRefreshing(true);
    const request = ++fetchRequest.current;
    pageRequest.current++;
    pagePending.current = false;
    setLoadingMore(false);
    try {
      const results = await safePromiseAll(
        [
          MileageLogService.getMileageLogs(selectedVehicleId, {
            limit: PAGE_SIZE,
            offset: 0,
            ascending,
          }),
          FuelLogService.getFuelLogs(selectedVehicleId, {
            limit: PAGE_SIZE,
            offset: 0,
            ascending,
          }) as any,
          ServiceLogService.getServiceLogs(selectedVehicleId, {
            limit: PAGE_SIZE,
            offset: 0,
            ascending,
          }) as any,
        ],
        8000,
      );

      if (request !== fetchRequest.current) return;
      const nextErrors: Partial<Record<LogType, string>> = {};
      const types = ["mileage", "fuel", "service"] as const;
      results.forEach((result, index) => {
        const type = types[index];
        const value = isFulfilled(result)
          ? (result.value as { data?: any[]; error?: string })
          : null;
        if (!value || value.error || !Array.isArray(value.data)) {
          nextErrors[type] = `Couldn't load ${type} logs`;
          return;
        }
        const data = value.data;
        if (type === "mileage") {
          setMileageLogs(data);
          setHasMoreMileage(data.length >= PAGE_SIZE);
          setMileagePage(1);
        } else if (type === "fuel") {
          setFuelLogs(data);
          setHasMoreFuel(data.length >= PAGE_SIZE);
          setFuelPage(1);
        } else {
          setServiceLogs(data);
          setHasMoreService(data.length >= PAGE_SIZE);
          setServicePage(1);
        }
      });
      setErrors(nextErrors);
    } catch {
      if (request !== fetchRequest.current) return;
      setErrors({
        mileage: "Couldn't load mileage logs",
        fuel: "Couldn't load fuel logs",
        service: "Couldn't load service logs",
      });
    } finally {
      if (request === fetchRequest.current) {
        fetching.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [PAGE_SIZE, ascending, selectedVehicleId]);

  const onRefresh = useCallback(async () => {
    if (!focused.current) return;
    setRefreshing(true);
    await fetchAllLogs();
  }, [fetchAllLogs]);

  // OPTIMIZATION: Load more logs for pagination
  const loadMoreLogs = useCallback(
    async (type: LogType) => {
      if (fetching.current || pagePending.current || !focused.current) return;

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

      if (!hasMore || errors[type]) return;

      pagePending.current = true;
      const request = fetchRequest.current;
      const page = ++pageRequest.current;
      setLoadingMore(true);
      try {
        const offset = currentPage * PAGE_SIZE;
        let result;

        switch (type) {
          case "mileage":
            result = await MileageLogService.getMileageLogs(selectedVehicleId, {
              limit: PAGE_SIZE,
              offset,
              ascending,
            });
            break;
          case "fuel":
            result = await FuelLogService.getFuelLogs(selectedVehicleId, {
              limit: PAGE_SIZE,
              offset,
              ascending,
            });
            break;
          case "service":
            result = await ServiceLogService.getServiceLogs(selectedVehicleId, {
              limit: PAGE_SIZE,
              offset,
              ascending,
            });
            break;
        }

        if (
          !focused.current ||
          request !== fetchRequest.current ||
          page !== pageRequest.current
        )
          return;
        if (result?.error || !Array.isArray(result?.data))
          throw new Error("Failed to load more logs");
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
              setHasMoreMileage(result.data.length >= PAGE_SIZE);
              setMileagePage((prev) => prev + 1);
              break;
            case "fuel":
              setFuelLogs((prev) => [...prev, ...(result.data as FuelLog[])]);
              setHasMoreFuel(result.data.length >= PAGE_SIZE);
              setFuelPage((prev) => prev + 1);
              break;
            case "service":
              setServiceLogs((prev) => [
                ...prev,
                ...(result.data as ServiceLog[]),
              ]);
              setHasMoreService(result.data.length >= PAGE_SIZE);
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
      } catch {
        if (
          focused.current &&
          request === fetchRequest.current &&
          page === pageRequest.current
        ) {
          showError(`Couldn't load more ${type} logs. Try Load More again.`);
        }
      } finally {
        if (page === pageRequest.current) {
          pagePending.current = false;
          setLoadingMore(false);
        }
      }
    },
    [
      showError,
      errors,
      selectedVehicleId,
      ascending,
      mileagePage,
      fuelPage,
      servicePage,
      hasMoreMileage,
      hasMoreFuel,
      hasMoreService,
      PAGE_SIZE,
    ],
  );

  const handleDeleteLog = async (
    type: LogType,
    id: string,
    description: string,
    canDelete: boolean,
  ) => {
    if (!canDelete || deleteLoading) return;
    const log = (
      type === "mileage"
        ? mileageLogs
        : type === "fuel"
          ? fuelLogs
          : serviceLogs
    ).find((item) => item.id === id);
    if (!log || isAutoMileageLog(type, log)) return;
    const vehicleOwnerId = (log as { vehicles?: { user_id?: string } }).vehicles
      ?.user_id;
    if (type === "service" && (!user?.id || vehicleOwnerId !== user.id)) return;
    const ok = await confirm({
      title: "Delete Log",
      message: `Are you sure you want to delete this ${type} log?\n\n${description}`,
      confirmText: "Delete",
      destructive: true,
    });
    if (!ok) return;

    setDeleteLoading(true);
    try {
      let result;
      switch (type) {
        case "mileage":
          result = await MileageLogService.deleteMileageLog(id);
          break;
        case "fuel":
          result = await FuelLogService.deleteFuelLog(id);
          break;
        case "service":
          result = await ServiceLogService.deleteServiceLog(id);
          break;
      }

      if (result?.error) {
        let errorMessage = result.error;
        if (
          result.error.includes("not found") ||
          result.error.includes("Log not found")
        ) {
          errorMessage = `This ${type} log no longer exists. It may have been deleted by another user.`;
        } else if (result.error === "PERMISSION_DENIED_SHARED_VEHICLE") {
          errorMessage = `This ${type} log belongs to a shared vehicle. You can view it but cannot modify or delete it.`;
        } else if (result.error === "PERMISSION_DENIED_ACCESS") {
          errorMessage = `You do not have permission to delete this ${type} log.`;
        } else if (
          result.error.includes("Access denied") ||
          result.error.includes("not authenticated")
        ) {
          errorMessage = `You do not have permission to delete this ${type} log.`;
        } else if (result.error.includes("Failed to delete")) {
          errorMessage = `Unable to delete ${type} log. Please check your internet connection and try again.`;
        }

        showError("Couldn't delete log", { message: errorMessage });
        await fetchAllLogs();
      } else if (result?.data === true) {
        await fetchAllLogs();
        showSuccess(`${type} log deleted successfully`);
      } else {
        showWarning("Delete status unclear", {
          message: `Couldn't confirm the ${type} log was deleted. Check the log list.`,
        });
        await fetchAllLogs();
      }
    } finally {
      setDeleteLoading(false);
    }
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
    if (layout.isWeb) {
      if (logType === "service") handleViewServiceDetail(log.id);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const request = ++bottomSheetRequest.current;
    setBottomSheetCanModify(false);
    setBottomSheetCanDelete(false);
    const canModify =
      (await canUserModifyLog(log)) && !isAutoMileageLog(logType, log);
    if (request !== bottomSheetRequest.current) return;
    const vehicleOwnerId = (log as { vehicles?: { user_id?: string } }).vehicles
      ?.user_id;
    setBottomSheetCanDelete(
      canModify &&
        (logType !== "service" || (!!user?.id && vehicleOwnerId === user.id)),
    );
    setSelectedBottomSheetLog(log);
    setSelectedBottomSheetLogType(logType);
    setBottomSheetCanModify(canModify);
    bottomSheetRef.current?.expand();
  };

  const handleCloseBottomSheet = () => {
    bottomSheetRequest.current += 1;
    setBottomSheetCanModify(false);
    setBottomSheetCanDelete(false);
    bottomSheetRef.current?.close();
  };

  const handleBottomSheetEdit = (type: LogType, id: string) => {
    if (!bottomSheetCanModify || isAutoMileageLog(type, selectedBottomSheetLog))
      return;
    handleCloseBottomSheet();
    handleEditLog(type, id);
  };

  const handleBottomSheetDelete = (
    type: LogType,
    id: string,
    description: string,
  ) => {
    handleCloseBottomSheet();
    handleDeleteLog(type, id, description, bottomSheetCanDelete);
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

  const fetchVehicles = useCallback(async () => {
    if (isWebPage || !vehiclesFocused.current) return;
    const request = ++vehiclesRequest.current;
    setVehiclesLoading(true);
    try {
      const result = await VehicleService.getVehiclesSeparated();
      if (request !== vehiclesRequest.current || !vehiclesFocused.current)
        return;
      if (result.error || !result.data)
        throw new Error("Vehicle list unavailable");
      const vehicles = [
        ...result.data.ownVehicles,
        ...result.data.sharedVehicles,
      ];
      setVehicleOptions(vehicles);
      setVehiclesError(null);
      setVehicleSelection((prev) =>
        prev &&
        prev.userId === user?.id &&
        vehicles.some((v) => v.id === prev.id)
          ? prev
          : null,
      );
    } catch {
      if (request === vehiclesRequest.current && vehiclesFocused.current)
        setVehiclesError("Couldn't load vehicles");
    } finally {
      if (request === vehiclesRequest.current && vehiclesFocused.current)
        setVehiclesLoading(false);
    }
  }, [isWebPage, user?.id]);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      const accountChanged = loadedUser.current !== user?.id;
      const scope = `${user?.id || ""}:${selectedVehicleId || "all"}:${isWebPage}`;
      if (accountChanged || loadedScope.current !== scope) {
        loadedScope.current = scope;
        loadedUser.current = user?.id;
        setMileageLogs([]);
        setFuelLogs([]);
        setServiceLogs([]);
        setExpandedVehicles(new Set());
        autoExpanded.current.clear();
        setShowAllLogsForVehicle(new Set());
        setErrors({});
        setLoading(true);
      }
      if (accountChanged) {
        setVehicleOptions([]);
        setVehicleSelection(null);
        setVehiclesError(null);
      }
      void fetchAllLogs();
      return () => {
        focused.current = false;
        fetching.current = false;
        fetchRequest.current++;
        pageRequest.current++;
        pagePending.current = false;
        bottomSheetRequest.current++;
        bottomSheetRef.current?.close();
      };
    }, [fetchAllLogs, user?.id, selectedVehicleId, isWebPage]),
  );

  useFocusEffect(
    useCallback(() => {
      vehiclesFocused.current = true;
      void fetchVehicles();
      return () => {
        vehiclesFocused.current = false;
        vehiclesRequest.current++;
        setPickerVisible(false);
      };
    }, [fetchVehicles]),
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
  }) =>
    isWebPage ? (
      <WebFilterButton
        label={label}
        selected={activeTab === type}
        onPress={() => setActiveTab(type)}
        icon={icon as React.ComponentProps<typeof IconSymbol>["name"]}
      />
    ) : (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: activeTab === type }}
        style={{
          minHeight: 48,
          maxWidth: "100%",
          flexGrow: 1,
          flexBasis: 88,
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
            flexShrink: 1,
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
          minHeight: 48,
          paddingHorizontal: 0,
          paddingVertical: theme.spacing.lg,
          backgroundColor: theme.colors.background,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          marginTop: theme.spacing.md,
          ...(isWebPage && {
            paddingHorizontal: 0,
            paddingTop: 0,
            paddingBottom: theme.spacing.xl,
            marginTop: 0,
            backgroundColor: theme.colors.surface,
            borderBottomWidth: isExpanded ? 1 : 0,
          }),
        }}
        accessibilityRole="button"
        accessibilityLabel={`${isWebPage ? "" : isExpanded ? "Collapse " : "Expand "}${vehicle?.year} ${vehicle?.make} ${vehicle?.model} logs`}
        accessibilityState={{ expanded: isExpanded }}
        onPress={() => toggleVehicle(vehicleId)}
        activeOpacity={0.7}
      >
        {vehicle?.main_image_url && !imageError ? (
          <Image
            source={{
              uri: storageImageUrl("vehicle-images", vehicle.main_image_url),
            }}
            style={{
              width: isWebPage ? 64 : 36,
              height: isWebPage ? 64 : 36,
              borderRadius: isWebPage ? 32 : 18,
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
              width: isWebPage ? 64 : 36,
              height: isWebPage ? 64 : 36,
              borderRadius: isWebPage ? 32 : 18,
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

        <View style={{ flex: 1, minWidth: 0 }}>
          <View
            style={{
              flexDirection: isWebPage ? "row" : "column",
              alignItems: isWebPage ? "center" : "flex-start",
              gap: 8,
              justifyContent: "space-between",
              marginBottom: spacing.xs,
            }}
          >
            <Text
              style={{
                fontSize: isWebPage ? theme.fontSize.xl : theme.fontSize.lg,
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
                  backgroundColor: withOpacity(theme.colors.primary, 0.08),
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
              flexWrap: "wrap",
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
                color: withOpacity(theme.colors.textSecondary, 0.25),
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
                color: withOpacity(theme.colors.textSecondary, 0.25),
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
              {isWebPage ? "Last log: " : ""}
              {formatDate(latestLogDate)}
            </Text>
          </View>
        </View>

        <View
          pointerEvents="none"
          style={
            !isWebPage
              ? {
                  width: 48,
                  height: 48,
                  marginLeft: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: 12,
                  backgroundColor: theme.colors.surface,
                }
              : undefined
          }
        >
          <IconSymbol
            name={isExpanded ? "chevron.up" : "chevron.down"}
            size={20}
            color={theme.colors.textSecondary}
          />
        </View>
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
  const LogCard = ({
    log,
    type,
    last,
    first,
  }: {
    log: any;
    type: LogType;
    last: boolean;
    first: boolean;
  }) => {
    const [permission, setPermission] = useState<{
      log: object;
      userId?: string;
      allowed: boolean;
    } | null>(null);
    const canModify =
      !!permission &&
      permission.log === log &&
      permission.userId === user?.id &&
      permission.allowed;
    const canDelete =
      canModify &&
      (type !== "service" || (!!user?.id && log.vehicles?.user_id === user.id));

    React.useEffect(() => {
      let active = true;
      setPermission(null);
      canUserModifyLog(log).then((allowed) => {
        if (active) setPermission({ log, userId: user?.id, allowed });
      });
      return () => {
        active = false;
      };
      // Permission checks only depend on the log and signed-in identity.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [log, user?.id]);

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

    // Auto mileage logs mirror that day's fuel logs (database trigger) and
    // are read-only: change the fuel log instead.
    const actionMenuItems: ActionMenuItem[] = isAutoMileageLog(type, log)
      ? [
          {
            label:
              "Created from fuel logs. Edit or delete the fuel log instead.",
            icon: "info.circle",
            onPress: () => {},
            disabled: true,
          },
        ]
      : [
          {
            label: "Edit",
            icon: "pencil",
            onPress: () => {
              if (canModify) handleEditLog(type, log.id);
            },
            disabled: !canModify || deleteLoading,
          },
          {
            label: "Delete",
            icon: "trash",
            onPress: () =>
              handleDeleteLog(type, log.id, details.title, canDelete),
            variant: "danger",
            disabled: !canDelete || deleteLoading,
          },
        ];

    if (isWebPage) {
      return (
        <TouchableOpacity
          accessibilityRole="button"
          style={[
            web.logRow,
            {
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.lg,
              minHeight: 116,
            },
          ]}
          onPress={() => handleOpenLogDetails(log, type)}
          activeOpacity={0.7}
        >
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 32,
              top: first ? theme.spacing.lg + 24 : 0,
              bottom: last ? undefined : 0,
              height: last ? (first ? 0 : theme.spacing.lg + 24) : undefined,
              width: 1,
              backgroundColor: theme.colors.border,
            }}
          />
          <View
            style={{
              width: 64,
              alignSelf: "stretch",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: theme.colors.background,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconSymbol
                name={details.icon as any}
                size={24}
                color={details.color}
              />
            </View>
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: theme.spacing.xs }}>
            <Text
              style={{
                fontSize: theme.fontSize.xl,
                fontWeight: theme.fontWeight.semibold,
                color: theme.colors.text,
              }}
            >
              {details.title}
            </Text>
            {details.parsedItems?.length ? (
              details.parsedItems.map((item: any, index: number) => (
                <Text key={index} style={{ color: theme.colors.textSecondary }}>
                  {item.description} RM{item.price}
                </Text>
              ))
            ) : (
              <Text
                style={{
                  fontSize: theme.fontSize.base,
                  color: theme.colors.textSecondary,
                }}
              >
                {details.subtitle}
              </Text>
            )}
            {details.odometer && (
              <Text
                style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textSecondary,
                }}
              >
                {details.odometer}
              </Text>
            )}
            {type === "service" && (
              <Text
                style={{
                  color: theme.colors.text,
                  fontWeight: theme.fontWeight.semibold,
                }}
              >
                Total: RM{details.cost?.toFixed(2)}
              </Text>
            )}
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.sm,
              width: layout.isDesktop ? 220 : 140,
            }}
          >
            <IconSymbol
              name="calendar"
              size={18}
              color={theme.colors.textSecondary}
            />
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.fontSize.sm,
              }}
            >
              {formatDate(log.date)}
            </Text>
          </View>
          <View style={{ width: 24, alignItems: "center" }}>
            {details.hasReceipt && (
              <ServiceReceiptIndicator
                hasReceipt
                receiptUrl={details.receiptUrl}
                onPress={() => handleViewServiceDetail(log.id)}
                size={18}
              />
            )}
          </View>
          <ActionMenu items={actionMenuItems} vertical />
        </TouchableOpacity>
      );
    }

    return (
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: theme.colors.border,
          gap: 12,
        }}
      >
        <View
          style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}
        >
          <TouchableOpacity
            accessibilityRole={
              !layout.isWeb || type === "service" ? "button" : undefined
            }
            accessible={!layout.isWeb || type === "service"}
            accessibilityLabel={
              !layout.isWeb || type === "service"
                ? `View ${type} log details`
                : undefined
            }
            onPress={
              !layout.isWeb || type === "service"
                ? () => handleOpenLogDetails(log, type)
                : undefined
            }
            activeOpacity={layout.isWeb && type !== "service" ? 1 : 0.7}
            style={{ flex: 1, minWidth: 0, minHeight: 48, gap: 6 }}
          >
            <Text
              style={{
                color: theme.colors.text,
                fontSize: theme.fontSize.lg,
                fontWeight: theme.fontWeight.semibold,
              }}
            >
              {details.title}
            </Text>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.fontSize.sm,
              }}
            >
              {formatDate(log.date)}
            </Text>
          </TouchableOpacity>
          <ActionMenu
            items={actionMenuItems}
            vertical
            minTouchSize={48}
            accessibilityLabel={`${type} log actions`}
            disabled={deleteLoading}
          />
        </View>
        {details.parsedItems?.length ? (
          details.parsedItems.map((item: any, index: number) => (
            <Text key={index} style={{ color: theme.colors.text }}>
              {item.description} RM{item.price}
            </Text>
          ))
        ) : (
          <Text style={{ color: theme.colors.textSecondary }}>
            {details.subtitle}
          </Text>
        )}
        {details.odometer && (
          <Text style={{ color: theme.colors.textSecondary }}>
            {details.odometer}
          </Text>
        )}
        {type === "service" && (
          <Text
            style={{
              color: theme.colors.text,
              fontWeight: theme.fontWeight.semibold,
            }}
          >
            Total: RM{details.cost?.toFixed(2)}
          </Text>
        )}
        {details.hasReceipt && (
          <Button
            title="View receipt"
            variant="outline"
            style={{ minHeight: 48 }}
            onPress={() => handleViewServiceDetail(log.id)}
          />
        )}
      </View>
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
        (a, b) =>
          (new Date(b.date).getTime() - new Date(a.date).getTime()) *
          (ascending ? -1 : 1),
      );
    });

    return grouped;
  }, [getCurrentLogs, ascending]);

  // Desktop expands new groups; compact history always starts closed.
  useEffect(() => {
    if (loading || !isWebPage) return;
    const newIds = Object.keys(getGroupedLogsByVehicle()).filter(
      (id) => !autoExpanded.current.has(id),
    );
    if (newIds.length) {
      newIds.forEach((id) => autoExpanded.current.add(id));
      setExpandedVehicles((prev) => new Set([...prev, ...newIds]));
    }
  }, [loading, isWebPage, getGroupedLogsByVehicle]);

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

  const currentLogs = getCurrentLogs();
  const groupedLogs = getGroupedLogsByVehicle();
  const sortItems: ActionMenuItem[] = [
    {
      label: "Newest first",
      icon: "calendar",
      onPress: () => setAscending(false),
    },
    {
      label: "Oldest first",
      icon: "calendar",
      onPress: () => setAscending(true),
    },
  ];

  const toolbar = (
    <View style={isWebPage ? web.toolbar : { gap: 12, marginBottom: 16 }}>
      <View
        style={
          isWebPage
            ? web.filters
            : { flexDirection: "row", flexWrap: "wrap", gap: 8 }
        }
      >
        <TabButton type="mileage" label="Mileage" icon="speedometer" />
        <TabButton type="fuel" label="Fuel" icon="fuelpump" />
        <TabButton type="service" label="Service" icon="wrench" />
      </View>
      {!isWebPage && (
        <LogVehicleFilter
          vehicles={vehicleOptions}
          selectedId={selectedVehicleId}
          onSelect={(id) =>
            setVehicleSelection(id ? { userId: user?.id, id } : null)
          }
          loading={vehiclesLoading}
          error={vehiclesError}
          onRetry={fetchVehicles}
          visible={pickerVisible}
          onOpen={() => setPickerVisible(true)}
          onClose={() => setPickerVisible(false)}
        />
      )}
      <View
        style={
          isWebPage
            ? web.filters
            : { flexDirection: "row", alignItems: "stretch", gap: 8 }
        }
      >
        <ActionMenu
          items={sortItems}
          disabled={loading || loadingMore || refreshing}
          label={`Sort by date (${ascending ? "oldest" : "newest"})`}
          minTouchSize={isWebPage ? undefined : 48}
          style={
            !isWebPage
              ? { flex: 1, minWidth: 0, justifyContent: "center" }
              : undefined
          }
        />
        <Button
          title={`Add ${activeTab} log`}
          icon="plus"
          style={
            !isWebPage ? { flex: 1, minWidth: 0, minHeight: 48 } : undefined
          }
          onPress={() => {
            const vehicleId =
              selectedVehicleId ||
              (!isWebPage && vehicleOptions.length === 1
                ? vehicleOptions[0].id
                : undefined);
            router.push(
              vehicleId
                ? {
                    pathname: getAddRoute() as any,
                    params: { vehicleId, returnTo: "logs" },
                  }
                : (getAddRoute() as any),
            );
          }}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <MaxWidthContainer
        fullWidth={isWebPage}
        style={isWebPage ? web.frame : undefined}
      >
        {isWebPage && toolbar}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={
            !isWebPage
              ? { paddingHorizontal: 16, paddingBottom: 24 }
              : undefined
          }
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {!isWebPage && (
            <MobilePageHeader
              title="Logs"
              subtitle="Track mileage, fuel, and service history"
            />
          )}
          {!isWebPage && toolbar}
          {errors[activeTab] && (
            <View
              style={{
                padding: 16,
                gap: 12,
                marginBottom: 16,
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.lg,
              }}
            >
              <Text style={{ color: theme.colors.text }}>
                {errors[activeTab]}
              </Text>
              <Button
                title="Retry"
                variant="outline"
                loading={refreshing}
                style={{ minHeight: 48 }}
                onPress={onRefresh}
              />
            </View>
          )}
          {loading ? (
            <SkeletonLogList itemCount={5} />
          ) : errors[activeTab] &&
            currentLogs.length === 0 ? null : currentLogs.length === 0 ? (
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
            </View>
          ) : (
            <>
              {Object.entries(groupedLogs).map(
                ([vehicleId, { vehicle, logs }]) => {
                  const isSharedVehicle =
                    logs.length > 0 && (logs[0].is_shared_vehicle || false);
                  const isExpanded = expandedVehicles.has(vehicleId);
                  const showAll = showAllLogsForVehicle.has(vehicleId);
                  const displayedLogs = showAll ? logs : logs.slice(0, 3);
                  const hasMoreLogs = logs.length > 3;

                  return (
                    <View
                      key={vehicleId}
                      style={
                        isWebPage
                          ? [
                              web.panel,
                              {
                                padding: theme.spacing.xl,
                                marginHorizontal: theme.spacing.xl,
                                marginBottom: theme.spacing.xl,
                              },
                            ]
                          : { marginBottom: 16 }
                      }
                    >
                      <VehicleHeader
                        vehicle={vehicle}
                        isSharedVehicle={isSharedVehicle}
                        vehicleId={vehicleId}
                        logsCount={logs.length}
                        latestLogDate={logs.reduce(
                          (latest, log) =>
                            log.date > latest ? log.date : latest,
                          logs[0].date,
                        )}
                      />
                      {isExpanded && (
                        <View
                          style={{
                            paddingHorizontal: 0,
                            paddingBottom: theme.spacing.sm,
                          }}
                        >
                          {displayedLogs.map((log, index) => (
                            <LogCard
                              key={log.id}
                              log={log}
                              type={activeTab}
                              first={index === 0}
                              last={index === displayedLogs.length - 1}
                            />
                          ))}
                          {hasMoreLogs && !showAll && (
                            <TouchableOpacity
                              style={{
                                backgroundColor: theme.colors.surface,
                                borderRadius: theme.borderRadius.lg,
                                padding: theme.spacing.md,
                                minHeight: 48,
                                marginBottom: theme.spacing.md,
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                                alignItems: "center",
                                flexDirection: "row",
                                justifyContent: "center",
                                gap: theme.spacing.sm,
                                ...(isWebPage && {
                                  flexDirection: "row-reverse",
                                  marginTop: theme.spacing.md,
                                }),
                              }}
                              accessibilityRole="button"
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
                                minHeight: 48,
                                marginBottom: theme.spacing.md,
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                                alignItems: "center",
                                flexDirection: "row",
                                justifyContent: "center",
                                gap: theme.spacing.sm,
                                ...(isWebPage && {
                                  flexDirection: "row-reverse",
                                  marginTop: theme.spacing.md,
                                }),
                              }}
                              accessibilityRole="button"
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
                    accessibilityRole="button"
                    accessibilityLabel="Load More Logs"
                    onPress={() => loadMoreLogs(activeTab)}
                    disabled={loadingMore || refreshing || !!errors[activeTab]}
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
            </>
          )}
        </ScrollView>

        {Platform.OS !== "web" && LogDetailsBottomSheet && (
          <LogDetailsBottomSheet
            ref={bottomSheetRef}
            log={selectedBottomSheetLog}
            logType={selectedBottomSheetLogType}
            canModify={bottomSheetCanModify}
            canDelete={bottomSheetCanDelete}
            onClose={handleCloseBottomSheet}
            onEdit={handleBottomSheetEdit}
            onDelete={handleBottomSheetDelete}
          />
        )}
      </MaxWidthContainer>
    </SafeAreaView>
  );
}
