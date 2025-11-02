import { Input } from "@/components/ui/Input";
import { AlertModal } from "@/components/ui/Modal";
import { FormLayout } from "@/lib/design-system/components/templates/FormLayout";
import { Spacer } from "@/lib/design-system/components/atoms/Spacer";
import { Text } from "@/lib/design-system/components/atoms/Text";
import { useStyles } from "react-native-unistyles";
import { FuelLogService } from "@/lib/services/loggingService";
import { FuelLog, FuelLogFormData } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function EditFuelLogScreen() {
  const { theme } = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [fuelLog, setFuelLog] = useState<FuelLog | null>(null);
  const [formData, setFormData] = useState<FuelLogFormData>({
    vehicle_id: "",
    cost: 0,
    fuel_price: 0,
    liters_filled: 0,
    odometer_reading: 0,
    date: new Date().toISOString().split("T")[0],
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchFuelLog = async () => {
      if (!id) {
        setErrorMessage("Invalid fuel log ID");
        setShowErrorModal(true);
        router.back();
        return;
      }

      try {
        const { data: logs, error } = await FuelLogService.getFuelLogs();
        if (error) {
          let errorMsg = "Failed to load fuel log";
          if (error.includes("User not authenticated")) {
            errorMsg = "Your session has expired. Please log in again.";
          } else if (error.includes("Failed to fetch")) {
            errorMsg =
              "Unable to load fuel log. Please check your internet connection.";
          }
          setErrorMessage(errorMsg);
          setShowErrorModal(true);
          router.back();
          return;
        }

        const log = logs?.find((l) => l.id === id);
        if (!log) {
          setErrorMessage(
            "This fuel log no longer exists. It may have been deleted.",
          );
          setShowErrorModal(true);
          router.back();
          return;
        }

        setFuelLog(log);
        setFormData({
          vehicle_id: log.vehicle_id,
          cost: log.cost || 0,
          fuel_price: (log as any).fuel_price || 1.99, // Type has issue, but field exists
          liters_filled: log.liters_filled,
          odometer_reading: log.odometer_reading,
          date: log.date,
          location: log.location || "",
        });
      } catch {
        setErrorMessage("Failed to load fuel log");
        setShowErrorModal(true);
        router.back();
      }

      setDataLoading(false);
    };

    fetchFuelLog();
  }, [id]);

  const calculateLiters = (cost: number, fuelPrice: number) => {
    if (fuelPrice > 0 && cost > 0) {
      return Math.round((cost / fuelPrice) * 1000) / 1000;
    }
    return 0;
  };

  useEffect(() => {
    if (formData.cost > 0 && formData.fuel_price > 0) {
      const calculatedLiters = calculateLiters(
        formData.cost,
        formData.fuel_price,
      );
      if (calculatedLiters !== formData.liters_filled) {
        setFormData((prev) => ({ ...prev, liters_filled: calculatedLiters }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.cost, formData.fuel_price]);

  const handleSave = async () => {
    if (formData.cost <= 0) {
      setErrorMessage("Please enter a valid total cost");
      setShowErrorModal(true);
      return;
    }
    if (formData.fuel_price <= 0) {
      setErrorMessage("Please enter a valid fuel price");
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
      liters_filled: formData.liters_filled,
      cost: formData.cost,
      fuel_price: formData.fuel_price,
      odometer_reading: formData.odometer_reading,
      date: formData.date,
      location: formData.location?.trim() || undefined,
    };

    const { error } = await FuelLogService.updateFuelLog(id!, updateData);
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

  if (dataLoading) {
    return (
      <FormLayout
        header={{
          title: "Edit Fuel Log",
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
          <Text color="secondary">Loading fuel log...</Text>
        </View>
      </FormLayout>
    );
  }

  if (!fuelLog) {
    return null;
  }

  return (
    <>
      <FormLayout
        header={{
          title: "Edit Fuel Log",
          showBack: true,
        }}
        title="Edit Fuel Log"
        description="Update fuel fill-up information"
        submitLabel="Update Log"
        cancelLabel="Cancel"
        onSubmit={handleSave}
        onCancel={() => router.back()}
        loading={loading}
      >
        <View
          style={{
            flexDirection: "row",
            gap: theme.spacing.md,
          }}
        >
          <View style={{ flex: 1 }}>
            <Input
              label="Total Cost"
              value={formData.cost > 0 ? formData.cost.toString() : ""}
              onChangeText={(text) => {
                const cost = parseFloat(text) || 0;
                setFormData((prev) => ({ ...prev, cost: cost }));
              }}
              placeholder="50.00"
              keyboardType="decimal-pad"
              required
              error={
                formData.cost
                  ? validateCost(formData.cost.toString())
                  : undefined
              }
              leftIcon="cash"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Input
              label="Price per Liter"
              value={
                formData.fuel_price > 0 ? formData.fuel_price.toString() : ""
              }
              onChangeText={(text) => {
                const price = parseFloat(text) || 0;
                setFormData((prev) => ({ ...prev, fuel_price: price }));
              }}
              placeholder="1.50"
              keyboardType="decimal-pad"
              required
              error={
                formData.fuel_price
                  ? validateFuelPrice(formData.fuel_price.toString())
                  : undefined
              }
              leftIcon="pricetag"
            />
          </View>
        </View>

        {formData.liters_filled > 0 && (
          <>
            <Spacer size="xs" />
            <Text
              size="sm"
              color="secondary"
              style={{ paddingHorizontal: theme.spacing.xs }}
            >
              ≈ {formData.liters_filled.toFixed(3)} liters
            </Text>
          </>
        )}

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
          helperText="Enter the odometer reading at the time of fill-up"
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
          placeholder="Shell Station, Main St"
          leftIcon="location"
        />
      </FormLayout>

      <AlertModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Success"
        message="Fuel log updated successfully!"
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
