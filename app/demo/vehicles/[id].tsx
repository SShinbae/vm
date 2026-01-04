// @ts-nocheck - Demo file with known unistyles type incompatibilities
/**
 * Demo Vehicle Detail Page
 *
 * Shows vehicle details with edit/delete options
 * Edit and delete show alerts that changes won't be saved in demo mode
 */

import { ActionMenu } from "@/components/ui/ActionMenu";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AlertModal, ConfirmModal } from "@/components/ui/Modal";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatDate } from "@/lib/utils/dateUtils";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Import demo data
import {
  getMockVehicleById,
  getMockFuelLogsByVehicleId,
  getMockServiceLogsByVehicleId,
  getMockMileageLogsByVehicleId,
} from "@/lib/demo/mockData";

type LogTab = "mileage" | "fuel" | "service";

export default function DemoVehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [activeTab, setActiveTab] = useState<LogTab>("mileage");

  // Pagination states
  const [mileageCurrentPage, setMileageCurrentPage] = useState(1);
  const [fuelCurrentPage, setFuelCurrentPage] = useState(1);
  const [serviceCurrentPage, setServiceCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Modal states
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertVariant, setAlertVariant] = useState<
    "info" | "success" | "warning" | "error"
  >("info");

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const fetchVehicleData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const vehicleData = getMockVehicleById(id);
      if (vehicleData) {
        const mileageLogs = getMockMileageLogsByVehicleId(id);
        const fuelLogs = getMockFuelLogsByVehicleId(id);
        const serviceLogs = getMockServiceLogsByVehicleId(id);

        setVehicle({
          ...vehicleData,
          mileage_logs: mileageLogs,
          fuel_logs: fuelLogs,
          service_logs: serviceLogs,
        });
      } else {
        showAlert("Error", "Kenderaan tidak dijumpai", "error");
        router.back();
      }
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      showAlert("Error", "Gagal memuatkan maklumat kenderaan", "error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVehicleData();
  }, [fetchVehicleData]);

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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVehicleData().finally(() => setRefreshing(false));
  }, [fetchVehicleData]);

  const handleEdit = () => {
    Alert.alert(
      "Mod Demo",
      "Kemaskini kenderaan tidak tersedia dalam mod demo. Sila cipta akaun untuk menggunakan ciri ini.",
      [{ text: "OK" }],
    );
  };

  const handleDelete = () => {
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    setDeleteModalVisible(false);
    Alert.alert(
      "Mod Demo",
      "Padam kenderaan tidak tersedia dalam mod demo. Dalam aplikasi sebenar, kenderaan ini akan dipadam.",
      [
        {
          text: "OK",
          onPress: () => {
            // In real app, would delete and go back
            // For demo, just show success message
            showAlert(
              "Simulasi",
              "Dalam aplikasi sebenar, kenderaan telah dipadam.",
              "info",
            );
          },
        },
      ],
    );
  };

  const handleAddLog = (type: LogTab) => {
    Alert.alert(
      "Mod Demo",
      `Tambah log ${type === "mileage" ? "perbatuan" : type === "fuel" ? "minyak" : "servis"} tidak tersedia dalam mod demo. Sila cipta akaun untuk menggunakan ciri ini.`,
      [{ text: "OK" }],
    );
  };

  const handleEditLog = (logType: LogTab, logId: string) => {
    Alert.alert(
      "Mod Demo",
      "Kemaskini log tidak tersedia dalam mod demo. Sila cipta akaun untuk menggunakan ciri ini.",
      [{ text: "OK" }],
    );
  };

  const handleDeleteLog = (logType: LogTab, logId: string) => {
    Alert.alert(
      "Mod Demo",
      "Padam log tidak tersedia dalam mod demo. Dalam aplikasi sebenar, log ini akan dipadam.",
      [{ text: "OK" }],
    );
  };

  if (loading || !vehicle) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Memuatkan...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const mileageLogs = vehicle.mileage_logs || [];
  const fuelLogs = vehicle.fuel_logs || [];
  const serviceLogs = vehicle.service_logs || [];

  // Pagination
  const paginatedMileageLogs = mileageLogs.slice(
    (mileageCurrentPage - 1) * ITEMS_PER_PAGE,
    mileageCurrentPage * ITEMS_PER_PAGE,
  );
  const paginatedFuelLogs = fuelLogs.slice(
    (fuelCurrentPage - 1) * ITEMS_PER_PAGE,
    fuelCurrentPage * ITEMS_PER_PAGE,
  );
  const paginatedServiceLogs = serviceLogs.slice(
    (serviceCurrentPage - 1) * ITEMS_PER_PAGE,
    serviceCurrentPage * ITEMS_PER_PAGE,
  );

  const totalMileagePages = Math.ceil(mileageLogs.length / ITEMS_PER_PAGE);
  const totalFuelPages = Math.ceil(fuelLogs.length / ITEMS_PER_PAGE);
  const totalServicePages = Math.ceil(serviceLogs.length / ITEMS_PER_PAGE);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Maklumat Kenderaan
          </Text>
          <ActionMenu
            items={[
              {
                icon: "pencil",
                label: "Kemaskini Kenderaan",
                onPress: handleEdit,
              },
              {
                icon: "trash",
                label: "Padam Kenderaan",
                onPress: handleDelete,
                variant: "danger",
              },
            ]}
          />
        </View>

        {/* Vehicle Info Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {vehicle.main_image_url && !imageError ? (
            <Image
              source={{ uri: vehicle.main_image_url }}
              style={styles.vehicleImage}
              contentFit="cover"
              transition={200}
              onError={() => setImageError(true)}
            />
          ) : (
            <View
              style={[
                styles.vehiclePlaceholder,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <IconSymbol name="car.fill" size={48} color={colors.primary} />
            </View>
          )}

          <Text style={[styles.vehicleName, { color: colors.text }]}>
            {vehicleName}
          </Text>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text
                style={[styles.detailLabel, { color: colors.textSecondary }]}
              >
                Plat Nombor
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {vehicle.license_plate}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text
                style={[styles.detailLabel, { color: colors.textSecondary }]}
              >
                Warna
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {vehicle.color}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text
                style={[styles.detailLabel, { color: colors.textSecondary }]}
              >
                Perbatuan
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {vehicle.current_mileage.toLocaleString()} km
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text
                style={[styles.detailLabel, { color: colors.textSecondary }]}
              >
                Jenis Bahan Api
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {vehicle.fuel_type}
              </Text>
            </View>
          </View>

          {vehicle.notes && (
            <View style={styles.notesSection}>
              <Text
                style={[styles.detailLabel, { color: colors.textSecondary }]}
              >
                Nota
              </Text>
              <Text style={[styles.notesText, { color: colors.text }]}>
                {vehicle.notes}
              </Text>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "mileage" && [
                styles.activeTab,
                { borderBottomColor: colors.primary },
              ],
            ]}
            onPress={() => setActiveTab("mileage")}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.textSecondary },
                activeTab === "mileage" && [
                  styles.activeTabText,
                  { color: colors.primary },
                ],
              ]}
            >
              Perbatuan ({mileageLogs.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "fuel" && [
                styles.activeTab,
                { borderBottomColor: colors.primary },
              ],
            ]}
            onPress={() => setActiveTab("fuel")}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.textSecondary },
                activeTab === "fuel" && [
                  styles.activeTabText,
                  { color: colors.primary },
                ],
              ]}
            >
              Minyak ({fuelLogs.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "service" && [
                styles.activeTab,
                { borderBottomColor: colors.primary },
              ],
            ]}
            onPress={() => setActiveTab("service")}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.textSecondary },
                activeTab === "service" && [
                  styles.activeTabText,
                  { color: colors.primary },
                ],
              ]}
            >
              Servis ({serviceLogs.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {/* Mileage Tab */}
          {activeTab === "mileage" && (
            <View>
              <View style={styles.tabHeader}>
                <Text style={[styles.tabTitle, { color: colors.text }]}>
                  Log Perbatuan
                </Text>
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => handleAddLog("mileage")}
                >
                  <IconSymbol name="plus" size={20} color="#FFFFFF" />
                  <Text style={[styles.addButtonText, { color: "#FFFFFF" }]}>
                    Tambah
                  </Text>
                </TouchableOpacity>
              </View>

              {paginatedMileageLogs.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text
                    style={[styles.emptyText, { color: colors.textSecondary }]}
                  >
                    Tiada log perbatuan
                  </Text>
                </View>
              ) : (
                paginatedMileageLogs.map((log: any) => (
                  <View
                    key={log.id}
                    style={[
                      styles.logCard,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <View style={styles.logHeader}>
                      <Text style={[styles.logDate, { color: colors.text }]}>
                        {formatDate(log.date)}
                      </Text>
                      <ActionMenu
                        items={[
                          {
                            icon: "pencil",
                            label: "Kemaskini",
                            onPress: () => handleEditLog("mileage", log.id),
                          },
                          {
                            icon: "trash",
                            label: "Padam",
                            onPress: () => handleDeleteLog("mileage", log.id),
                            variant: "danger",
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.logValue, { color: colors.primary }]}>
                      {log.odometer_reading.toLocaleString()} km
                    </Text>
                    {log.notes && (
                      <Text
                        style={[
                          styles.logNotes,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {log.notes}
                      </Text>
                    )}
                  </View>
                ))
              )}

              {/* Pagination */}
              {totalMileagePages > 1 && (
                <View style={styles.pagination}>
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      { backgroundColor: colors.surface },
                    ]}
                    onPress={() =>
                      setMileageCurrentPage(Math.max(1, mileageCurrentPage - 1))
                    }
                    disabled={mileageCurrentPage === 1}
                  >
                    <IconSymbol
                      name="chevron.left"
                      size={20}
                      color={
                        mileageCurrentPage === 1
                          ? colors.textTertiary
                          : colors.text
                      }
                    />
                  </TouchableOpacity>
                  <Text style={[styles.paginationText, { color: colors.text }]}>
                    {mileageCurrentPage} / {totalMileagePages}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      { backgroundColor: colors.surface },
                    ]}
                    onPress={() =>
                      setMileageCurrentPage(
                        Math.min(totalMileagePages, mileageCurrentPage + 1),
                      )
                    }
                    disabled={mileageCurrentPage === totalMileagePages}
                  >
                    <IconSymbol
                      name="chevron.right"
                      size={20}
                      color={
                        mileageCurrentPage === totalMileagePages
                          ? colors.textTertiary
                          : colors.text
                      }
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Fuel Tab */}
          {activeTab === "fuel" && (
            <View>
              <View style={styles.tabHeader}>
                <Text style={[styles.tabTitle, { color: colors.text }]}>
                  Log Minyak
                </Text>
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => handleAddLog("fuel")}
                >
                  <IconSymbol name="plus" size={20} color="#FFFFFF" />
                  <Text style={[styles.addButtonText, { color: "#FFFFFF" }]}>
                    Tambah
                  </Text>
                </TouchableOpacity>
              </View>

              {paginatedFuelLogs.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text
                    style={[styles.emptyText, { color: colors.textSecondary }]}
                  >
                    Tiada log minyak
                  </Text>
                </View>
              ) : (
                paginatedFuelLogs.map((log: any) => (
                  <View
                    key={log.id}
                    style={[
                      styles.logCard,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <View style={styles.logHeader}>
                      <Text style={[styles.logDate, { color: colors.text }]}>
                        {formatDate(log.date)}
                      </Text>
                      <ActionMenu
                        items={[
                          {
                            icon: "pencil",
                            label: "Kemaskini",
                            onPress: () => handleEditLog("fuel", log.id),
                          },
                          {
                            icon: "trash",
                            label: "Padam",
                            onPress: () => handleDeleteLog("fuel", log.id),
                            variant: "danger",
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.logValue, { color: colors.primary }]}>
                      RM{(log.cost || 0).toFixed(2)}
                    </Text>
                    <View style={styles.logDetails}>
                      <Text
                        style={[
                          styles.logDetail,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {log.liters_filled}L
                      </Text>
                      {log.location && (
                        <Text
                          style={[
                            styles.logDetail,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {log.location}
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              )}

              {/* Pagination */}
              {totalFuelPages > 1 && (
                <View style={styles.pagination}>
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      { backgroundColor: colors.surface },
                    ]}
                    onPress={() =>
                      setFuelCurrentPage(Math.max(1, fuelCurrentPage - 1))
                    }
                    disabled={fuelCurrentPage === 1}
                  >
                    <IconSymbol
                      name="chevron.left"
                      size={20}
                      color={
                        fuelCurrentPage === 1
                          ? colors.textTertiary
                          : colors.text
                      }
                    />
                  </TouchableOpacity>
                  <Text style={[styles.paginationText, { color: colors.text }]}>
                    {fuelCurrentPage} / {totalFuelPages}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      { backgroundColor: colors.surface },
                    ]}
                    onPress={() =>
                      setFuelCurrentPage(
                        Math.min(totalFuelPages, fuelCurrentPage + 1),
                      )
                    }
                    disabled={fuelCurrentPage === totalFuelPages}
                  >
                    <IconSymbol
                      name="chevron.right"
                      size={20}
                      color={
                        fuelCurrentPage === totalFuelPages
                          ? colors.textTertiary
                          : colors.text
                      }
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Service Tab */}
          {activeTab === "service" && (
            <View>
              <View style={styles.tabHeader}>
                <Text style={[styles.tabTitle, { color: colors.text }]}>
                  Log Servis
                </Text>
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => handleAddLog("service")}
                >
                  <IconSymbol name="plus" size={20} color="#FFFFFF" />
                  <Text style={[styles.addButtonText, { color: "#FFFFFF" }]}>
                    Tambah
                  </Text>
                </TouchableOpacity>
              </View>

              {paginatedServiceLogs.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text
                    style={[styles.emptyText, { color: colors.textSecondary }]}
                  >
                    Tiada log servis
                  </Text>
                </View>
              ) : (
                paginatedServiceLogs.map((log: any) => (
                  <View
                    key={log.id}
                    style={[
                      styles.logCard,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <View style={styles.logHeader}>
                      <Text style={[styles.logDate, { color: colors.text }]}>
                        {formatDate(log.date)}
                      </Text>
                      <ActionMenu
                        items={[
                          {
                            icon: "pencil",
                            label: "Kemaskini",
                            onPress: () => handleEditLog("service", log.id),
                          },
                          {
                            icon: "trash",
                            label: "Padam",
                            onPress: () => handleDeleteLog("service", log.id),
                            variant: "danger",
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.serviceType, { color: colors.text }]}>
                      {log.service_type}
                    </Text>
                    <Text style={[styles.logValue, { color: colors.primary }]}>
                      RM{(log.cost || 0).toFixed(2)}
                    </Text>
                    {log.description && (
                      <Text
                        style={[
                          styles.logNotes,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {log.description}
                      </Text>
                    )}
                  </View>
                ))
              )}

              {/* Pagination */}
              {totalServicePages > 1 && (
                <View style={styles.pagination}>
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      { backgroundColor: colors.surface },
                    ]}
                    onPress={() =>
                      setServiceCurrentPage(Math.max(1, serviceCurrentPage - 1))
                    }
                    disabled={serviceCurrentPage === 1}
                  >
                    <IconSymbol
                      name="chevron.left"
                      size={20}
                      color={
                        serviceCurrentPage === 1
                          ? colors.textTertiary
                          : colors.text
                      }
                    />
                  </TouchableOpacity>
                  <Text style={[styles.paginationText, { color: colors.text }]}>
                    {serviceCurrentPage} / {totalServicePages}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      { backgroundColor: colors.surface },
                    ]}
                    onPress={() =>
                      setServiceCurrentPage(
                        Math.min(totalServicePages, serviceCurrentPage + 1),
                      )
                    }
                    disabled={serviceCurrentPage === totalServicePages}
                  >
                    <IconSymbol
                      name="chevron.right"
                      size={20}
                      color={
                        serviceCurrentPage === totalServicePages
                          ? colors.textTertiary
                          : colors.text
                      }
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Padam Kenderaan?"
        message="Adakah anda pasti mahu memadam kenderaan ini? Tindakan ini tidak boleh dibatalkan dalam aplikasi sebenar."
        confirmText="Padam"
        cancelText="Batal"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
        variant="destructive"
      />

      {/* Alert Modal */}
      <AlertModal
        visible={alertModalVisible}
        title={alertTitle}
        message={alertMessage}
        variant={alertVariant}
        onClose={() => setAlertModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  menuButton: {
    padding: 8,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  vehicleImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  vehiclePlaceholder: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  detailItem: {
    flex: 1,
    minWidth: 140,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  notesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activeTabText: {
    fontWeight: "600",
  },
  tabContent: {
    padding: 16,
  },
  tabHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  logCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  logDate: {
    fontSize: 14,
    fontWeight: "500",
  },
  logValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  serviceType: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  logDetails: {
    gap: 4,
  },
  logDetail: {
    fontSize: 14,
  },
  logNotes: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: "italic",
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginTop: 16,
  },
  paginationButton: {
    padding: 8,
    borderRadius: 8,
  },
  paginationText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
