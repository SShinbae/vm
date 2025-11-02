import { Input } from "@/components/ui/Input";
import { AlertModal } from "@/components/ui/Modal";
import { ServiceItemsInput } from "@/components/ui/ServiceItemsInput";
import { FormLayout } from "@/lib/design-system/components/templates/FormLayout";
import { Spacer } from "@/lib/design-system/components/atoms/Spacer";
import { Text } from "@/lib/design-system/components/atoms/Text";
import { useStyles } from "react-native-unistyles";
import { ServiceLogService } from "@/lib/services/loggingService";
import { ServiceLog, ServiceLogFormData, ServiceType } from "@/types";
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

export default function EditServiceLogScreen() {
  const { theme } = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [serviceLog, setServiceLog] = useState<ServiceLog | null>(null);
  const [formData, setFormData] = useState<ServiceLogFormData>({
    vehicle_id: "",
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
  const [dataLoading, setDataLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchServiceLog = async () => {
      if (!id) {
        setErrorMessage("Invalid service log ID");
        setShowErrorModal(true);
        router.back();
        return;
      }

      try {
        const { data: logs, error } = await ServiceLogService.getServiceLogs();
        if (error) {
          let errorMsg = "Failed to load service log";
          if (error.includes("User not authenticated")) {
            errorMsg = "Your session has expired. Please log in again.";
          } else if (error.includes("Failed to fetch")) {
            errorMsg =
              "Unable to load service log. Please check your internet connection.";
          }
          setErrorMessage(errorMsg);
          setShowErrorModal(true);
          router.back();
          return;
        }

        const log = logs?.find((l) => l.id === id);
        if (!log) {
          setErrorMessage(
            "This service log no longer exists. It may have been deleted.",
          );
          setShowErrorModal(true);
          router.back();
          return;
        }

        setServiceLog(log);
        
        // Parse items from description if stored as JSON
        let items = [];
        try {
          const parsed = JSON.parse(log.description);
          if (Array.isArray(parsed)) {
            items = parsed;
          }
        } catch {
          // Description is plain text, not JSON
        }

        setFormData({
          vehicle_id: log.vehicle_id,
          service_type: log.service_type as ServiceType,
          description: log.description,
          cost: log.cost || 0,
          items: items,
          date: log.date,
          odometer_reading: log.odometer_reading,
          next_service_due: log.next_service_due || "",
          receipt_image_url: log.receipt_image_url || "",
          ocr_extracted_data: undefined,
          auto_filled: false,
        });
      } catch {
        setErrorMessage("Failed to load service log");
        setShowErrorModal(true);
        router.back();
      }

      setDataLoading(false);
    };

    fetchServiceLog();
  }, [id]);

  const handleSave = async () => {
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

    const updateData = {
      service_type: formData.service_type,
      description: formData.description.trim(),
      cost: formData.cost,
      date: formData.date,
      odometer_reading: formData.odometer_reading,
      next_service_due: formData.next_service_due?.trim() || undefined,
    };

    const { error } = await ServiceLogService.updateServiceLog(id!, updateData);
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
    router.back();
  };

  const validateDescription = (value: string) => {
    if (!value.trim()) return "Description is required";
    return undefined;
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

  if (dataLoading) {
    return (
      <FormLayout
        header={{
          title: "Edit Service Log",
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
          <Text color="secondary">Loading service log...</Text>
        </View>
      </FormLayout>
    );
  }

  if (!serviceLog) {
    return null;
  }

  return (
    <>
      <FormLayout
        header={{
          title: "Edit Service Log",
          showBack: true,
        }}
        title="Edit Service Log"
        description="Update service/maintenance information"
        submitLabel="Update Log"
        cancelLabel="Cancel"
        onSubmit={handleSave}
        onCancel={() => router.back()}
        loading={loading}
      >
        <Text
          weight="semibold"
          size="sm"
          style={{ marginBottom: theme.spacing.xs }}
        >
          Service Type <Text color="error">*</Text>
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: theme.spacing.xs,
          }}
        >
          {SERVICE_TYPES.map((type) => {
            const isSelected = formData.service_type === type.value;
            return (
              <TouchableOpacity
                key={type.value}
                style={{
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.spacing.lg,
                  borderWidth: 2,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.border,
                  backgroundColor: isSelected
                    ? theme.colors.primary + "10"
                    : theme.colors.surface,
                }}
                onPress={() =>
                  setFormData((prev) => ({
                    ...prev,
                    service_type: type.value,
                  }))
                }
              >
                <Text
                  weight={isSelected ? "semibold" : "regular"}
                  color={isSelected ? "primary" : "secondary"}
                  size="sm"
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Spacer size="md" />

        <Input
          label="Description"
          value={formData.description}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, description: text }))
          }
          placeholder="Describe the service performed..."
          multiline
          numberOfLines={3}
          required
          error={
            formData.description
              ? validateDescription(formData.description)
              : undefined
          }
        />

        <Spacer size="md" />

        <Input
          label="Total Cost"
          value={
            formData.cost && formData.cost > 0 ? formData.cost.toString() : ""
          }
          onChangeText={(text) => {
            const cost = parseFloat(text) || 0;
            setFormData((prev) => ({ ...prev, cost: cost }));
          }}
          placeholder="150.00"
          keyboardType="decimal-pad"
          required
          error={
            formData.cost ? validateCost(formData.cost.toString()) : undefined
          }
          leftIcon="cash"
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
          helperText="Enter the odometer reading at the time of service"
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
          placeholder="2024-06-01 or 160,000 km"
          helperText="Enter a date or mileage for the next service"
          leftIcon="calendar"
        />

        <Spacer size="md" />

        <ServiceItemsInput
          items={formData.items ?? []}
          onItemsChange={(items) =>
            setFormData((prev) => ({ ...prev, items: items }))
          }
        />
      </FormLayout>

      <AlertModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Success"
        message="Service log updated successfully!"
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
