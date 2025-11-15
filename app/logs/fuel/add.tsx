import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Input } from "@/components/ui/Input";
import { AlertModal } from "@/components/ui/Modal";
import { router } from "expo-router";
import React from "react";
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

// Import the new hook and components
import { FuelPriceChip } from "@/components/forms/FuelPriceChip";
import { VehicleSelector } from "@/components/forms/VehicleSelector";
import { useAddFuelLog } from "@/hooks/useAddFuelLog";

export default function AddFuelLogScreen() {
  const { styles, theme } = useStyles(stylesheet);
  const {
    formData,
    vehicles,
    vehiclesLoading,
    loading,
    isWeb,
    isLocked, // Re-adding as it's used by VehicleSelector
    // selectedVehicle, // No longer used for header title
    fuelPrices,
    showSuccessModal,
    showErrorModal,
    errorMessage,
    handleCostChange,
    handlePriceChange,
    handleOdometerChange,
    handleDateChange,
    handleLocationChange,
    handleVehicleChange,
    handleSave,
    handleSuccessModalClose,
    handleErrorModalClose,
    validateCost,
    validateOdometer,
    isFormValid,
  } = useAddFuelLog();

  // --- New Custom Header ---
  const CustomHeader = () => (
    <View style={styles.customHeader}>
      <TouchableOpacity
        style={styles.customBackButton}
        onPress={() => router.back()}
      >
        <IconSymbol name="chevron.left" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Add Fuel Log</Text>
        {!isWeb && ( // Subtitle can be conditional if it feels too crowded on native
          <Text style={styles.subtitle}>Record your fuel fill-up</Text>
        )}
      </View>
    </View>
  );

  // Loading State
  if (vehiclesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.warning} />
        </View>
      </SafeAreaView>
    );
  }

  // Empty State
  if (vehicles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader />
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>
            No vehicles found. Please add a vehicle first.
          </Text>
          <Button
            title="Add Vehicle"
            onPress={() => router.push("/vehicles/add" as any)}
            icon="plus"
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Main Content
  return (
    <SafeAreaView style={styles.container}>
      {/* Render the new custom header here */}
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
          {/* Web-only title was here, it's now in CustomHeader */}

          <View style={styles.card(isWeb)}>
            <VehicleSelector
              vehicles={vehicles}
              selectedVehicleId={formData.vehicle_id}
              onSelectVehicle={handleVehicleChange}
              isLocked={isLocked} // isLocked is still needed for the selector
            />

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Fuel Price (RM per liter){" "}
                <Text style={styles.requiredLabel}>*</Text>
              </Text>
              <View style={styles.fuelPriceSelector}>
                {fuelPrices.map((price) => (
                  <FuelPriceChip
                    key={price}
                    price={price}
                    isSelected={formData.fuel_price === price}
                    onPress={() => handlePriceChange(price)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.row}>
              <Input
                label="Cost (RM)"
                value={formData.cost > 0 ? formData.cost.toString() : ""}
                onChangeText={handleCostChange}
                placeholder="65.00"
                keyboardType="numeric"
                required
                error={
                  formData.cost
                    ? validateCost(formData.cost.toString())
                    : undefined
                }
                leftIcon="dollarsign.circle"
                containerStyle={styles.flex1}
              />
              <Input
                label="Liters Filled"
                value={formData.liters_filled.toFixed(3)}
                onChangeText={() => {}}
                placeholder="Auto-calculated"
                editable={false}
                helperText="Auto-calculated"
                leftIcon="drop"
                containerStyle={styles.flex1}
              />
            </View>

            <Input
              label="Odometer Reading (km)"
              value={
                formData.odometer_reading > 0
                  ? formData.odometer_reading.toString()
                  : ""
              }
              onChangeText={handleOdometerChange}
              placeholder="150,000"
              keyboardType="numeric"
              required
              error={
                formData.odometer_reading
                  ? validateOdometer(formData.odometer_reading.toString())
                  : undefined
              }
              helperText="Odometer reading at fill-up"
              leftIcon="speedometer"
            />

            <Input
              label="Date"
              value={formData.date}
              onChangeText={handleDateChange}
              placeholder="2024-01-01"
              required
              helperText="Date format: YYYY-MM-DD"
              leftIcon="calendar"
            />

            <Input
              label="Location (Optional)"
              value={formData.location || ""}
              onChangeText={handleLocationChange}
              placeholder="Shell Station, Main St"
              helperText="Gas station or location"
              leftIcon="location"
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
                disabled={!isFormValid}
                loading={loading}
                icon="checkmark"
                style={styles.saveButton}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AlertModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Success"
        message="Fuel log added successfully!"
        variant="success"
        buttonText="Done"
      />

      <AlertModal
        visible={showErrorModal}
        onClose={handleErrorModalClose}
        title="Error"
        message={errorMessage}
        variant="error"
      />
    </SafeAreaView>
  );
}

// --- AppHeader component removed ---

// --- Stylesheet ---
const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface, // Use a subtle off-white/grey bg
  },
  // --- New Header Styles ---
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface, // Match container bg
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
  // --- Modified Title/Subtitle Styles ---
  title: {
    fontSize: 24, // Made title a bit larger
    fontWeight: "bold",
    color: theme.colors.text,
    // textAlign: "center", // Removed
    // marginBottom: theme.spacing.sm, // Removed
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
    // textAlign: "center", // Removed
    // marginBottom: theme.spacing.xl, // Removed
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
  card: (isWeb: boolean) => ({
    backgroundColor: theme.colors.background,
    borderRadius: isWeb ? theme.borderRadius.xl : theme.borderRadius.lg,
    padding: isWeb ? theme.spacing.xl : theme.spacing.lg,
    ...(isWeb && {
      borderWidth: 1,
      borderColor: theme.colors.border,
    }),
  }),
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  emptyText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  // Form Styles
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
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
  fuelPriceSelector: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
}));
