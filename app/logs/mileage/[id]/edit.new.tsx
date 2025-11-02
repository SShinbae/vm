import { Input } from "@/components/ui/Input";
import { AlertModal } from "@/components/ui/Modal";
import { FormLayout } from "@/lib/design-system/components/templates/FormLayout";
import { Spacer } from "@/lib/design-system/components/atoms/Spacer";
import { Text } from "@/lib/design-system/components/atoms/Text";
import { useStyles } from "react-native-unistyles";
import { MileageLogService } from "@/lib/services/loggingService";
import { MileageLog, MileageLogFormData } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function EditMileageLogScreen() {
  const { theme } = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [mileageLog, setMileageLog] = useState<MileageLog | null>(null);
  const [formData, setFormData] = useState<MileageLogFormData>({
    vehicle_id: "",
    odometer_reading: 0,
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchMileageLog = async () => {
      if (!id) {
        setErrorMessage("Invalid mileage log ID");
        setShowErrorModal(true);
        router.back();
        return;
      }

      try {
        const { data: logs, error } = await MileageLogService.getMileageLogs();
        if (error) {
          let errorMsg = "Failed to load mileage log";
          if (error.includes("User not authenticated")) {
            errorMsg = "Your session has expired. Please log in again.";
          } else if (error.includes("Failed to fetch")) {
            errorMsg =
              "Unable to load mileage log. Please check your internet connection.";
          }
          setErrorMessage(errorMsg);
          setShowErrorModal(true);
          router.back();
          return;
        }

        const log = logs?.find((l) => l.id === id);
        if (!log) {
          setErrorMessage(
            "This mileage log no longer exists. It may have been deleted.",
          );
          setShowErrorModal(true);
          router.back();
          return;
        }

        setMileageLog(log);
        setFormData({
          vehicle_id: log.vehicle_id,
          odometer_reading: log.odometer_reading,
          date: log.date,
          notes: log.notes || "",
        });
      } catch {
        setErrorMessage("Failed to load mileage log");
        setShowErrorModal(true);
        router.back();
      }

      setDataLoading(false);
    };

    fetchMileageLog();
  }, [id]);

  const handleSave = async () => {
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
      odometer_reading: formData.odometer_reading,
      date: formData.date,
      notes: formData.notes?.trim() || undefined,
    };

    const { error } = await MileageLogService.updateMileageLog(id!, updateData);
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
          title: "Edit Mileage Log",
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
          <Text color="secondary">Loading mileage log...</Text>
        </View>
      </FormLayout>
    );
  }

  if (!mileageLog) {
    return null;
  }

  return (
    <>
      <FormLayout
        header={{
          title: "Edit Mileage Log",
          showBack: true,
        }}
        title="Edit Mileage Log"
        description="Update mileage information"
        submitLabel="Update Log"
        cancelLabel="Cancel"
        onSubmit={handleSave}
        onCancel={() => router.back()}
        loading={loading}
      >
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
        message="Mileage log updated successfully!"
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
