import { withOpacity, spacing } from "@/src/design-system";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useStyles } from "react-native-unistyles";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Input } from "@/components/ui/Input";
import { SkeletonMileageLogForm } from "@/components/ui/Skeleton";
import { useToast } from "@/hooks/useToast";
import { MileageLogService } from "@/lib/services/loggingService";
import { VehicleService } from "@/lib/services/vehicleService";
import { MileageLogFormData } from "@/types";
import { VehicleWithDetails } from "@/types/database-v2";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { usePostHog } from "posthog-react-native";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Separate component to handle vehicle option rendering with proper hook usage
const VehicleOption: React.FC<{
  vehicle: VehicleWithDetails;
  isSelected: boolean;
  onPress: () => void;
  styles: any;
}> = ({ vehicle, isSelected, onPress, styles }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.vehicleOption, isSelected && styles.vehicleOptionSelected]}
      onPress={onPress}
    >
      {vehicle.main_image_url && !imageError ? (
        <Image
          source={{ uri: vehicle.main_image_url }}
          style={styles.vehicleIcon}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={styles.vehicleIcon}>
          <IconSymbol name="car.fill" size={16} color="white" />
        </View>
      )}
      <Text
        style={[
          styles.vehicleOptionText,
          isSelected && styles.vehicleOptionTextSelected,
        ]}
      >
        {vehicle.year} {vehicle.make}
      </Text>
      <Text
        style={[
          styles.vehiclePlateText,
          isSelected && styles.vehiclePlateTextSelected,
        ]}
      >
        {vehicle.license_plate}
      </Text>
    </TouchableOpacity>
  );
};

export default function AddMileageLogScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId?: string }>();
  const [vehicles, setVehicles] = useState<VehicleWithDetails[]>([]);
  const [formData, setFormData] = useState<MileageLogFormData>({
    vehicle_id: vehicleId || "",
    odometer_reading: 0,
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const { showSuccess, showError } = useToast();
  const posthog = usePostHog();
  const { theme } = useStyles();
  const colorScheme = useColorScheme();
  const colors = theme.colors;
  const isWeb = Platform.OS === "web";

  // --- Custom Header (standardized across all log forms) ---
  const CustomHeader = () => {
    const headerTitle =
      vehicleId && vehicles.find((v) => v.id === vehicleId)
        ? `Add Mileage - ${vehicles.find((v) => v.id === vehicleId)?.year} ${vehicles.find((v) => v.id === vehicleId)?.make}`
        : "Add Mileage Log";

    return (
      <View style={styles.customHeader}>
        <TouchableOpacity
          style={styles.customBackButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          {!isWeb && (
            <Text style={styles.headerSubtitle}>
              Record your vehicle&apos;s mileage
            </Text>
          )}
        </View>
      </View>
    );
  };

  useEffect(() => {
    const fetchVehicles = async () => {
      const { data, error } = await VehicleService.getVehiclesSeparated();
      if (!error && data) {
        const allVehicles = [...data.ownVehicles, ...data.sharedVehicles];
        setVehicles(allVehicles);
        if (!vehicleId && allVehicles.length > 0) {
          setFormData((prev) => ({ ...prev, vehicle_id: allVehicles[0].id }));
        }
      }
      setVehiclesLoading(false);
    };

    fetchVehicles();
  }, [vehicleId]);

  const handleSave = async () => {
    if (!formData.vehicle_id) {
      showError("Please select a vehicle");
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

    const logData = {
      vehicle_id: formData.vehicle_id,
      odometer_reading: formData.odometer_reading,
      date: formData.date,
      notes: formData.notes?.trim() || undefined,
    };

    const { error } = await MileageLogService.createMileageLog(logData);
    setLoading(false);

    if (error) {
      showError(error);
    } else {
      posthog?.capture("mileage_log_created", {
        odometer_reading: logData.odometer_reading,
      });
      showSuccess("Mileage log added successfully!");
      router.push("/(tabs)/logs");
    }
  };

  const validateOdometer = (value: string) => {
    const num = parseInt(value.replace(/,/g, ""));
    if (isNaN(num) || num <= 0) return "Please enter a valid odometer reading";
    return undefined;
  };

  const isFormValid = () => {
    return (
      formData.vehicle_id && formData.odometer_reading > 0 && formData.date
    );
  };

  const VehicleSelector = () => {
    const selectedVehicle = vehicles.find((v) => v.id === formData.vehicle_id);
    const isLocked = !!vehicleId;
    const [imageError, setImageError] = React.useState(false);

    if (isLocked && selectedVehicle) {
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Vehicle <Text style={styles.requiredLabel}>*</Text>
          </Text>
          <View style={styles.lockedVehicleContainer}>
            <View style={styles.lockedVehicle}>
              {selectedVehicle.main_image_url && !imageError ? (
                <Image
                  source={{ uri: selectedVehicle.main_image_url }}
                  style={styles.vehicleIcon}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                  onError={() => setImageError(true)}
                />
              ) : (
                <View style={styles.vehicleIcon}>
                  <IconSymbol name="car.fill" size={16} color="white" />
                </View>
              )}
              <View style={styles.lockedVehicleInfo}>
                <Text style={styles.lockedVehicleText}>
                  {selectedVehicle.year} {selectedVehicle.make}{" "}
                  {selectedVehicle.model}
                </Text>
                <Text style={styles.lockedVehiclePlate}>
                  {selectedVehicle.license_plate}
                </Text>
              </View>
              <View style={styles.lockIcon}>
                <IconSymbol
                  name="lock.fill"
                  size={14}
                  color={colors.textSecondary}
                />
              </View>
            </View>
            <Text style={styles.lockedHelpText}>
              Adding mileage log for this vehicle
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Vehicle <Text style={styles.requiredLabel}>*</Text>
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.vehicleSelector}
          contentContainerStyle={styles.vehicleSelectorContent}
        >
          {vehicles.map((vehicle) => (
            <VehicleOption
              key={vehicle.id}
              vehicle={vehicle}
              isSelected={formData.vehicle_id === vehicle.id}
              onPress={() =>
                setFormData((prev) => ({ ...prev, vehicle_id: vehicle.id }))
              }
              styles={styles}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    // --- Standardized Header Styles ---
    customHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: withOpacity(colors.textSecondary, 0.12),
    },
    customBackButton: {
      marginRight: spacing.lg,
      padding: spacing.xs,
    },
    titleContainer: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: isWeb ? 40 : 20,
      paddingBottom: spacing.xxxl,
      ...(isWeb && {
        maxWidth: 600,
        width: "100%",
        alignSelf: "center",
      }),
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: spacing.lg,
    },
    card: {
      backgroundColor: colors.background,
      borderRadius: isWeb ? 16 : 12,
      padding: isWeb ? 32 : 20,
      ...(isWeb && {
        shadowColor:
          colorScheme === "dark" ? theme.colors.white : theme.colors.black,
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: colorScheme === "dark" ? 0.1 : 0.08,
        shadowRadius: 12,
        elevation: 4,
      }),
    },
    buttonContainer: {
      flexDirection: "row",
      gap: spacing.md,
      marginTop: spacing.xxl,
    },
    cancelButton: {
      flex: 1,
    },
    saveButton: {
      flex: 2,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    inputContainer: {
      marginBottom: spacing.xl,
    },
    label: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
      marginBottom: spacing.sm,
    },
    requiredLabel: {
      color: theme.colors.error,
    },
    vehicleSelector: {
      maxHeight: 120,
    },
    vehicleSelectorContent: {
      gap: spacing.md,
    },
    vehicleOption: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: withOpacity(colors.textSecondary, 0.19),
      borderRadius: 8,
      padding: spacing.md,
      minWidth: 120,
      alignItems: "center",
      gap: spacing.sm,
    },
    vehicleOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: withOpacity(colors.primary, 0.06),
    },
    vehicleIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    vehicleOptionText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      textAlign: "center",
    },
    vehicleOptionTextSelected: {
      color: colors.primary,
    },
    vehiclePlateText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: "center",
    },
    vehiclePlateTextSelected: {
      color: colors.primary,
    },
    lockedVehicleContainer: {
      gap: spacing.sm,
    },
    lockedVehicle: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 8,
      padding: spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    lockedVehicleInfo: {
      flex: 1,
    },
    lockedVehicleText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    lockedVehiclePlate: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    lockIcon: {
      padding: spacing.xs,
    },
    lockedHelpText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: "italic",
    },
  });

  if (vehiclesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <SkeletonMileageLogForm />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (vehicles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader />
        <View style={styles.loadingContainer}>
          <Text style={[styles.label, { textAlign: "center" }]}>
            No vehicles found. Please add a vehicle first.
          </Text>
          <Button
            title="Add Vehicle"
            onPress={() => router.push("/vehicles/add" as any)}
            icon="plus"
            style={{ marginTop: spacing.xl }}
          />
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
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <VehicleSelector />

            <Input
              label="Odometer Reading (km)"
              value={
                formData.odometer_reading > 0
                  ? formData.odometer_reading.toString()
                  : ""
              }
              onChangeText={(text) => {
                const reading = parseInt(text.replace(/,/g, "")) || 0;
                setFormData((prev) => ({ ...prev, odometer_reading: reading }));
              }}
              placeholder="150,000"
              keyboardType="numeric"
              required
              error={
                formData.odometer_reading
                  ? validateOdometer(formData.odometer_reading.toString())
                  : undefined
              }
              helperText="Enter the current odometer reading in kilometers"
              leftIcon="speedometer"
            />

            <DatePicker
              label="Date"
              value={formData.date}
              onDateChange={(date) =>
                setFormData((prev) => ({ ...prev, date }))
              }
              placeholder="Select date"
              required
            />

            <Input
              label="Notes (Optional)"
              value={formData.notes || ""}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, notes: text }))
              }
              placeholder="Add any additional notes about this reading..."
              multiline
              numberOfLines={3}
            />

            <View style={styles.buttonContainer}>
              <Button
                title="Cancel"
                onPress={() => router.back()}
                variant="outline"
                icon="xmark"
                style={styles.cancelButton}
              />
              <Button
                title="Save Log"
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
    </SafeAreaView>
  );
}
