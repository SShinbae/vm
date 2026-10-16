import { goBack } from "@/lib/utils/goBack";
import { storageImageUrl } from "@/lib/utils/storagePath";
import { baseColors, withOpacity, spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import { ActionMenu, ActionMenuItem } from "@/components/ui/ActionMenu";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { VehicleGroupSelector } from "@/components/VehicleGroupSelector";
import { Group } from "@/types";
import { Pagination } from "@/components/ui/Pagination";
import { ServiceReceiptIndicator } from "@/components/ui/ReceiptViewer";
import { SkeletonVehicleDetail } from "@/components/ui/Skeleton";
import { toast, useToast } from "@/hooks/useToast";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useDialog } from "@/lib/contexts/DialogContext";
import {
  FuelLogService,
  MileageLogService,
  isAutoMileageLog,
  ServiceLogService,
} from "@/lib/services/loggingService";
import { VehicleService } from "@/lib/services/vehicleService";
import { formatDate, formatDateWithPrefix } from "@/lib/utils/dateUtils";
import {
  canUserAccessVehicle,
  formatServiceItems,
} from "@/lib/utils/serviceUtils";
import { VehicleWithDetails } from "@/types/database-v2";
import { Image } from "expo-image";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import Head from "expo-router/head";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { DashboardWebLayout } from "@/components/layout/DashboardWebLayout";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  webPageStyles,
  WEB_PAGE_MAX_WIDTH,
} from "@/components/layout/webPageStyles";
import { MetricCard } from "@/components/analytics/MetricCard";
import { WebFilterButton } from "@/components/ui/WebFilterButton";
import { Button } from "@/components/ui/Button";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type LogTab = "mileage" | "fuel" | "service";

export default function VehicleDetailScreen() {
  return (
    <DashboardWebLayout>
      <VehicleDetailContent />
    </DashboardWebLayout>
  );
}

function VehicleDetailContent() {
  const { id, returnTo } = useLocalSearchParams<{
    id: string;
    returnTo?: string;
  }>();
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState<VehicleWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [currentShares, setCurrentShares] = useState<Group[]>([]);
  const [imageError, setImageError] = useState(false);
  const [activeTab, setActiveTab] = useState<LogTab>("mileage");
  const [sharingExpanded, setSharingExpanded] = useState(false);
  const layout = useResponsiveLayout();
  const isWeb = layout.isWeb;
  const isDesktopWeb = isWeb && !layout.isMobile;
  const isMobile = !isDesktopWeb;
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const singleColumn =
    width - insets.left - insets.right - 32 < 328 || fontScale >= 1.3;
  const userId = user?.id;
  const focused = useRef(false);
  const requestId = useRef(0);
  const loadedId = useRef<string | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Pagination states
  const [mileageCurrentPage, setMileageCurrentPage] = useState(1);
  const [fuelCurrentPage, setFuelCurrentPage] = useState(1);
  const [serviceCurrentPage, setServiceCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Deletion states
  const { confirm } = useDialog();
  const { showSuccess, showError } = useToast();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteLogLoading, setDeleteLogLoading] = useState(false);
  const [canModify, setCanModify] = useState(false);
  const { theme } = useStyles();
  const colors = theme.colors;
  const { styles: web } = useStyles(webPageStyles);

  const fetchVehicleData = useCallback(async () => {
    if (!id || !focused.current) return;
    const currentRequest = ++requestId.current;
    setCanModify(false);
    try {
      const result = await VehicleService.getVehicleById(id);
      if (!focused.current || currentRequest !== requestId.current) return;
      if (result.error || !result.data)
        throw new Error(result.error || "Vehicle not found");
      setVehicle(result.data);
      setLoadError(null);
      const canAccess = userId ? await canUserAccessVehicle(id, userId) : false;
      if (!focused.current || currentRequest !== requestId.current) return;
      setCanModify(canAccess);
    } catch {
      if (!focused.current || currentRequest !== requestId.current) return;
      setLoadError("Failed to load vehicle details");
      toast.error("Failed to load vehicle details");
    } finally {
      if (focused.current && currentRequest === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [id, userId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVehicleData();
  }, [fetchVehicleData]);

  const handleDelete = async () => {
    if (!vehicle?.is_own_vehicle || deleteLoading) return;
    const ok = await confirm({
      title: "Delete Vehicle",
      message: `Are you sure you want to delete ${vehicle.year} ${vehicle.make} ${vehicle.model}? This action cannot be undone and will delete all associated logs.`,
      confirmText: "Delete",
      destructive: true,
    });
    if (!ok) return;

    setDeleteLoading(true);
    try {
      const { error } = await VehicleService.deleteVehicle(vehicle.id);
      if (error) {
        showError("Failed to delete vehicle");
      } else {
        if (isDesktopWeb) router.replace("/vehicles");
        else goBack("/vehicles");
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteLog = async (
    type: LogTab,
    logId: string,
    description: string,
  ) => {
    if (!canModify || deleteLogLoading) return;
    if (type === "service" && (!user?.id || vehicle?.user_id !== user.id))
      return;
    const log = (
      type === "mileage"
        ? vehicle?.mileage_logs
        : type === "fuel"
          ? vehicle?.fuel_logs
          : vehicle?.service_logs
    )?.find((item) => item.id === logId);
    if (!log || isAutoMileageLog(type, log)) return;
    const ok = await confirm({
      title: `Delete ${type} Log`,
      message: `Are you sure you want to delete this ${type} log?\n\n${description}\n\nThis action cannot be undone.`,
      confirmText: "Delete",
      destructive: true,
    });
    if (!ok) return;

    setDeleteLogLoading(true);
    try {
      let result;
      switch (type) {
        case "mileage":
          result = await MileageLogService.deleteMileageLog(logId);
          break;
        case "fuel":
          result = await FuelLogService.deleteFuelLog(logId);
          break;
        case "service":
          result = await ServiceLogService.deleteServiceLog(logId);
          break;
      }

      if (result?.error) {
        showError("Couldn't delete log", { message: result.error });
      } else {
        showSuccess(`${type} log deleted successfully`);
        await fetchVehicleData(); // Refresh the vehicle data
      }
    } finally {
      setDeleteLogLoading(false);
    }
  };

  const handleEditLog = (type: LogTab, id: string) => {
    if (!canModify) return;
    switch (type) {
      case "mileage":
        router.push(`/logs/mileage/${id}/edit` as any);
        break;
      case "fuel":
        router.push(`/logs/fuel/${id}/edit` as any);
        break;
      case "service":
        router.push(`/logs/service/${id}` as any);
        break;
    }
  };

  const handleAddLog = () => {
    if (!vehicle || !canModify) return;
    router.push({
      pathname: `/logs/${activeTab}/add`,
      params: {
        vehicleId: vehicle.id,
        ...(returnTo === "vehicles" ? { returnTo } : {}),
      },
    });
  };

  const openSharingModal = async () => {
    if (!vehicle?.is_own_vehicle) return;
    const { data, error } = await VehicleService.getVehicleSharingConfig(
      vehicle.id,
    );
    if (error) {
      showError("Couldn't load vehicle sharing", { message: error });
      return;
    }
    setCurrentShares(
      (data?.shared_groups ?? []).map(
        (s) => ({ id: s.group_id, name: s.group_name }) as Group,
      ),
    );
    setShowSharingModal(true);
  };

  const handleSharingUpdate = async (success: boolean) => {
    setShowSharingModal(false);
    if (success) await fetchVehicleData();
  };

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      if (loadedId.current !== id) {
        loadedId.current = id;
        setVehicle(null);
        setLoading(true);
        setLoadError(null);
        setImageError(false);
      }
      void fetchVehicleData();
      return () => {
        focused.current = false;
        requestId.current += 1;
      };
    }, [id, fetchVehicleData]),
  );

  useEffect(() => setImageError(false), [vehicle?.main_image_url]);

  // Reset pagination when switching tabs
  useEffect(() => {
    setMileageCurrentPage(1);
    setFuelCurrentPage(1);
    setServiceCurrentPage(1);
  }, [activeTab]);

  const vehicleName =
    vehicle?.id === id
      ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
      : "Vehicle";
  const breadcrumbs = (
    <Breadcrumbs
      items={[{ label: "Vehicles", href: "/vehicles" }, { label: vehicleName }]}
    />
  );

  const StatCard = ({ title, value, subtitle, icon, gradient = false }: any) =>
    isDesktopWeb ? (
      <View
        style={{
          flexBasis: layout.isTablet ? "47%" : "22%",
          flexGrow: 1,
          minWidth: 160,
        }}
      >
        <MetricCard title={title} value={value} subtitle={subtitle} />
      </View>
    ) : (
      <View
        style={[
          styles.statCard,
          isDesktopWeb && styles.statCardWeb,
          gradient && styles.statCardGradient,
        ]}
      >
        <View style={styles.statCardHeader}>
          <View style={[styles.statIcon, gradient && styles.statIconGradient]}>
            <IconSymbol
              name={icon}
              size={isDesktopWeb ? 24 : 20}
              color={gradient ? theme.colors.white : colors.primary}
            />
          </View>
          {isDesktopWeb && subtitle && (
            <View style={styles.statTrend}>
              <IconSymbol
                name="arrow.up.right"
                size={12}
                color={colors.success}
              />
            </View>
          )}
        </View>
        <View style={styles.statContent}>
          <Text style={[styles.statValue, gradient && styles.statValueLight]}>
            {value}
          </Text>
          <Text style={[styles.statTitle, gradient && styles.statTitleLight]}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.statSubtitle,
                gradient && styles.statSubtitleLight,
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    );

  const TabButton = ({ label, icon, isActive, onPress }: any) =>
    isDesktopWeb ? (
      <WebFilterButton label={label} selected={isActive} onPress={onPress} />
    ) : (
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.tabButtonActive]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: isActive }}
      >
        <IconSymbol
          name={icon}
          size={isDesktopWeb ? 18 : 16}
          color={isActive ? colors.primary : colors.textSecondary}
        />
        <Text
          style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}
        >
          {label}
        </Text>
        {isActive && <View style={styles.tabIndicator} />}
      </TouchableOpacity>
    );

  // Slice an array to the current page worth of items
  const getPaginatedItems = (items: any[], currentPage: number) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return items.slice(startIndex, endIndex);
  };

  const LogItem = ({
    log,
    icon,
    isServiceLog = false,
    isFuelLog = false,
    isMileageLog = false,
    showDate = true,
  }: any) => {
    const getLogText = () => {
      if (isServiceLog) {
        return log.service_type?.replace("_", " ").toUpperCase() || "Service";
      }
      return `${log.odometer_reading?.toLocaleString()} km`;
    };

    const getLogSubtext = () => {
      if (isServiceLog) {
        const formattedDescription = formatServiceItems(log.description);
        return `${formattedDescription}${log.cost ? ` • RM${log.cost}` : ""}`;
      }
      return log.liters_filled ? `${log.liters_filled}L filled` : "";
    };

    const handlePress = () => {
      if (isServiceLog) {
        router.push(`/logs/service/${log.id}` as any);
      }
    };

    const logType: LogTab = isServiceLog
      ? "service"
      : isFuelLog
        ? "fuel"
        : "mileage";

    // Auto mileage logs mirror that day's fuel logs (database trigger) and
    // are read-only: change the fuel log instead.
    const actionMenuItems: ActionMenuItem[] = isAutoMileageLog(logType, log)
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
            onPress: () => handleEditLog(logType, log.id),
            disabled: !canModify || deleteLogLoading,
          },
          {
            label: "Delete",
            icon: "trash",
            onPress: () => handleDeleteLog(logType, log.id, getLogText()),
            variant: "danger",
            disabled:
              !canModify ||
              deleteLogLoading ||
              (logType === "service" &&
                (!user?.id || vehicle?.user_id !== user.id)),
          },
        ];

    if (isDesktopWeb) {
      return (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            gap: theme.spacing.md,
            paddingVertical: theme.spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity
            accessibilityRole={isServiceLog ? "button" : undefined}
            onPress={handlePress}
            disabled={!isServiceLog}
            style={{ flex: 1, minWidth: 180 }}
          >
            <Text
              style={{
                color: colors.text,
                fontWeight: "600",
                fontSize: theme.fontSize.base,
              }}
            >
              {getLogText()}
            </Text>
            {!!getLogSubtext() && (
              <Text
                style={{
                  color: colors.textSecondary,
                  marginTop: theme.spacing.xs,
                }}
              >
                {getLogSubtext()}
              </Text>
            )}
          </TouchableOpacity>
          <Text style={{ color: colors.textSecondary, width: 120 }}>
            {formatDate(log.date || log.created_at)}
          </Text>
          <View style={{ width: 28 }}>
            {isServiceLog && log.receipt_image_url && (
              <ServiceReceiptIndicator
                hasReceipt
                receiptUrl={log.receipt_image_url}
                onPress={handlePress}
                size={16}
              />
            )}
          </View>
          <ActionMenu items={actionMenuItems} disabled={deleteLogLoading} />
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.logItem, isDesktopWeb && styles.logItemWeb]}
        onPress={handlePress}
        disabled={!isServiceLog}
        activeOpacity={isServiceLog ? 0.7 : 1}
      >
        <View style={styles.logItemLeftBorder} />
        <View style={[styles.logIcon, isDesktopWeb && styles.logIconWeb]}>
          <IconSymbol
            name={icon}
            size={isDesktopWeb ? 20 : 16}
            color={colors.primary}
          />
        </View>
        <View style={styles.logContent}>
          <View style={styles.logTextRow}>
            <Text style={[styles.logText, isDesktopWeb && styles.logTextWeb]}>
              {getLogText()}
            </Text>
            {isServiceLog && log.receipt_image_url && (
              <ServiceReceiptIndicator
                hasReceipt={!!log.receipt_image_url}
                receiptUrl={log.receipt_image_url}
                onPress={handlePress}
                size={16}
              />
            )}
          </View>
          {getLogSubtext() && (
            <Text
              style={[styles.logSubtext, isDesktopWeb && styles.logSubtextWeb]}
            >
              {getLogSubtext()}
            </Text>
          )}
          {showDate && (
            <Text style={[styles.logDate, isDesktopWeb && styles.logDateWeb]}>
              {formatDate(log.date || log.created_at)}
            </Text>
          )}
        </View>
        <View style={{ marginLeft: spacing.sm, flexShrink: 0 }}>
          <ActionMenu
            items={actionMenuItems}
            minTouchSize={48}
            disabled={deleteLogLoading}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorText: {
      fontSize: 16,
      color: colors.text,
      textAlign: "center",
      marginTop: spacing.xxxl,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: isDesktopWeb ? 60 : 16,
    },
    compactSummary: {
      marginHorizontal: 16,
      marginTop: 16,
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    compactHeader: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 12,
    },
    compactImage: { width: 80, height: 64, borderRadius: 8 },
    compactInfo: { flex: 1, minWidth: 140, gap: 6 },
    compactName: { color: colors.text, fontSize: 20, fontWeight: "600" },
    compactMeta: { color: colors.textSecondary, fontSize: 14, flexShrink: 1 },
    compactActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
    },
    // Content Container
    webFrame: {
      width: "100%",
      maxWidth: WEB_PAGE_MAX_WIDTH,
      alignSelf: "center",
      flexShrink: 0,
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.lg,
    },
    contentContainer: {
      maxWidth: isDesktopWeb ? WEB_PAGE_MAX_WIDTH : undefined,
      width: "100%",
      alignSelf: "center",
      padding: isDesktopWeb ? theme.spacing.xl : 16,
      paddingTop: isDesktopWeb ? theme.spacing.lg : 16,
    },
    // Sharing Section
    sharingCard: {
      backgroundColor: colors.surface,
      borderRadius: isDesktopWeb ? 16 : 12,
      padding: isDesktopWeb ? 24 : 16,
      marginBottom: isDesktopWeb ? 32 : 18,
      borderWidth: 1,
      borderColor: colors.border,
      ...(isDesktopWeb && {
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      }),
    },
    sharingHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sharingLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    sharingIcon: {
      width: isDesktopWeb ? 48 : 38,
      height: isDesktopWeb ? 48 : 38,
      borderRadius: isDesktopWeb ? 24 : 19,
      backgroundColor: withOpacity(colors.primary, 0.12),
      alignItems: "center",
      justifyContent: "center",
      marginRight: isDesktopWeb ? 16 : 10,
    },
    sharingInfo: {
      flex: 1,
      marginRight: isDesktopWeb ? 16 : 10,
    },
    sharingTitle: {
      fontSize: isDesktopWeb ? 18 : 15,
      fontWeight: "700",
      color: colors.text,
      marginBottom: isDesktopWeb ? 4 : 3,
      lineHeight: isDesktopWeb ? 24 : 20,
    },
    sharingDescription: {
      fontSize: isDesktopWeb ? 14 : 12,
      color: colors.textSecondary,
      lineHeight: isDesktopWeb ? 20 : 16,
    },
    sharingExpandButton: {
      padding: isDesktopWeb ? 8 : 6,
      minWidth: 44,
      minHeight: 44,
      justifyContent: "center",
      alignItems: "center",
    },
    sharingGroupsList: {
      marginTop: isDesktopWeb ? 16 : 12,
      paddingTop: isDesktopWeb ? 16 : 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    sharingGroupItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: isDesktopWeb ? 8 : 6,
      paddingHorizontal: isDesktopWeb ? 12 : 10,
      backgroundColor: colors.surface,
      borderRadius: isDesktopWeb ? 8 : 6,
      marginBottom: isDesktopWeb ? 8 : 6,
      minHeight: 44,
    },
    sharingGroupAvatar: {
      width: isDesktopWeb ? 32 : 28,
      height: isDesktopWeb ? 32 : 28,
      borderRadius: isDesktopWeb ? 16 : 14,
      backgroundColor: withOpacity(colors.primary, 0.19),
      alignItems: "center",
      justifyContent: "center",
      marginRight: isDesktopWeb ? 12 : 10,
    },
    sharingGroupName: {
      fontSize: isDesktopWeb ? 14 : 13,
      color: colors.text,
      fontWeight: "500",
    },
    // Stats Grid
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: isDesktopWeb ? 20 : 10,
      marginBottom: isDesktopWeb ? 32 : 18,
    },
    statCard: {
      // flexBasis, not flex: 1 — on native, flex: 1 starts the card at 0 width,
      // so its text is measured near-zero wide and the card renders very tall.
      flexGrow: 1,
      flexBasis: isDesktopWeb ? "22%" : singleColumn ? "100%" : "47%",
      backgroundColor: colors.surface,
      borderRadius: isDesktopWeb ? 16 : 12,
      padding: isDesktopWeb ? 24 : 12,
      borderWidth: 1,
      borderColor: colors.border,
      ...(isDesktopWeb && {
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      }),
    },
    statCardWeb: {
      // Web-specific transitions should be handled differently
    },
    statCardGradient: {
      backgroundColor: isDesktopWeb ? colors.primary : colors.surface,
      borderColor: isDesktopWeb ? colors.primary : colors.border,
    },
    statCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: isDesktopWeb ? 12 : 8,
    },
    statIcon: {
      width: isDesktopWeb ? 48 : 36,
      height: isDesktopWeb ? 48 : 36,
      borderRadius: isDesktopWeb ? 24 : 18,
      backgroundColor: withOpacity(colors.primary, 0.12),
      alignItems: "center",
      justifyContent: "center",
    },
    statIconGradient: {
      backgroundColor: withOpacity(colors.primary, 0.12),
    },
    statTrend: {
      width: isDesktopWeb ? 24 : 20,
      height: isDesktopWeb ? 24 : 20,
      borderRadius: isDesktopWeb ? 12 : 10,
      backgroundColor: withOpacity(colors.success, 0.12),
      alignItems: "center",
      justifyContent: "center",
    },
    statContent: {},
    statValue: {
      fontSize: isDesktopWeb ? 28 : 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: isDesktopWeb ? 4 : 2,
      lineHeight: isDesktopWeb ? 32 : 22,
    },
    statValueLight: {
      color: isDesktopWeb ? theme.colors.white : colors.text,
    },
    statTitle: {
      fontSize: isDesktopWeb ? 13 : 11,
      color: colors.textSecondary,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.3,
      lineHeight: isDesktopWeb ? 16 : 14,
    },
    statTitleLight: {
      color: isDesktopWeb
        ? withOpacity(baseColors.white, 0.9)
        : colors.textSecondary,
    },
    statSubtitle: {
      fontSize: isDesktopWeb ? 12 : 10,
      color: colors.gray[400],
      marginTop: isDesktopWeb ? 4 : 2,
      lineHeight: isDesktopWeb ? 16 : 14,
    },
    statSubtitleLight: {
      color: isDesktopWeb
        ? withOpacity(baseColors.white, 0.75)
        : colors.gray[400],
    },
    // Tabs
    tabsContainer: {
      backgroundColor: colors.surface,
      borderRadius: isDesktopWeb ? 16 : 10,
      padding: isDesktopWeb ? 8 : 4,
      marginBottom: isDesktopWeb ? 24 : 14,
      flexDirection: "row",
      gap: isDesktopWeb ? 8 : 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabButton: {
      flex: 1,
      flexDirection: isDesktopWeb ? "row" : "column",
      alignItems: "center",
      justifyContent: "center",
      gap: isDesktopWeb ? 8 : 4,
      paddingVertical: isDesktopWeb ? 14 : 10,
      paddingHorizontal: isDesktopWeb ? 20 : 8,
      borderRadius: isDesktopWeb ? 12 : 8,
      position: "relative",
      minHeight: 48,
    },
    tabButtonActive: {
      backgroundColor: colors.surface,
    },
    tabButtonText: {
      fontSize: isDesktopWeb ? 15 : 12,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    tabButtonTextActive: {
      color: colors.primary,
    },
    tabIndicator: {
      position: "absolute",
      bottom: 0,
      left: "20%",
      right: "20%",
      height: isDesktopWeb ? 3 : 2,
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    // Logs Section
    logsContainer: {
      backgroundColor: colors.surface,
      borderRadius: isDesktopWeb ? 16 : 12,
      padding: isDesktopWeb ? 24 : 14,
      borderWidth: 1,
      borderColor: colors.border,
      ...(isDesktopWeb && {
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      }),
    },
    logsHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: isDesktopWeb ? 20 : 14,
    },
    logsTitle: {
      fontSize: isDesktopWeb ? 20 : 16,
      fontWeight: "700",
      color: colors.text,
      lineHeight: isDesktopWeb ? 24 : 20,
    },
    addLogButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: isDesktopWeb ? 6 : 4,
      paddingVertical: isDesktopWeb ? 10 : 8,
      paddingHorizontal: isDesktopWeb ? 20 : 14,
      borderRadius: isDesktopWeb ? 12 : 10,
      backgroundColor: colors.primary,
      minHeight: 44,
      minWidth: 44,
      ...(isDesktopWeb && {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      }),
      ...(isMobile && {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    addLogButtonText: {
      fontSize: isDesktopWeb ? 14 : 13,
      fontWeight: "600",
      color: theme.colors.white,
    },
    logItem: {
      position: "relative",
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: isDesktopWeb ? 16 : 10,
      paddingLeft: isDesktopWeb ? 20 : 14,
      paddingRight: isDesktopWeb ? 16 : 10,
      marginBottom: isDesktopWeb ? 8 : 6,
      backgroundColor: colors.surface,
      borderRadius: isDesktopWeb ? 12 : 10,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 44,
    },
    logItemWeb: {
      // Web-specific transitions should be handled differently
    },
    logItemLeftBorder: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: isDesktopWeb ? 4 : 3,
      backgroundColor: colors.primary,
      borderTopLeftRadius: isDesktopWeb ? 12 : 10,
      borderBottomLeftRadius: isDesktopWeb ? 12 : 10,
    },
    logIcon: {
      width: isDesktopWeb ? 44 : 32,
      height: isDesktopWeb ? 44 : 32,
      borderRadius: isDesktopWeb ? 22 : 16,
      backgroundColor: withOpacity(colors.primary, 0.12),
      alignItems: "center",
      justifyContent: "center",
      marginRight: isDesktopWeb ? 16 : 10,
    },
    logIconWeb: {
      ...(isDesktopWeb && {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }),
    },
    logContent: {
      flex: 1,
      minWidth: 0,
    },
    logTextRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: isDesktopWeb ? 4 : 2,
    },
    logText: {
      fontSize: isDesktopWeb ? 16 : 14,
      color: colors.text,
      fontWeight: "600",
      flex: 1,
      lineHeight: isDesktopWeb ? 20 : 18,
    },
    logTextWeb: {
      fontSize: 16,
      letterSpacing: 0.2,
    },
    logSubtext: {
      fontSize: isDesktopWeb ? 14 : 12,
      color: colors.textSecondary,
      marginBottom: isDesktopWeb ? 4 : 2,
      lineHeight: isDesktopWeb ? 18 : 16,
    },
    logSubtextWeb: {
      fontSize: 14,
    },
    logDate: {
      fontSize: isDesktopWeb ? 13 : 11,
      color: colors.gray[400],
      fontWeight: "500",
      lineHeight: isDesktopWeb ? 16 : 14,
    },
    logDateWeb: {
      fontSize: 13,
    },
    noLogsText: {
      fontSize: isDesktopWeb ? 15 : 13,
      color: colors.textSecondary,
      textAlign: "center",
      paddingVertical: isDesktopWeb ? 40 : 28,
      fontStyle: "italic",
    },
    viewAllButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingTop: isDesktopWeb ? 16 : 12,
      paddingBottom: isDesktopWeb ? 4 : 0,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: isDesktopWeb ? 16 : 10,
      minHeight: 44,
    },
    viewAllText: {
      fontSize: isDesktopWeb ? 15 : 13,
      color: colors.primary,
      fontWeight: "600",
      marginRight: spacing.sm,
    },
    paginationWrapper: {
      borderTopWidth: isDesktopWeb ? 0 : 1,
      borderTopColor: colors.border,
      marginTop: isDesktopWeb ? 16 : 10,
    },
  });

  const sharingSection =
    vehicle?.is_own_vehicle &&
    (isDesktopWeb ? (
      <View
        style={[
          styles.sharingCard,
          isDesktopWeb && [web.panel, { shadowOpacity: 0 }],
        ]}
      >
        <TouchableOpacity
          style={styles.sharingHeader}
          onPress={() => setSharingExpanded(!sharingExpanded)}
          activeOpacity={0.7}
        >
          <View style={styles.sharingLeft}>
            <View style={styles.sharingIcon}>
              <IconSymbol
                name="person.3.fill"
                size={isDesktopWeb ? 22 : 20}
                color={colors.primary}
              />
            </View>
            <View style={styles.sharingInfo}>
              <Text style={styles.sharingTitle}>Share with Groups</Text>
              <Text style={styles.sharingDescription}>
                {vehicle.sharing_info?.is_shared
                  ? `Shared with ${vehicle.sharing_info.total_shares} group${vehicle.sharing_info.total_shares > 1 ? "s" : ""}`
                  : "Allow groups to view this vehicle"}
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
            }}
          >
            <TouchableOpacity
              onPress={openSharingModal}
              style={{
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.lg,
                borderRadius: 8,
                backgroundColor: withOpacity(colors.primary, 0.1),
              }}
              accessibilityRole="button"
              accessibilityLabel="Manage vehicle sharing"
            >
              <Text style={{ color: colors.primary, fontWeight: "600" }}>
                Manage
              </Text>
            </TouchableOpacity>
            {isDesktopWeb && (
              <TouchableOpacity style={styles.sharingExpandButton}>
                <IconSymbol
                  name={sharingExpanded ? "chevron.up" : "chevron.down"}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>

        {sharingExpanded &&
        vehicle.sharing_info?.shared_with_groups &&
        vehicle.sharing_info.shared_with_groups.length > 0 ? (
          <View style={styles.sharingGroupsList}>
            {vehicle.sharing_info.shared_with_groups.map((groupName, index) => (
              <View key={index} style={styles.sharingGroupItem}>
                <View style={styles.sharingGroupAvatar}>
                  <IconSymbol
                    name="person.3.fill"
                    size={16}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.sharingGroupName}>{groupName}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    ) : (
      <View style={styles.sharingCard}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Vehicle sharing"
          accessibilityState={{ expanded: sharingExpanded }}
          onPress={() => setSharingExpanded((value) => !value)}
          style={{
            minHeight: 48,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Text style={styles.sharingTitle}>Share with Groups</Text>
            <Text style={styles.sharingDescription}>
              {vehicle.sharing_info?.is_shared
                ? `Shared with ${vehicle.sharing_info.total_shares} groups`
                : "Allow groups to view this vehicle"}
            </Text>
          </View>
          <IconSymbol
            name={sharingExpanded ? "chevron.up" : "chevron.down"}
            size={20}
            color={colors.primary}
          />
        </TouchableOpacity>
        {sharingExpanded && (
          <View style={{ marginTop: 12, gap: 12 }}>
            <Button
              title="Manage sharing"
              variant="outline"
              onPress={openSharingModal}
              style={{ minHeight: 48 }}
            />
            {(vehicle.sharing_info?.shared_with_groups || []).map(
              (name, index) => (
                <Text key={index} style={styles.compactMeta}>
                  {name}
                </Text>
              ),
            )}
          </View>
        )}
      </View>
    ));

  if (loading) {
    return (
      <React.Fragment>
        <Head>
          <title>Loading Vehicle - Vehicle Management</title>
        </Head>
        <SafeAreaView
          style={styles.container}
          edges={["top", "left", "right", "bottom"]}
        >
          {isMobile && <PageHeader title="Vehicle Details" showBack />}
          {isDesktopWeb && <View style={styles.webFrame}>{breadcrumbs}</View>}
          <SkeletonVehicleDetail />
        </SafeAreaView>
      </React.Fragment>
    );
  }

  if (!vehicle) {
    return (
      <React.Fragment>
        <Head>
          <title>Vehicle Not Found - Vehicle Management</title>
        </Head>
        <SafeAreaView
          style={styles.container}
          edges={["top", "left", "right", "bottom"]}
        >
          {isMobile && <PageHeader title="Vehicle Details" showBack />}
          <View style={styles.content}>
            {isDesktopWeb ? (
              <View style={styles.webFrame}>
                {breadcrumbs}
                <View style={[web.panel, { gap: theme.spacing.lg }]}>
                  <Text style={{ color: colors.text }}>
                    {loadError || "Vehicle not found"}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: theme.spacing.md,
                    }}
                  >
                    <Button
                      title="Retry"
                      loading={refreshing}
                      onPress={onRefresh}
                    />
                    <Button
                      title="Return to Vehicles"
                      variant="outline"
                      onPress={() => router.replace("/vehicles")}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View style={{ padding: 16, gap: 16 }}>
                <Text style={styles.errorText}>
                  {loadError || "Vehicle not found"}
                </Text>
                <Button
                  title="Retry"
                  loading={refreshing}
                  onPress={onRefresh}
                  style={{ minHeight: 48 }}
                />
                <Button
                  title="Back"
                  variant="outline"
                  onPress={() => goBack("/vehicles")}
                  style={{ minHeight: 48 }}
                />
              </View>
            )}
          </View>
        </SafeAreaView>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <Head>
        <title>
          {vehicle
            ? `${vehicle.year} ${vehicle.make} ${vehicle.model} - Vehicle Management`
            : "Vehicle Management"}
        </title>
      </Head>
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        {isMobile && <PageHeader title="Vehicle Details" showBack />}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {isMobile && loadError && (
            <View style={{ padding: 16, gap: 12 }}>
              <Text style={styles.errorText}>{loadError}</Text>
              <Button
                title="Retry"
                loading={refreshing}
                onPress={onRefresh}
                style={{ minHeight: 48 }}
              />
            </View>
          )}
          {isDesktopWeb ? (
            <View style={styles.webFrame}>
              {breadcrumbs}
              <View
                style={[
                  web.panel,
                  {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: theme.spacing.lg,
                  },
                ]}
              >
                {vehicle.main_image_url && !imageError ? (
                  <Image
                    source={{
                      uri: storageImageUrl(
                        "vehicle-images",
                        vehicle.main_image_url,
                      ),
                    }}
                    contentFit="cover"
                    style={{
                      width: 112,
                      height: 80,
                      borderRadius: theme.borderRadius.md,
                    }}
                    onError={() => setImageError(true)}
                    accessibilityLabel={vehicleName}
                  />
                ) : (
                  <View
                    style={{
                      width: 112,
                      height: 80,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: colors.background,
                      borderRadius: theme.borderRadius.md,
                    }}
                  >
                    <IconSymbol
                      name="car.fill"
                      size={32}
                      color={colors.textSecondary}
                    />
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 200, gap: theme.spacing.sm }}>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: theme.fontSize.xl,
                      fontWeight: "600",
                    }}
                  >
                    {vehicleName}
                  </Text>
                  <Text style={{ color: colors.textSecondary }}>
                    {vehicle.license_plate} ·{" "}
                    {vehicle.is_own_vehicle ? "Owned" : "Shared with me"}
                  </Text>
                  {!!vehicle.vin && (
                    <Text style={{ color: colors.textSecondary }}>
                      VIN: {vehicle.vin}
                    </Text>
                  )}
                  <Text style={{ color: colors.textSecondary }}>
                    {formatDateWithPrefix(vehicle.created_at, "Added")}
                  </Text>
                </View>
                <Button
                  title="Edit Vehicle"
                  variant="outline"
                  disabled={!canModify}
                  onPress={() => router.push(`/vehicles/${vehicle.id}/edit`)}
                />
              </View>
            </View>
          ) : (
            <View style={styles.compactSummary}>
              <View style={styles.compactHeader}>
                {vehicle.main_image_url && !imageError ? (
                  <Image
                    source={{
                      uri: storageImageUrl(
                        "vehicle-images",
                        vehicle.main_image_url,
                      ),
                    }}
                    style={styles.compactImage}
                    contentFit="cover"
                    onError={() => setImageError(true)}
                    accessibilityLabel={vehicleName}
                  />
                ) : (
                  <View
                    accessibilityLabel="Vehicle image unavailable"
                    style={[
                      styles.compactImage,
                      {
                        backgroundColor: colors.background,
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    ]}
                  >
                    <IconSymbol
                      name="car.fill"
                      size={32}
                      color={colors.textSecondary}
                    />
                  </View>
                )}
                <View style={styles.compactInfo}>
                  <Text style={styles.compactName}>{vehicleName}</Text>
                  <Text style={styles.compactMeta}>
                    {vehicle.license_plate}
                  </Text>
                  <Text style={styles.compactMeta}>
                    {!vehicle.is_own_vehicle
                      ? "Shared with me"
                      : vehicle.sharing_info?.is_shared
                        ? "Shared"
                        : "Owned"}
                  </Text>
                </View>
              </View>
              {!!vehicle.vin && (
                <Text style={styles.compactMeta}>VIN: {vehicle.vin}</Text>
              )}
              <Text style={styles.compactMeta}>
                {formatDateWithPrefix(vehicle.created_at, "Added")}
              </Text>
              <View style={styles.compactActions}>
                <Button
                  title="Edit Vehicle"
                  variant="outline"
                  disabled={!canModify}
                  style={{ minHeight: 48 }}
                  onPress={() => {
                    if (canModify)
                      router.push(`/vehicles/${vehicle.id}/edit` as any);
                  }}
                />
                {vehicle.is_own_vehicle && (
                  <ActionMenu
                    label="Vehicle actions"
                    minTouchSize={48}
                    disabled={deleteLoading}
                    items={[
                      {
                        label: "Delete Vehicle",
                        icon: "trash",
                        variant: "danger",
                        disabled: deleteLoading,
                        onPress: handleDelete,
                      },
                    ]}
                  />
                )}
              </View>
            </View>
          )}

          {/* Main Content */}
          <View style={styles.contentContainer}>
            {isDesktopWeb && sharingSection}

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard
                title="Current Mileage"
                value={(() => {
                  const currentMileage =
                    vehicle.current_mileage && vehicle.current_mileage > 0
                      ? vehicle.current_mileage
                      : vehicle.logs?.latest_mileage?.odometer_reading;
                  return currentMileage
                    ? `${currentMileage.toLocaleString()}`
                    : "No data";
                })()}
                subtitle={(() => {
                  const currentMileage =
                    vehicle.current_mileage && vehicle.current_mileage > 0
                      ? vehicle.current_mileage
                      : vehicle.logs?.latest_mileage?.odometer_reading;
                  return currentMileage ? "km" : undefined;
                })()}
                icon="speedometer"
                gradient={isDesktopWeb}
              />
              <StatCard
                title="Fuel Records"
                value={(() => {
                  if (
                    vehicle.logs?.counts?.access_status?.fuel_accessible ===
                    false
                  ) {
                    return vehicle.logs.counts.access_status
                      .has_permission_issues
                      ? "Limited"
                      : "Error";
                  }
                  return vehicle.logs?.counts?.fuel_count !== undefined
                    ? `${vehicle.logs.counts.fuel_count}`
                    : "N/A";
                })()}
                subtitle={
                  vehicle.logs?.latest_fuel
                    ? `${formatDate(vehicle.logs.latest_fuel.date)}`
                    : "No records"
                }
                icon="fuelpump.fill"
              />
              <StatCard
                title="Service Records"
                value={(() => {
                  if (
                    vehicle.logs?.counts?.access_status?.service_accessible ===
                    false
                  ) {
                    return vehicle.logs.counts.access_status
                      .has_permission_issues
                      ? "Limited"
                      : "Error";
                  }
                  return vehicle.logs?.counts?.service_count !== undefined
                    ? `${vehicle.logs.counts.service_count}`
                    : "N/A";
                })()}
                subtitle={
                  vehicle.logs?.latest_service
                    ? `${formatDate(vehicle.logs.latest_service.date)}`
                    : "No records"
                }
                icon="wrench.and.screwdriver.fill"
              />
              <StatCard
                title="Mileage Logs"
                value={(() => {
                  if (
                    vehicle.logs?.counts?.access_status?.mileage_accessible ===
                    false
                  ) {
                    return vehicle.logs.counts.access_status
                      .has_permission_issues
                      ? "Limited"
                      : "Error";
                  }
                  return vehicle.logs?.counts?.mileage_count !== undefined
                    ? `${vehicle.logs.counts.mileage_count}`
                    : "N/A";
                })()}
                subtitle={
                  vehicle.logs?.latest_mileage
                    ? `${formatDate(vehicle.logs.latest_mileage.date)}`
                    : "No records"
                }
                icon="chart.line.uptrend.xyaxis"
              />
            </View>

            {isMobile && sharingSection}

            {/* Tab Navigation */}
            <View
              style={
                isDesktopWeb
                  ? [web.filters, { marginBottom: theme.spacing.lg }]
                  : styles.tabsContainer
              }
            >
              <TabButton
                label="Mileage"
                icon="speedometer"
                isActive={activeTab === "mileage"}
                onPress={() => setActiveTab("mileage")}
              />
              <TabButton
                label="Fuel"
                icon="fuelpump.fill"
                isActive={activeTab === "fuel"}
                onPress={() => setActiveTab("fuel")}
              />
              <TabButton
                label="Service"
                icon="wrench.and.screwdriver.fill"
                isActive={activeTab === "service"}
                onPress={() => setActiveTab("service")}
              />
            </View>

            {/* Logs Container */}
            <View
              style={[
                styles.logsContainer,
                isDesktopWeb && [web.panel, { shadowOpacity: 0 }],
              ]}
            >
              <View
                style={[
                  styles.logsHeader,
                  isMobile && { flexWrap: "wrap", gap: 12 },
                ]}
              >
                <Text style={styles.logsTitle}>
                  Recent{" "}
                  {activeTab === "mileage"
                    ? "Mileage"
                    : activeTab === "fuel"
                      ? "Fuel"
                      : "Service"}{" "}
                  Logs
                </Text>
                {isDesktopWeb ? (
                  <Button
                    title={`Add ${activeTab} log`}
                    disabled={!canModify}
                    onPress={handleAddLog}
                  />
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.addLogButton,
                      { minHeight: 48, maxWidth: "100%" },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${activeTab} log`}
                    disabled={!canModify}
                    onPress={handleAddLog}
                  >
                    <IconSymbol
                      name="plus"
                      size={16}
                      color={theme.colors.white}
                    />
                    <Text style={[styles.addLogButtonText, { flexShrink: 1 }]}>
                      Add {activeTab} log
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Mileage Logs */}
              {activeTab === "mileage" && (
                <>
                  {vehicle.mileage_logs && vehicle.mileage_logs.length > 0 ? (
                    <>
                      {getPaginatedItems(
                        [...vehicle.mileage_logs].sort(
                          (a, b) =>
                            new Date(b.date).getTime() -
                            new Date(a.date).getTime(),
                        ),
                        mileageCurrentPage,
                      ).map((log, index) => (
                        <LogItem
                          key={index}
                          log={log}
                          icon="speedometer"
                          isServiceLog={false}
                          isMileageLog={true}
                          isFuelLog={false}
                        />
                      ))}
                      <View style={styles.paginationWrapper}>
                        <Pagination
                          currentPage={mileageCurrentPage}
                          totalPages={Math.ceil(
                            vehicle.mileage_logs.length / ITEMS_PER_PAGE,
                          )}
                          totalItems={vehicle.mileage_logs.length}
                          pageSize={ITEMS_PER_PAGE}
                          onPageChange={setMileageCurrentPage}
                        />
                      </View>
                    </>
                  ) : (
                    <Text style={styles.noLogsText}>
                      No mileage logs recorded yet
                    </Text>
                  )}
                </>
              )}

              {/* Fuel Logs */}
              {activeTab === "fuel" && (
                <>
                  {vehicle.fuel_logs && vehicle.fuel_logs.length > 0 ? (
                    <>
                      {getPaginatedItems(
                        [...vehicle.fuel_logs].sort(
                          (a, b) =>
                            new Date(b.date).getTime() -
                            new Date(a.date).getTime(),
                        ),
                        fuelCurrentPage,
                      ).map((log, index) => (
                        <LogItem
                          key={index}
                          log={log}
                          icon="fuelpump.fill"
                          isServiceLog={false}
                          isMileageLog={false}
                          isFuelLog={true}
                        />
                      ))}
                      <View style={styles.paginationWrapper}>
                        <Pagination
                          currentPage={fuelCurrentPage}
                          totalPages={Math.ceil(
                            vehicle.fuel_logs.length / ITEMS_PER_PAGE,
                          )}
                          totalItems={vehicle.fuel_logs.length}
                          pageSize={ITEMS_PER_PAGE}
                          onPageChange={setFuelCurrentPage}
                        />
                      </View>
                    </>
                  ) : (
                    <Text style={styles.noLogsText}>
                      No fuel logs recorded yet
                    </Text>
                  )}
                </>
              )}

              {/* Service Logs */}
              {activeTab === "service" && (
                <>
                  {vehicle.service_logs && vehicle.service_logs.length > 0 ? (
                    <>
                      {getPaginatedItems(
                        [...vehicle.service_logs].sort(
                          (a, b) =>
                            new Date(b.date).getTime() -
                            new Date(a.date).getTime(),
                        ),
                        serviceCurrentPage,
                      ).map((log, index) => (
                        <LogItem
                          key={index}
                          log={log}
                          icon="wrench.and.screwdriver.fill"
                          isServiceLog={true}
                          isMileageLog={false}
                          isFuelLog={false}
                        />
                      ))}
                      <View style={styles.paginationWrapper}>
                        <Pagination
                          currentPage={serviceCurrentPage}
                          totalPages={Math.ceil(
                            vehicle.service_logs.length / ITEMS_PER_PAGE,
                          )}
                          totalItems={vehicle.service_logs.length}
                          pageSize={ITEMS_PER_PAGE}
                          onPageChange={setServiceCurrentPage}
                        />
                      </View>
                    </>
                  ) : (
                    <Text style={styles.noLogsText}>
                      No service logs recorded yet
                    </Text>
                  )}
                </>
              )}
            </View>
            {isDesktopWeb && vehicle.is_own_vehicle && (
              <View
                style={[
                  web.panel,
                  {
                    marginTop: theme.spacing.lg,
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: theme.spacing.md,
                  },
                ]}
              >
                <View style={{ flex: 1, minWidth: 200 }}>
                  <Text style={{ color: colors.text, fontWeight: "600" }}>
                    Delete this vehicle
                  </Text>
                  <Text style={{ color: colors.textSecondary }}>
                    Permanently deletes the vehicle and all associated logs.
                  </Text>
                </View>
                <Button
                  title="Delete Vehicle"
                  variant="danger"
                  loading={deleteLoading}
                  onPress={handleDelete}
                />
              </View>
            )}
          </View>
        </ScrollView>

        {vehicle && (
          <Modal
            visible={showSharingModal}
            onClose={() => setShowSharingModal(false)}
            title="Share with Groups"
            variant="bottom-sheet"
          >
            <VehicleGroupSelector
              vehicleId={vehicle.id}
              currentSharedGroups={currentShares}
              onSharingUpdate={handleSharingUpdate}
            />
          </Modal>
        )}
      </SafeAreaView>
    </React.Fragment>
  );
}
