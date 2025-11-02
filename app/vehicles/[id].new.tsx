import { IconSymbol } from "@/components/ui/icon-symbol";
import { AlertModal, ConfirmModal } from "@/components/ui/Modal";
import { ServiceReceiptIndicator } from "@/components/ui/ReceiptViewer";
import { VehicleService } from "@/lib/services/vehicleService";
import { formatDate } from "@/lib/utils/dateUtils";
import { formatServiceItems } from "@/lib/utils/serviceUtils";
import { VehicleWithDetails } from "@/types/database-v2";
import { Image } from "expo-image";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import Head from "expo-router/head";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { DetailLayout, Card, Spacer } from "@/lib/design-system";
import type { DetailTab } from "@/lib/design-system";
import { useStyles } from "react-native-unistyles";

type LogTab = "mileage" | "fuel" | "service";

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useStyles();
  const [vehicle, setVehicle] = useState<VehicleWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [activeTab, setActiveTab] = useState<LogTab>("mileage");
  const [sharingExpanded, setSharingExpanded] = useState(false);

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

  const fetchVehicleData = useCallback(async () => {
    if (!id) return;

    try {
      const vehicleResult = await VehicleService.getVehicleById(id);

      if (vehicleResult.error) {
        console.error("Error fetching vehicle:", vehicleResult.error);
        showAlert("Error", "Failed to load vehicle details", "error");
        router.back();
      } else if (vehicleResult.data) {
        setVehicle(vehicleResult.data);
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
    await fetchVehicleData();
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

  const handleToggleSharing = async (shared: boolean) => {
    if (!vehicle || sharingLoading) return;

    if (shared) {
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
                const { data: groups, error: groupsError } =
                  await VehicleService.getUserGroups();

                if (groupsError || !groups || groups.length === 0) {
                  showAlert(
                    "Error",
                    "No groups found. You need to be a member of at least one group to share vehicles.",
                    "error",
                  );
                  return;
                }

                const groupIds = groups.map((group) => group.id);
                const { error: shareError } =
                  await VehicleService.shareVehicleWithGroups(
                    vehicle.id,
                    groupIds,
                  );

                if (shareError) {
                  showAlert(
                    "Error",
                    "Failed to share vehicle: " + shareError,
                    "error",
                  );
                } else {
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
                  showAlert(
                    "Success",
                    `Vehicle shared with ${groups.length} group(s)`,
                    "success",
                  );
                }
              } catch (error) {
                console.error("Error sharing vehicle:", error);
                showAlert("Error", "Failed to share vehicle", "error");
              } finally {
                setSharingLoading(false);
              }
            },
          },
        ],
      );
    } else {
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

  useFocusEffect(
    useCallback(() => {
      if (vehicle) {
        fetchVehicleData();
      }
    }, [fetchVehicleData, vehicle]),
  );

  useEffect(() => {
    setMileageCurrentPage(1);
    setFuelCurrentPage(1);
    setServiceCurrentPage(1);
  }, [activeTab]);

  // Pagination helpers
  const getPaginatedItems = (items: any[], currentPage: number) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return items.slice(startIndex, endIndex);
  };

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / ITEMS_PER_PAGE);
  };

  const getPageRange = (currentPage: number, totalItems: number) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);
    return { startIndex, endIndex };
  };

  // Components
  const StatCard = ({ title, value, subtitle, icon }: any) => (
    <View style={{ flex: 1, minWidth: "45%" }}>
      <Card variant="outlined">
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.colors.primary + "20",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconSymbol name={icon} size={20} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.colors.text }}>
              {value}
            </Text>
            <Text style={{ fontSize: 12, color: theme.colors.textSecondary, fontWeight: "600" }}>
              {title}
            </Text>
            {subtitle && (
              <Text style={{ fontSize: 10, color: theme.colors.textSecondary, marginTop: 2 }}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
      </Card>
    </View>
  );

  const PaginationControls = ({
    currentPage,
    totalItems,
    onPageChange,
  }: {
    currentPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  }) => {
    const totalPages = getTotalPages(totalItems);
    const { startIndex, endIndex } = getPageRange(currentPage, totalItems);

    if (totalItems === 0) return null;

    return (
      <View style={{ marginTop: theme.spacing.md }}>
        <Text style={{ fontSize: 12, color: theme.colors.textSecondary, textAlign: "center", marginBottom: theme.spacing.sm }}>
          Showing {startIndex}-{endIndex} of {totalItems}
        </Text>
        <View style={{ flexDirection: "row", gap: theme.spacing.xs, justifyContent: "center" }}>
          <TouchableOpacity
            style={{
              padding: theme.spacing.sm,
              borderRadius: theme.spacing.sm,
              backgroundColor: currentPage === 1 ? theme.colors.surface : theme.colors.primary,
              minWidth: 40,
              alignItems: "center",
            }}
            onPress={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <IconSymbol
              name="chevron.left"
              size={16}
              color={currentPage === 1 ? theme.colors.textSecondary : "#fff"}
            />
          </TouchableOpacity>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <TouchableOpacity
              key={page}
              style={{
                padding: theme.spacing.sm,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.spacing.sm,
                backgroundColor: currentPage === page ? theme.colors.primary : theme.colors.surface,
                minWidth: 40,
                alignItems: "center",
              }}
              onPress={() => onPageChange(page)}
            >
              <Text style={{ color: currentPage === page ? "#fff" : theme.colors.text, fontWeight: "600" }}>
                {page}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={{
              padding: theme.spacing.sm,
              borderRadius: theme.spacing.sm,
              backgroundColor: currentPage === totalPages ? theme.colors.surface : theme.colors.primary,
              minWidth: 40,
              alignItems: "center",
            }}
            onPress={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <IconSymbol
              name="chevron.right"
              size={16}
              color={currentPage === totalPages ? theme.colors.textSecondary : "#fff"}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const LogItem = ({ log, icon, isServiceLog = false }: any) => {
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

    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={!isServiceLog}
        activeOpacity={isServiceLog ? 0.7 : 1}
      >
        <View style={{ marginBottom: theme.spacing.sm }}>
          <Card variant="outlined">
            <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: theme.colors.primary + "20",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconSymbol name={icon} size={16} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: theme.colors.text }}>
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
                  <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 }}>
                    {getLogSubtext()}
                  </Text>
                )}
                <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 }}>
                  {formatDate(log.date || log.created_at)}
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading || !vehicle) {
    return (
      <DetailLayout
        loading={loading}
        header={{
          title: "Loading...",
          subtitle: "Please wait",
          showBack: true,
        }}
        hero={<View style={{ height: 200, backgroundColor: theme.colors.surface }} />}
        tabs={[]}
        activeTab=""
        onTabChange={() => {}}
      />
    );
  }

  // Hero content with vehicle image and info
  const heroContent = (
    <View>
      {/* Vehicle Image */}
      {vehicle.main_image_url && !imageError ? (
        <Image
          source={{ uri: vehicle.main_image_url }}
          style={{ width: "100%", height: 200, borderRadius: theme.spacing.md }}
          contentFit="cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <View
          style={{
            width: "100%",
            height: 200,
            borderRadius: theme.spacing.md,
            backgroundColor: theme.colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconSymbol name="car.fill" size={64} color="#fff" />
        </View>
      )}

      <Spacer size="md" />

      {/* Vehicle Info Card */}
      <Card variant="elevated">
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.colors.text }}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </Text>
            <Text style={{ fontSize: 16, color: theme.colors.textSecondary, fontWeight: "600", marginTop: 4 }}>
              {vehicle.license_plate}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                {vehicle.color}
              </Text>
              <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                VIN: {vehicle.vin || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Ownership Badge */}
        {!vehicle.is_own_vehicle && (
          <>
            <Spacer size="sm" />
            <View
              style={{
                backgroundColor: theme.colors.warning + "20",
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.spacing.sm,
                alignSelf: "flex-start",
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "700", color: theme.colors.warning, textTransform: "uppercase" }}>
                Shared Vehicle
              </Text>
            </View>
          </>
        )}
      </Card>

      <Spacer size="md" />

      {/* Sharing Section - Only for owners */}
      {vehicle.is_own_vehicle && (
        <>
          <Card variant="outlined">
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "bold", color: theme.colors.text }}>
                  Vehicle Sharing
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 }}>
                  {vehicle.sharing_info?.is_shared
                    ? `Shared with ${vehicle.sharing_info.total_shares} group(s)`
                    : "Not shared with any groups"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  handleToggleSharing(!vehicle.sharing_info?.is_shared)
                }
                disabled={sharingLoading}
                style={{
                  backgroundColor: vehicle.sharing_info?.is_shared ? theme.colors.primary : theme.colors.surface,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.spacing.md,
                }}
              >
                <Text style={{ color: vehicle.sharing_info?.is_shared ? "#fff" : theme.colors.text, fontWeight: "600" }}>
                  {sharingLoading ? "..." : vehicle.sharing_info?.is_shared ? "Unshare" : "Share"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Expandable groups list */}
            {vehicle.sharing_info?.is_shared && vehicle.sharing_info.total_shares > 0 && (
              <>
                <Spacer size="sm" />
                <TouchableOpacity onPress={() => setSharingExpanded(!sharingExpanded)}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}>
                    <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: "600" }}>
                      {sharingExpanded ? "Hide" : "Show"} groups
                    </Text>
                    <IconSymbol
                      name={sharingExpanded ? "chevron.up" : "chevron.down"}
                      size={14}
                      color={theme.colors.primary}
                    />
                  </View>
                </TouchableOpacity>

                {sharingExpanded && (
                  <>
                    <Spacer size="sm" />
                    {vehicle.sharing_info.shared_with_groups.map((groupName, index) => (
                      <View
                        key={index}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: theme.spacing.sm,
                          paddingVertical: theme.spacing.xs,
                          paddingHorizontal: theme.spacing.sm,
                          backgroundColor: theme.colors.surface,
                          borderRadius: theme.spacing.sm,
                          marginTop: theme.spacing.xs,
                        }}
                      >
                        <View
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: theme.colors.primary + "30",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <IconSymbol name="person.2.fill" size={14} color={theme.colors.primary} />
                        </View>
                        <Text style={{ fontSize: 13, color: theme.colors.text, fontWeight: "500" }}>
                          {groupName}
                        </Text>
                      </View>
                    ))}
                  </>
                )}
              </>
            )}
          </Card>
          <Spacer size="md" />
        </>
      )}

      {/* Stats Grid */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
        <StatCard
          title="Current Mileage"
          value={(() => {
            const currentMileage =
              vehicle.current_mileage && vehicle.current_mileage > 0
                ? vehicle.current_mileage
                : vehicle.logs?.latest_mileage?.odometer_reading;
            return currentMileage ? currentMileage.toLocaleString() : "N/A";
          })()}
          subtitle={(() => {
            const currentMileage =
              vehicle.current_mileage && vehicle.current_mileage > 0
                ? vehicle.current_mileage
                : vehicle.logs?.latest_mileage?.odometer_reading;
            return currentMileage ? "km" : undefined;
          })()}
          icon="speedometer"
        />
        <StatCard
          title="Fuel Records"
          value={(() => {
            if (vehicle.logs?.counts?.access_status?.fuel_accessible === false) {
              return vehicle.logs.counts.access_status.has_permission_issues
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
            if (vehicle.logs?.counts?.access_status?.service_accessible === false) {
              return vehicle.logs.counts.access_status.has_permission_issues
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
            if (vehicle.logs?.counts?.access_status?.mileage_accessible === false) {
              return vehicle.logs.counts.access_status.has_permission_issues
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
    </View>
  );

  // Define tabs
  const tabs: DetailTab[] = [
    {
      id: "mileage",
      label: "Mileage",
      content: (
        <View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.md }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: theme.colors.text }}>
              Recent Mileage Logs
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.primary,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.spacing.md,
                flexDirection: "row",
                gap: theme.spacing.xs,
                alignItems: "center",
              }}
              onPress={() => router.push(`/logs/mileage/add?vehicleId=${vehicle.id}` as any)}
            >
              <IconSymbol name="plus" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "600" }}>Add</Text>
            </TouchableOpacity>
          </View>

          {vehicle.mileage_logs && vehicle.mileage_logs.length > 0 ? (
            <>
              {getPaginatedItems(
                [...vehicle.mileage_logs].sort(
                  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
                ),
                mileageCurrentPage,
              ).map((log, index) => (
                <LogItem key={index} log={log} icon="speedometer" isServiceLog={false} />
              ))}
              <PaginationControls
                currentPage={mileageCurrentPage}
                totalItems={vehicle.mileage_logs.length}
                onPageChange={setMileageCurrentPage}
              />
            </>
          ) : (
            <Card variant="outlined">
              <Text style={{ fontSize: 14, color: theme.colors.textSecondary, textAlign: "center" }}>
                No mileage logs recorded yet
              </Text>
            </Card>
          )}
        </View>
      ),
    },
    {
      id: "fuel",
      label: "Fuel",
      content: (
        <View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.md }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: theme.colors.text }}>
              Recent Fuel Logs
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.primary,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.spacing.md,
                flexDirection: "row",
                gap: theme.spacing.xs,
                alignItems: "center",
              }}
              onPress={() => router.push(`/logs/fuel/add?vehicleId=${vehicle.id}` as any)}
            >
              <IconSymbol name="plus" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "600" }}>Add</Text>
            </TouchableOpacity>
          </View>

          {vehicle.fuel_logs && vehicle.fuel_logs.length > 0 ? (
            <>
              {getPaginatedItems(
                [...vehicle.fuel_logs].sort(
                  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
                ),
                fuelCurrentPage,
              ).map((log, index) => (
                <LogItem key={index} log={log} icon="fuelpump.fill" isServiceLog={false} />
              ))}
              <PaginationControls
                currentPage={fuelCurrentPage}
                totalItems={vehicle.fuel_logs.length}
                onPageChange={setFuelCurrentPage}
              />
            </>
          ) : (
            <Card variant="outlined">
              <Text style={{ fontSize: 14, color: theme.colors.textSecondary, textAlign: "center" }}>
                No fuel logs recorded yet
              </Text>
            </Card>
          )}
        </View>
      ),
    },
    {
      id: "service",
      label: "Service",
      content: (
        <View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.md }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: theme.colors.text }}>
              Recent Service Logs
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.primary,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.spacing.md,
                flexDirection: "row",
                gap: theme.spacing.xs,
                alignItems: "center",
              }}
              onPress={() => router.push(`/logs/service/add?vehicleId=${vehicle.id}` as any)}
            >
              <IconSymbol name="plus" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "600" }}>Add</Text>
            </TouchableOpacity>
          </View>

          {vehicle.service_logs && vehicle.service_logs.length > 0 ? (
            <>
              {getPaginatedItems(
                [...vehicle.service_logs].sort(
                  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
                ),
                serviceCurrentPage,
              ).map((log, index) => (
                <LogItem key={index} log={log} icon="wrench.and.screwdriver.fill" isServiceLog={true} />
              ))}
              <PaginationControls
                currentPage={serviceCurrentPage}
                totalItems={vehicle.service_logs.length}
                onPageChange={setServiceCurrentPage}
              />
            </>
          ) : (
            <Card variant="outlined">
              <Text style={{ fontSize: 14, color: theme.colors.textSecondary, textAlign: "center" }}>
                No service logs recorded yet
              </Text>
            </Card>
          )}
        </View>
      ),
    },
  ];

  return (
    <React.Fragment>
      <Head>
        <title>
          {vehicle.year} {vehicle.make} {vehicle.model} - Vehicle Management
        </title>
      </Head>

      <DetailLayout
        header={{
          title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          subtitle: vehicle.license_plate,
          showBack: true,
          actions: vehicle.is_own_vehicle
            ? [
                {
                  icon: "edit",
                  onPress: () => router.push(`/vehicles/${vehicle.id}/edit`),
                  label: "Edit",
                },
                {
                  icon: "delete",
                  onPress: handleDelete,
                  label: "Delete",
                },
              ]
            : undefined,
        }}
        hero={heroContent}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as LogTab)}
        refreshable
        onRefresh={onRefresh}
      />

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
    </React.Fragment>
  );
}
