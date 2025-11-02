import { Input } from "@/components/ui/Input";
import { AlertModal } from "@/components/ui/Modal";
import { FormLayout } from "@/lib/design-system/components/templates/FormLayout";
import { Spacer } from "@/lib/design-system/components/atoms/Spacer";
import { Text } from "@/lib/design-system/components/atoms/Text";
import { VehicleSelector } from "@/lib/design-system/components/organisms/VehicleSelector";
import { useStyles } from "react-native-unistyles";
import { MileageLogService } from "@/lib/services/loggingService";
import { VehicleService } from "@/lib/services/vehicleService";
import { MileageLogFormData } from "@/types";
import { VehicleWithDetails } from "@/types/database-v2";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function AddMileageLogScreen() {
  const { theme } = useStyles();
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

  const handleSave = async () => {
    if (!formData.vehicle_id) {
      setErrorMessage("Please select a vehicle");
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
      odometer_reading: formData.odometer_reading,
      date: formData.date,
      notes: formData.notes?.trim() || undefined,
    };

    const { error } = await MileageLogService.createMileageLog(logData);
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
          title: "Add Mileage Log",
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
          title: "Add Mileage Log",
          showBack: true,
        }}
        title="Add Mileage Log"
        description="Record your vehicle's current mileage"
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
          label="Notes (Optional)"
          value={formData.notes || ""}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, notes: text }))
          }
          placeholder="Add any additional notes about this reading..."
          multiline
          numberOfLines={3}
        />
      </FormLayout>

      <AlertModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Success"
        message="Mileage log added successfully!"
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
