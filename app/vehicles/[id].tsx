import { baseColors, withOpacity, spacing } from "@/src/design-system";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useStyles } from "react-native-unistyles";
import { ActionMenu, ActionMenuItem } from "@/components/ui/ActionMenu";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AlertModal, ConfirmModal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { ServiceReceiptIndicator } from "@/components/ui/ReceiptViewer";
import { SkeletonVehicleDetail } from "@/components/ui/Skeleton";
import {
  FuelLogService,
  MileageLogService,
  ServiceLogService,
} from "@/lib/services/loggingService";
import { VehicleService } from "@/lib/services/vehicleService";
import { formatDate, formatDateWithPrefix } from "@/lib/utils/dateUtils";
import {
  canUserAccessVehicle,
  formatServiceItems,
} from "@/lib/utils/serviceUtils";
import { supabase } from "@/services/supabaseClient";
import { VehicleWithDetails } from "@/types/database-v2";
import { Image } from "expo-image";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import Head from "expo-router/head";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LogTab = "mileage" | "fuel" | "service";

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<VehicleWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [activeTab, setActiveTab] = useState<LogTab>("mileage");
  const [sharingExpanded, setSharingExpanded] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    Dimensions.get("window").width,
  );

  // Pagination states
  const [mileageCurrentPage, setMileageCurrentPage] = useState(1);
  const [fuelCurrentPage, setFuelCurrentPage] = useState(1);
  const [serviceCurrentPage, setServiceCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Modal states
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertVariant, setAlertVariant] = useState<
    "info" | "success" | "warning" | "error"
  >("info");

  // Log deletion states
  const [deleteLogModalVisible, setDeleteLogModalVisible] = useState(false);
  const [deleteLogLoading, setDeleteLogLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<{
    type: LogTab;
    id: string;
    description: string;
  } | null>(null);
  const [canModify, setCanModify] = useState(true);
  const { theme } = useStyles();
  const colorScheme = useColorScheme();
  const colors = theme.colors;

  const fetchVehicleData = useCallback(async () => {
    if (!id) return;

    try {
      // Using VehicleService.getVehicleById for more detailed data
      const vehicleResult = await VehicleService.getVehicleById(id);

      if (vehicleResult.error) {
        console.error("Error fetching vehicle:", vehicleResult.error);
        showAlert("Error", "Failed to load vehicle details", "error");
        router.back();
      } else if (vehicleResult.data) {
        setVehicle(vehicleResult.data);

        // Check if user can modify this vehicle's logs
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const canAccess = await canUserAccessVehicle(id, user.id);
          setCanModify(canAccess);
        }
      } else {
        showAlert("Error", "Vehicle not found", "error");
        router.back();
      }
    } catch (error) {
      console.error("Unexpected error fetching vehicle data:", error);
      showAlert("Error", "Failed to load vehicle details", "error");
      router.back();
    }

    setLoading(false);
  }, [id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVehicleData();
    setRefreshing(false);
  }, [fetchVehicleData]);

  const handleDelete = () => {
    if (!vehicle) return;
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!vehicle) return;

    setDeleteLoading(true);
    const { error } = await VehicleService.deleteVehicle(vehicle.id);
    setDeleteLoading(false);
    setDeleteModalVisible(false);

    if (error) {
      showAlert("Error", "Failed to delete vehicle", "error");
    } else {
      router.back();
    }
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

  const handleDeleteLog = (type: LogTab, id: string, description: string) => {
    setSelectedLog({ type, id, description });
    setDeleteLogModalVisible(true);
  };

  const handleEditLog = (type: LogTab, id: string) => {
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

  const handleConfirmLogDelete = async () => {
    if (!selectedLog) return;

    setDeleteLogLoading(true);

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

    setDeleteLogLoading(false);
    setDeleteLogModalVisible(false);

    if (result?.error) {
      showAlert("Error", result.error, "error");
    } else {
      showAlert(
        "Success",
        `${selectedLog.type} log deleted successfully`,
        "success",
      );
      await fetchVehicleData(); // Refresh the vehicle data
    }

    setSelectedLog(null);
  };

  const handleToggleSharing = async (shared: boolean) => {
    if (!vehicle || sharingLoading) return;

    if (shared) {
      // When turning on sharing, get user's groups and share with all
      Alert.alert(
        "Vehicle Sharing",
        "In the new selective sharing system, you can choose specific groups to share with. For now, this will share with all your groups.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Share with All Groups",
            onPress: async () => {
              setSharingLoading(true);
              try {
                // Get user's groups
                const { data: groups, error: groupsError } =
                  await VehicleService.getUserGroups();

                if (groupsError || !groups || groups.length === 0) {
                  setSharingLoading(false);
                  showAlert(
                    "Error",
                    "No groups found. You need to be a member of at least one group to share vehicles.",
                    "error",
                  );
                  return;
                }

                // Share with all groups
                const groupIds = groups.map((group) => group.id);
                const { error: shareError } =
                  await VehicleService.shareVehicleWithGroups(
                    vehicle.id,
                    groupIds,
                  );

                if (shareError) {
                  setSharingLoading(false);
                  showAlert(
                    "Error",
                    "Failed to share vehicle: " + shareError,
                    "error",
                  );
                } else {
                  // Update local state with actual data
                  setVehicle((prev) =>
                    prev
                      ? {
                          ...prev,
                          sharing_info: {
                            is_shared: true,
                            shared_with_groups: groups.map((g) => g.name),
                            total_shares: groups.length,
                          },
                        }
                      : null,
                  );
                  setSharingLoading(false);
                  showAlert(
                    "Success",
                    `Vehicle shared with ${groups.length} group(s)`,
                    "success",
                  );
                }
              } catch (error) {
                console.error("Error sharing vehicle:", error);
                setSharingLoading(false);
                showAlert("Error", "Failed to share vehicle", "error");
              }
            },
          },
        ],
      );
    } else {
      // When turning off sharing, remove all shares
      setSharingLoading(true);
      try {
        const { error } = await VehicleService.shareVehicleWithGroups(
          vehicle.id,
          [],
        );

        if (error) {
          showAlert("Error", "Failed to stop sharing", "error");
        } else {
          setVehicle((prev) =>
            prev
              ? {
                  ...prev,
                  sharing_info: {
                    is_shared: false,
                    shared_with_groups: [],
                    total_shares: 0,
                  },
                }
              : null,
          );
          showAlert("Success", "Vehicle is no longer shared", "success");
        }
      } catch {
        showAlert("Error", "Failed to update sharing settings", "error");
      } finally {
        setSharingLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchVehicleData();
  }, [fetchVehicleData]);

  // Window resize listener for responsive web
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handleResize = () => {
      setWindowWidth(Dimensions.get("window").width);
    };

    const subscription = Dimensions.addEventListener("change", handleResize);

    return () => {
      subscription?.remove();
    };
  }, []);

  // Refresh data when screen comes into focus (e.g., after adding a new log)
  useFocusEffect(
    useCallback(() => {
      if (vehicle) {
        // Only refresh if we already have vehicle data loaded
        fetchVehicleData();
      }
    }, [fetchVehicleData, vehicle]),
  );

  // Reset pagination when switching tabs
  useEffect(() => {
    setMileageCurrentPage(1);
    setFuelCurrentPage(1);
    setServiceCurrentPage(1);
  }, [activeTab]);

  // Responsive breakpoints
  const isWeb = Platform.OS === "web";
  const isMobileWeb = isWeb && windowWidth < 768;
  const isDesktopWeb = isWeb && windowWidth >= 768;
  const isMobile = !isWeb || isMobileWeb;

  const StatCard = ({
    title,
    value,
    subtitle,
    icon,
    gradient = false,
  }: any) => (
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
            style={[styles.statSubtitle, gradient && styles.statSubtitleLight]}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );

  const TabButton = ({ label, icon, isActive, onPress }: any) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.tabButtonActive]}
      onPress={onPress}
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

    const actionMenuItems: ActionMenuItem[] = [
      {
        label: "Edit",
        icon: "pencil",
        onPress: () => handleEditLog(logType, log.id),
        disabled: !canModify,
      },
      {
        label: "Delete",
        icon: "trash",
        onPress: () => handleDeleteLog(logType, log.id, getLogText()),
        variant: "danger",
        disabled: !canModify,
      },
    ];

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
        <View style={{ marginLeft: spacing.sm }}>
          <ActionMenu items={actionMenuItems} />
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
    // Hero Section
    heroSection: {
      position: "relative",
      height: isDesktopWeb ? 320 : 200,
      backgroundColor: colors.surface,
      overflow: "hidden",
    },
    heroBackground: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: "100%",
      height: "100%",
    },
    heroOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: withOpacity(baseColors.black, 0.5),
    },
    heroContent: {
      flex: 1,
      justifyContent: "flex-end",
      padding: isDesktopWeb ? 40 : 16,
      maxWidth: isDesktopWeb ? 1200 : undefined,
      width: "100%",
      alignSelf: "center",
    },
    heroCard: {
      backgroundColor: colors.surface,
      borderRadius: isDesktopWeb ? 20 : 14,
      padding: isDesktopWeb ? 32 : 18,
      ...(isDesktopWeb && {
        backdropFilter: "blur(20px)",
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: colorScheme === "dark" ? 0.4 : 0.2,
        shadowRadius: 24,
      }),
      borderWidth: 1,
      borderColor: colors.border,
    },
    vehicleActions: {
      flexDirection: "row",
      gap: isDesktopWeb ? 8 : 6,
      alignItems: "center",
    },
    actionButton: {
      width: isDesktopWeb ? 40 : 36,
      height: isDesktopWeb ? 40 : 36,
      borderRadius: isDesktopWeb ? 20 : 18,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: theme.colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      ...(isMobile && {
        elevation: 1,
      }),
    },
    // Vehicle Info in Hero
    vehicleHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: isDesktopWeb ? 16 : 10,
    },
    vehicleIcon: {
      width: isDesktopWeb ? 80 : 56,
      height: isDesktopWeb ? 80 : 56,
      borderRadius: isDesktopWeb ? 40 : 28,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: isDesktopWeb ? 20 : 12,
      ...(isDesktopWeb && {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      }),
      ...(isMobile && {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
      }),
    },
    vehicleInfo: {
      flex: 1,
    },
    vehicleName: {
      fontSize: isDesktopWeb ? 32 : 20,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: isDesktopWeb ? 6 : 4,
      lineHeight: isDesktopWeb ? 40 : 24,
    },
    vehiclePlate: {
      fontSize: isDesktopWeb ? 18 : 15,
      color: colors.textSecondary,
      fontWeight: "600",
      letterSpacing: isDesktopWeb ? 1 : 0.3,
    },
    ownershipBadge: {
      position: "absolute",
      top: isDesktopWeb ? -10 : -6,
      left: isDesktopWeb ? -10 : -6,
      backgroundColor: colors.primary,
      paddingHorizontal: isDesktopWeb ? 12 : 10,
      paddingVertical: isDesktopWeb ? 6 : 5,
      borderRadius: isDesktopWeb ? 12 : 10,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      ...(isDesktopWeb && {
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      }),
      ...(isMobile && {
        elevation: 2,
      }),
    },
    ownershipBadgeText: {
      color: theme.colors.white,
      fontSize: isDesktopWeb ? 11 : 10,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    vehicleDetails: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: isDesktopWeb ? 20 : 12,
      marginTop: isDesktopWeb ? 8 : 6,
    },
    detailItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    detailLabel: {
      fontSize: isDesktopWeb ? 14 : 12,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    detailValue: {
      fontSize: isDesktopWeb ? 14 : 12,
      color: colors.text,
      fontWeight: "600",
    },
    // Content Container
    contentContainer: {
      maxWidth: isDesktopWeb ? 1200 : undefined,
      width: "100%",
      alignSelf: "center",
      padding: isDesktopWeb ? 40 : 16,
      paddingTop: isDesktopWeb ? 32 : 16,
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
      flex: 1,
      minWidth: isDesktopWeb ? "22%" : "47%",
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
    statContent: {
      flex: 1,
    },
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
    // Pagination wrapper — preserves the divider above the shared Pagination component
    paginationWrapper: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: isDesktopWeb ? 16 : 10,
    },
  });

  if (loading) {
    return (
      <React.Fragment>
        <Head>
          <title>Loading Vehicle - Vehicle Management</title>
        </Head>
        <SafeAreaView style={styles.container}>
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
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.errorText}>Vehicle not found</Text>
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
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            {vehicle.main_image_url && !imageError ? (
              <>
                <Image
                  source={{ uri: vehicle.main_image_url }}
                  style={styles.heroBackground}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                  onError={() => setImageError(true)}
                  blurRadius={isDesktopWeb ? 20 : 8}
                />
                <View style={styles.heroOverlay} />
              </>
            ) : (
              <View style={styles.heroOverlay} />
            )}

            {/* Hero Content */}
            <View style={styles.heroContent}>
              <View style={styles.heroCard}>
                <View style={styles.vehicleHeader}>
                  {vehicle.main_image_url && !imageError ? (
                    <View style={{ position: "relative" }}>
                      <Image
                        source={{ uri: vehicle.main_image_url }}
                        style={styles.vehicleIcon}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={200}
                      />
                      <View style={styles.ownershipBadge}>
                        <IconSymbol
                          name={
                            vehicle.is_own_vehicle
                              ? "star.fill"
                              : "person.3.fill"
                          }
                          size={10}
                          color={theme.colors.white}
                        />
                        <Text style={styles.ownershipBadgeText}>
                          {vehicle.is_own_vehicle ? "Owned" : "Shared"}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.vehicleIcon}>
                      <IconSymbol
                        name="car.fill"
                        size={isDesktopWeb ? 36 : 26}
                        color="white"
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
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.vehicleActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() =>
                        router.push(`/vehicles/${vehicle.id}/edit` as any)
                      }
                    >
                      <IconSymbol
                        name="pencil"
                        size={isDesktopWeb ? 18 : 16}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={handleDelete}
                    >
                      <IconSymbol
                        name="trash"
                        size={isDesktopWeb ? 18 : 16}
                        color={colors.error}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.vehicleDetails}>
                  {vehicle.vin && (
                    <View style={styles.detailItem}>
                      <IconSymbol
                        name="number"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.detailLabel}>VIN:</Text>
                      <Text style={styles.detailValue}>{vehicle.vin}</Text>
                    </View>
                  )}
                  <View style={styles.detailItem}>
                    <IconSymbol
                      name="calendar"
                      size={14}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.detailLabel}>Added:</Text>
                    <Text style={styles.detailValue}>
                      {formatDateWithPrefix(vehicle.created_at, "Added")}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.contentContainer}>
            {/* Sharing Section */}
            {vehicle.is_own_vehicle && (
              <View style={styles.sharingCard}>
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
                    <Switch
                      value={vehicle.sharing_info?.is_shared || false}
                      onValueChange={handleToggleSharing}
                      disabled={sharingLoading}
                      trackColor={{
                        false: withOpacity(colors.textSecondary, 0.19),
                        true: withOpacity(colors.primary, 0.31),
                      }}
                      thumbColor={
                        vehicle.sharing_info?.is_shared
                          ? colors.primary
                          : colors.background
                      }
                    />
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
                    {vehicle.sharing_info.shared_with_groups.map(
                      (groupName, index) => (
                        <View key={index} style={styles.sharingGroupItem}>
                          <View style={styles.sharingGroupAvatar}>
                            <IconSymbol
                              name="person.3.fill"
                              size={16}
                              color={colors.primary}
                            />
                          </View>
                          <Text style={styles.sharingGroupName}>
                            {groupName}
                          </Text>
                        </View>
                      ),
                    )}
                  </View>
                ) : null}
              </View>
            )}

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

            {/* Tab Navigation */}
            <View style={styles.tabsContainer}>
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
            <View style={styles.logsContainer}>
              <View style={styles.logsHeader}>
                <Text style={styles.logsTitle}>
                  Recent{" "}
                  {activeTab === "mileage"
                    ? "Mileage"
                    : activeTab === "fuel"
                      ? "Fuel"
                      : "Service"}{" "}
                  Logs
                </Text>
                <TouchableOpacity
                  style={styles.addLogButton}
                  onPress={() => {
                    const route = `/logs/${activeTab}/add?vehicleId=${vehicle.id}`;
                    router.push(route as any);
                  }}
                >
                  <IconSymbol
                    name="plus"
                    size={16}
                    color={theme.colors.white}
                  />
                  <Text style={styles.addLogButtonText}>Add</Text>
                </TouchableOpacity>
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
          </View>
        </ScrollView>

        <ConfirmModal
          visible={deleteModalVisible}
          onClose={() => {
            if (!deleteLoading) {
              setDeleteModalVisible(false);
            }
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Vehicle"
          message={
            vehicle
              ? `Are you sure you want to delete ${vehicle.year} ${vehicle.make} ${vehicle.model}? This action cannot be undone and will delete all associated logs.`
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

        <ConfirmModal
          visible={deleteLogModalVisible}
          title={`Delete ${selectedLog?.type} Log`}
          message={`Are you sure you want to delete this ${selectedLog?.type} log?\n\n${selectedLog?.description}\n\nThis action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleConfirmLogDelete}
          onClose={() => setDeleteLogModalVisible(false)}
          loading={deleteLogLoading}
          variant="danger"
        />
      </SafeAreaView>
    </React.Fragment>
  );
}
