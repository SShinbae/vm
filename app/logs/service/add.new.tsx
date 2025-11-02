import { Input } from "@/components/ui/Input";
import { AlertModal } from "@/components/ui/Modal";
import { ServiceItemsInput } from "@/components/ui/ServiceItemsInput";
import { FormLayout } from "@/lib/design-system/components/templates/FormLayout";
import { Spacer } from "@/lib/design-system/components/atoms/Spacer";
import { Text } from "@/lib/design-system/components/atoms/Text";
import { VehicleSelector } from "@/lib/design-system/components/organisms/VehicleSelector";
import { useStyles } from "react-native-unistyles";
import { ServiceLogService } from "@/lib/services/loggingService";
import { VehicleService } from "@/lib/services/vehicleService";
import { ServiceLogFormData, ServiceType } from "@/types";
import { VehicleWithDetails } from "@/types/database-v2";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: "oil_change", label: "Oil Change" },
  { value: "tire_rotation", label: "Tire Rotation" },
  { value: "brake_service", label: "Brake Service" },
  { value: "general_maintenance", label: "General Maintenance" },
  { value: "repair", label: "Repair" },
  { value: "inspection", label: "Inspection" },
  { value: "other", label: "Other" },
];

export default function AddServiceLogScreen() {
  const { theme } = useStyles();
  const { vehicleId } = useLocalSearchParams<{ vehicleId?: string }>();
  const [vehicles, setVehicles] = useState<VehicleWithDetails[]>([]);
  const [formData, setFormData] = useState<ServiceLogFormData>({
    vehicle_id: vehicleId || "",
    service_type: "general_maintenance",
    description: "",
    cost: 0,
    items: [],
    date: new Date().toISOString().split("T")[0],
    odometer_reading: 0,
    next_service_due: "",
    receipt_image_url: "",
    ocr_extracted_data: undefined,
    auto_filled: false,
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
    if (!formData.description.trim()) {
      setErrorMessage("Please enter a service description");
      setShowErrorModal(true);
      return;
    }
    if (!formData.cost || formData.cost <= 0) {
      setErrorMessage("Please enter a valid cost");
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
      service_type: formData.service_type,
      description: formData.description.trim(),
      cost: formData.cost,
      items: formData.items,
      date: formData.date,
      odometer_reading: formData.odometer_reading,
      next_service_due: formData.next_service_due?.trim() || undefined,
      receipt_image_url: formData.receipt_image_url || undefined,
    };

    const { error } = await ServiceLogService.createServiceLog(logData);
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
          title: "Add Service Log",
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
          title: "Add Service Log",
          showBack: true,
        }}
        title="Add Service Log"
        description="Record maintenance or repair service for your vehicle"
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
          Service Details
        </Text>
        <Spacer size="md" />

        {/* Service Type Selector */}
        <View>
          <Text size="sm" weight="semibold" color="secondary">
            Service Type <Text color="error">*</Text>
          </Text>
          <Spacer size="sm" />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
            {SERVICE_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={{
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor:
                    formData.service_type === type.value
                      ? theme.colors.primary
                      : theme.colors.border,
                  backgroundColor:
                    formData.service_type === type.value
                      ? theme.colors.primary + "10"
                      : theme.colors.surface,
                }}
                onPress={() =>
                  setFormData((prev) => ({ ...prev, service_type: type.value }))
                }
              >
                <Text
                  size="sm"
                  weight="medium"
                  color={formData.service_type === type.value ? "primary" : "primary"}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Spacer size="md" />

        <Input
          label="Description"
          value={formData.description}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, description: text }))
          }
          placeholder="What service was performed?"
          multiline
          numberOfLines={2}
          required
        />

        <Spacer size="md" />

        <Input
          label="Total Cost ($)"
          value={formData.cost && formData.cost > 0 ? formData.cost.toString() : ""}
          onChangeText={(text) => {
            const cost = parseFloat(text) || 0;
            setFormData((prev) => ({ ...prev, cost }));
          }}
          placeholder="150.00"
          keyboardType="decimal-pad"
          required
          error={formData.cost ? validateCost(formData.cost.toString()) : undefined}
          leftIcon="dollarsign"
        />

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
          helperText="Current odometer reading at time of service"
          leftIcon="speedometer"
        />

        <Spacer size="md" />

        <Input
          label="Service Date"
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
          label="Next Service Due (Optional)"
          value={formData.next_service_due || ""}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, next_service_due: text }))
          }
          placeholder="2024-06-01"
          helperText="When should the next service be performed?"
          leftIcon="calendar"
        />

        <Spacer size="md" />

        <Text variant="heading" weight="semibold">
          Service Items (Optional)
        </Text>
        <Spacer size="md" />

        <ServiceItemsInput
          items={formData.items ?? []}
          onItemsChange={(items) =>
            setFormData((prev) => ({ ...prev, items }))
          }
        />
      </FormLayout>

      <AlertModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Success"
        message="Service log added successfully!"
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
