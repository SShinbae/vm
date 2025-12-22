import { ActionMenu, ActionMenuItem } from "@/components/ui/ActionMenu";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Input } from "@/components/ui/Input";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/hooks/useToast";
import { FuelLogService } from "@/lib/services/loggingService";
import { canUserAccessVehicle } from "@/lib/utils/serviceUtils";
import { supabase } from "@/services/supabaseClient";
import { FuelLog, FuelLogFormData, Vehicle } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createStyleSheet, useStyles } from "react-native-unistyles";

type FuelLogWithVehicle = FuelLog & {
  vehicles: Vehicle | null;
};

export default function EditFuelLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { styles, theme } = useStyles(stylesheet);
  const [fuelLog, setFuelLog] = useState<FuelLogWithVehicle | null>(null);
  const [formData, setFormData] = useState<FuelLogFormData>({
    vehicle_id: "",
    liters_filled: 0,
    cost: 0,
    fuel_price: 1.99, // Default to first option
    date: new Date().toISOString().split("T")[0],
    odometer_reading: 0,
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const { showSuccess, showError } = useToast();
  const [canModify, setCanModify] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const isWeb = Platform.OS === "web";

  // Auto-calculate liters based on cost and fuel price (only this direction)
  const calculateLiters = (cost: number, fuelPrice: number) => {
    if (fuelPrice > 0 && cost > 0) {
      return Math.round((cost / fuelPrice) * 1000) / 1000; // Round to 3 decimal places
    }
    return 0;
  };

  useEffect(() => {
    const fetchFuelLog = async () => {
      if (!id) {
        showError("Invalid fuel log ID");
        router.back();
        return;
      }

      try {
        const { data: log, error } = await FuelLogService.getFuelLogById(id);
        if (error) {
          console.error("Error fetching fuel log:", error);
          let errorMsg = "Failed to load fuel log";
          if (error.includes("User not authenticated")) {
            errorMsg = "Your session has expired. Please log in again.";
          } else if (error.includes("Failed to fetch")) {
            errorMsg =
              "Unable to load fuel log. Please check your internet connection.";
          }
          showError(errorMsg);
          router.back();
          return;
        }

        if (!log) {
          console.error("No fuel log found with ID:", id);
          showError(
            "This fuel log no longer exists. It may have been deleted.",
          );
          router.back();
          return;
        }

        setFuelLog(log as FuelLogWithVehicle);
        setFormData({
          vehicle_id: log.vehicle_id!,
          liters_filled: log.liters_filled,
          cost: log.cost || 0,
          fuel_price: (log as any).fuel_price || 1.99, // Default if not set
          date: log.date,
          odometer_reading: log.odometer_reading,
          location: log.location || "",
        });

        // Check if user can modify this log
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const canAccess = await canUserAccessVehicle(
            log.vehicle_id!,
            user.id,
          );
          setCanModify(canAccess);
        }
      } catch (error) {
        console.error("Error fetching fuel log:", error);
        showError("Failed to load fuel log");
        router.back();
      }

      setDataLoading(false);
    };

    fetchFuelLog();
  }, [id, showError]);

  const handleSave = async () => {
    // Validation
    if (!formData.cost || formData.cost <= 0) {
      showError("Please enter a valid cost amount");
      return;
    }
    if (!formData.fuel_price || formData.fuel_price <= 0) {
      showError("Please select a fuel price");
      return;
    }
    if (formData.odometer_reading <= 0) {
      showError("Please enter a valid odometer reading");
      return;
    }
    if (!formData.date) {
      showError("Please select a date");
      return;
    }

    setLoading(true);

    const updateData = {
      liters_filled: formData.liters_filled,
      cost: formData.cost || undefined,
      fuel_price: formData.fuel_price || undefined,
      date: formData.date,
      odometer_reading: formData.odometer_reading,
      location: formData.location?.trim() || undefined,
    };

    const { error } = await FuelLogService.updateFuelLog(id!, updateData);
    setLoading(false);

    if (error) {
      console.error("Error updating fuel log:", error);

      // Provide more specific error messages based on the error content
      let errorMsg = error;
      if (error.includes("not found") || error.includes("no longer exists")) {
        errorMsg =
          "This fuel log no longer exists. It may have been deleted by another user.";
      } else if (
        error.includes("Access denied") ||
        error.includes("permission")
      ) {
        errorMsg =
          "You do not have permission to edit this fuel log. Please contact the vehicle owner if this is a shared vehicle.";
      } else if (error.includes("User not authenticated")) {
        errorMsg = "Your session has expired. Please log in again.";
      } else if (error.includes("Failed to update fuel log")) {
        errorMsg =
          "Unable to save changes. Please check your internet connection and try again.";
      } else if (error.includes("could not be updated")) {
        errorMsg =
          "The fuel log could not be updated. It may have been deleted or you may not have sufficient permissions.";
      }

      showError(errorMsg);
    } else {
      showSuccess("Fuel log updated successfully!");
      router.push("/(tabs)/logs");
    }
  };

  const handleDelete = () => {
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      const { error } = await FuelLogService.deleteFuelLog(id!);
      setDeleteLoading(false);
      setDeleteModalVisible(false);

      if (error) {
        showError(error);
      } else {
        showSuccess("Fuel log deleted successfully!");
        router.push("/(tabs)/logs");
      }
    } catch (error) {
      console.error("Error deleting fuel log:", error);
      setDeleteLoading(false);
      setDeleteModalVisible(false);
      showError("Failed to delete fuel log");
    }
  };

  const validateCost = (value: string) => {
    const cost = parseFloat(value);
    if (isNaN(cost) || cost <= 0) {
      return "Please enter a valid cost amount";
    }
    return undefined;
  };

  const validateOdometer = (value: string) => {
    const reading = parseInt(value.replace(/,/g, ""));
    if (isNaN(reading) || reading <= 0) {
      return "Please enter a valid odometer reading";
    }
    return undefined;
  };

  const isFormValid = () => {
    return (
      formData.cost &&
      formData.cost > 0 &&
      formData.fuel_price &&
      formData.fuel_price > 0 &&
      formData.odometer_reading > 0 &&
      formData.date
    );
  };

  const actionMenuItems: ActionMenuItem[] = [
    {
      label: "Delete",
      icon: "trash",
      onPress: handleDelete,
      variant: "danger",
      disabled: !canModify,
    },
  ];

  // Custom Header Component
  const CustomHeader = () => (
    <View style={styles.customHeader}>
      <TouchableOpacity
        style={styles.customBackButton}
        onPress={() => router.back()}
      >
        <IconSymbol name="chevron.left" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text style={styles.headerTitle}>Edit Fuel Log</Text>
      </View>
      <ActionMenu items={actionMenuItems} />
    </View>
  );

  if (dataLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent(isWeb)}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isWeb && (
            <>
              <Text style={styles.title}>Edit Fuel Log</Text>
              <Text style={styles.subtitle}>Update your fuel log details</Text>
            </>
          )}

          <View style={styles.card(isWeb)}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Vehicle</Text>
              {fuelLog?.vehicles && (
                <View style={styles.vehicleInfo}>
                  <View style={styles.vehicleIcon}>
                    <IconSymbol name="car.fill" size={16} color="white" />
                  </View>
                  <View>
                    <Text style={styles.vehicleText}>
                      {fuelLog.vehicles.year} {fuelLog.vehicles.make}{" "}
                      {fuelLog.vehicles.model}
                    </Text>
                    <Text style={styles.vehiclePlate}>
                      {fuelLog.vehicles.license_plate}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fuel Details</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Fuel Price (RM per liter){" "}
                  <Text style={styles.requiredLabel}>*</Text>
                </Text>
                <View style={styles.fuelPriceSelector}>
                  {[1.99, 2.6, 3.21].map((price) => (
                    <TouchableOpacity
                      key={price}
                      style={[
                        styles.fuelPriceOption,
                        formData.fuel_price === price &&
                          styles.fuelPriceOptionSelected,
                      ]}
                      onPress={() => {
                        setFormData((prev) => {
                          const newData = { ...prev, fuel_price: price };

                          // Auto-calculate liters if cost is entered
                          if (prev.cost && prev.cost > 0) {
                            newData.liters_filled = calculateLiters(
                              prev.cost,
                              price,
                            );
                          }

                          return newData;
                        });
                      }}
                    >
                      <Text
                        style={[
                          styles.fuelPriceOptionText,
                          formData.fuel_price === price &&
                            styles.fuelPriceOptionTextSelected,
                        ]}
                      >
                        RM{price.toFixed(2)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Input
                    label="Cost (RM)"
                    value={formData.cost?.toString() || ""}
                    onChangeText={(text) => {
                      const cost = parseFloat(text) || 0;
                      setFormData((prev) => {
                        const newData = { ...prev, cost };

                        // Auto-calculate liters if fuel price is selected
                        if (
                          prev.fuel_price &&
                          prev.fuel_price > 0 &&
                          cost > 0
                        ) {
                          newData.liters_filled = calculateLiters(
                            cost,
                            prev.fuel_price,
                          );
                        }

                        return newData;
                      });
                    }}
                    placeholder="65.00"
                    keyboardType="numeric"
                    required
                    error={
                      formData.cost
                        ? validateCost(formData.cost.toString())
                        : undefined
                    }
                    leftIcon="dollarsign"
                  />
                </View>

                <View style={styles.flex1}>
                  <Input
                    label="Liters Filled"
                    value={formData.liters_filled.toString()}
                    placeholder="Auto-calculated"
                    onChangeText={() => {}}
                    editable={false}
                    helperText="Calculated from cost and fuel price"
                    leftIcon="drop"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Input
                    label="Odometer (km)"
                    value={formData.odometer_reading.toString()}
                    onChangeText={(text) => {
                      const reading = parseInt(text.replace(/,/g, "")) || 0;
                      setFormData((prev) => ({
                        ...prev,
                        odometer_reading: reading,
                      }));
                    }}
                    placeholder="150,000"
                    keyboardType="numeric"
                    required
                    error={
                      formData.odometer_reading
                        ? validateOdometer(formData.odometer_reading.toString())
                        : undefined
                    }
                    leftIcon="speedometer"
                  />
                </View>

                <View style={styles.flex1}>
                  <DatePicker
                    label="Date"
                    value={formData.date}
                    onDateChange={(date) =>
                      setFormData((prev) => ({ ...prev, date }))
                    }
                    placeholder="Select date"
                    required
                    style={{ marginBottom: 0 }}
                  />
                </View>
              </View>

              <Input
                label="Location (Optional)"
                value={formData.location || ""}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, location: text }))
                }
                placeholder="Petrol station name or location..."
                leftIcon="location"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                title="Cancel"
                onPress={() => router.back()}
                variant="outline"
                icon="xmark"
                style={styles.cancelButton}
              />
              <Button
                title="Save Changes"
                onPress={handleSave}
                disabled={!isFormValid()}
                loading={loading}
                icon="checkmark"
                style={styles.saveButton}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete Fuel Log"
        message="Are you sure you want to delete this fuel log? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalVisible(false)}
        loading={deleteLoading}
        variant="danger"
      />
    </SafeAreaView>
  );
}

// --- Stylesheet ---
const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  // --- Custom Header Styles ---
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  customBackButton: {
    marginRight: theme.spacing.md,
    padding: theme.spacing.xs,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  // --- End of Header Styles ---
  content: {
    flex: 1,
  },
  scrollContent: (isWeb: boolean) => ({
    padding: isWeb ? theme.spacing.xxl : theme.spacing.lg,
    paddingBottom: 100,
    ...(isWeb && {
      maxWidth: 600,
      width: "100%",
      alignSelf: "center",
    }),
  }),
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    textAlign: "center",
  },
  card: (isWeb: boolean) => ({
    backgroundColor: theme.colors.surface,
    borderRadius: isWeb ? theme.borderRadius.xl : theme.borderRadius.lg,
    padding: isWeb ? theme.spacing.xxl : theme.spacing.lg,
    ...(isWeb && {
      shadowColor: "#000000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    }),
  }),
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.base,
    fontWeight: "500",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  requiredLabel: {
    color: theme.colors.error,
  },
  row: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  flex1: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  vehicleInfo: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  vehicleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleText: {
    fontSize: theme.fontSize.base,
    fontWeight: "500",
    color: theme.colors.text,
  },
  vehiclePlate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  fuelPriceSelector: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  fuelPriceOption: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
  },
  fuelPriceOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + "15",
  },
  fuelPriceOptionText: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
    color: theme.colors.text,
  },
  fuelPriceOptionTextSelected: {
    color: theme.colors.primary,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.xxl,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
}));
