import { Input } from "@/components/ui/Input";
import { AlertModal } from "@/components/ui/Modal";
import { FormLayout } from "@/lib/design-system/components/templates/FormLayout";
import { Spacer } from "@/lib/design-system/components/atoms/Spacer";
import { Text } from "@/lib/design-system/components/atoms/Text";
import { VehicleSelector } from "@/lib/design-system/components/organisms/VehicleSelector";
import { useStyles } from "react-native-unistyles";
import { FuelLogService } from "@/lib/services/loggingService";
import { VehicleService } from "@/lib/services/vehicleService";
import { FuelLogFormData } from "@/types";
import { VehicleWithDetails } from "@/types/database-v2";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function AddFuelLogScreen() {
  const { theme } = useStyles();
  const { vehicleId } = useLocalSearchParams<{ vehicleId?: string }>();
  const [vehicles, setVehicles] = useState<VehicleWithDetails[]>([]);
  const [formData, setFormData] = useState<FuelLogFormData>({
    vehicle_id: vehicleId || "",
    liters_filled: 0,
    cost: 0,
    fuel_price: 1.99,
    date: new Date().toISOString().split("T")[0],
    odometer_reading: 0,
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  const calculateLiters = (cost: number, fuelPrice: number) => {
    if (fuelPrice > 0 && cost > 0) {
      return Math.round((cost / fuelPrice) * 1000) / 1000;
    }
    return 0;
  };

  const handleSave = async () => {
    if (!formData.vehicle_id) {
      setErrorMessage("Please select a vehicle");
      setShowErrorModal(true);
      return;
    }
    if (!formData.cost || formData.cost <= 0) {
      setErrorMessage("Please enter a valid cost amount");
      setShowErrorModal(true);
      return;
    }
    if (!formData.fuel_price || formData.fuel_price <= 0) {
      setErrorMessage("Please select a fuel price");
      setShowErrorModal(true);
      return;
    }
    if (formData.odometer_reading <= 0) {
      setErrorMessage("Please enter a valid odometer reading");
      setShowErrorModal(true);
      return;
    }
    if (!formData.date) {
      setErrorMessage("Please select a date");
      setShowErrorModal(true);
      return;
    }

    setLoading(true);

    const logData = {
      vehicle_id: formData.vehicle_id,
      liters_filled: formData.liters_filled,
      cost: formData.cost || undefined,
      fuel_price: formData.fuel_price || undefined,
      date: formData.date,
      odometer_reading: formData.odometer_reading,
      location: formData.location?.trim() || undefined,
    };

    const { error } = await FuelLogService.createFuelLog(logData);
    setLoading(false);

    if (error) {
      setErrorMessage(error);
      setShowErrorModal(true);
    } else {
      setShowSuccessModal(true);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push("/(tabs)/logs");
  };

  const validateCost = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return "Please enter a valid cost";
    return undefined;
  };

  const validateFuelPrice = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return "Please enter a valid fuel price";
    return undefined;
  };

  const validateOdometer = (value: string) => {
    const num = parseInt(value.replace(/,/g, ""));
    if (isNaN(num) || num <= 0) return "Please enter a valid odometer reading";
    return undefined;
  };

  const validateDate = (value: string) => {
    if (!value.trim()) return "Date is required";
    return undefined;
  };

  if (vehiclesLoading) {
    return (
      <FormLayout
        header={{
          title: "Add Fuel Log",
          showBack: true,
        }}
        onSubmit={() => {}}
      >
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: theme.spacing.xl,
          }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Spacer size="md" />
          <Text color="secondary">Loading vehicles...</Text>
        </View>
      </FormLayout>
    );
  }

  return (
    <>
      <FormLayout
        header={{
          title: "Add Fuel Log",
          showBack: true,
        }}
        title="Add Fuel Log"
        description="Record a fuel fill-up for your vehicle"
        submitLabel="Save Log"
        cancelLabel="Cancel"
        onSubmit={handleSave}
        onCancel={() => router.back()}
        loading={loading}
      >
        <VehicleSelector
          vehicles={vehicles}
          selectedVehicleId={formData.vehicle_id}
          onSelect={(id) => setFormData((prev) => ({ ...prev, vehicle_id: id }))}
          lockedVehicleId={vehicleId}
          required
        />

        <Spacer size="lg" />

        <Text variant="heading" weight="semibold">
          Fuel Details
        </Text>
        <Spacer size="md" />

        <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <Input
              label="Total Cost ($)"
              value={formData.cost > 0 ? formData.cost.toString() : ""}
              onChangeText={(text) => {
                const cost = parseFloat(text) || 0;
                const liters = calculateLiters(cost, formData.fuel_price);
                setFormData((prev) => ({ ...prev, cost, liters_filled: liters }));
              }}
              placeholder="50.00"
              keyboardType="decimal-pad"
              required
              error={formData.cost ? validateCost(formData.cost.toString()) : undefined}
              leftIcon="dollarsign"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Input
              label="Price per Liter ($)"
              value={formData.fuel_price > 0 ? formData.fuel_price.toString() : ""}
              onChangeText={(text) => {
                const fuelPrice = parseFloat(text) || 0;
                const liters = calculateLiters(formData.cost, fuelPrice);
                setFormData((prev) => ({
                  ...prev,
                  fuel_price: fuelPrice,
                  liters_filled: liters,
                }));
              }}
              placeholder="1.99"
              keyboardType="decimal-pad"
              required
              error={
                formData.fuel_price
                  ? validateFuelPrice(formData.fuel_price.toString())
                  : undefined
              }
              helperText={
                formData.liters_filled > 0
                  ? `≈ ${formData.liters_filled.toFixed(2)} liters`
                  : undefined
              }
            />
          </View>
        </View>

        <Spacer size="md" />

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
          helperText="Current odometer reading when filling up"
          leftIcon="speedometer"
        />

        <Spacer size="md" />

        <Input
          label="Date"
          value={formData.date}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, date: text }))
          }
          placeholder="2024-01-01"
          required
          error={formData.date ? validateDate(formData.date) : undefined}
          helperText="Date format: YYYY-MM-DD"
          leftIcon="calendar"
        />

        <Spacer size="md" />

        <Input
          label="Location (Optional)"
          value={formData.location || ""}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, location: text }))
          }
          placeholder="Gas station name or location"
          leftIcon="location"
        />
      </FormLayout>

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
        onClose={() => setShowErrorModal(false)}
        title="Error"
        message={errorMessage}
        variant="error"
      />
    </>
  );
}
