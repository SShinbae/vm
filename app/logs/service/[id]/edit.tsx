import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Input } from "@/components/ui/Input";
import { AlertModal } from "@/components/ui/Modal";
import { ReceiptViewer } from "@/components/ui/ReceiptViewer";
import {
  ServiceItemsInput,
  calculateTotalCost,
  createDefaultServiceItems,
  validateServiceItems,
} from "@/components/ui/ServiceItemsInput";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ServiceLogService } from "@/lib/services/loggingService";
import {
  ServiceLog,
  ServiceLogFormData,
  ServiceLogItem,
  ServiceType,
} from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SERVICE_TYPES: { value: ServiceType; label: string; icon: string }[] = [
  { value: "oil_change", label: "Oil Change", icon: "drop" },
  { value: "tire_rotation", label: "Tire Rotation", icon: "circle" },
  { value: "brake_service", label: "Brake Service", icon: "stop" },
  {
    value: "general_maintenance",
    label: "General Maintenance",
    icon: "wrench",
  },
  { value: "repair", label: "Repair", icon: "hammer" },
  { value: "inspection", label: "Inspection", icon: "checkmark.shield" },
  { value: "other", label: "Other", icon: "ellipsis" },
];

// Helper function to parse service log description (for backward compatibility)
const parseServiceLogItems = (
  description: string,
  cost?: number,
): ServiceLogItem[] => {
  try {
    // Try to parse as JSON first (new format)
    const parsed = JSON.parse(description);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    // Not JSON, treat as legacy single description
  }

  // Legacy format: single description with cost
  if (description.trim()) {
    return [{ description: description.trim(), price: cost || 0 }];
  }

  // Fallback to default
  return createDefaultServiceItems();
};

export default function EditServiceLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [serviceLog, setServiceLog] = useState<ServiceLog | null>(null);
  const [formData, setFormData] = useState<ServiceLogFormData>({
    vehicle_id: "",
    service_type: "general_maintenance",
    description: "",
    cost: 0,
    items: createDefaultServiceItems(),
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isWeb = Platform.OS === "web";

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
          setErrorMessage("Failed to load service log");
          setShowErrorModal(true);
          router.back();
          return;
        }

        const log = logs?.find((l) => l.id === id);
        if (!log) {
          setErrorMessage("Service log not found");
          setShowErrorModal(true);
          router.back();
          return;
        }

        setServiceLog(log);

        // Parse items from description (with backward compatibility)
        const items = parseServiceLogItems(log.description, log.cost || 0);

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
          ocr_extracted_data: log.ocr_extracted_data || undefined,
          auto_filled: log.auto_filled || false,
        });
      } catch (error) {
        console.error("Error fetching service log:", error);
        setErrorMessage("Failed to load service log");
        setShowErrorModal(true);
        router.back();
      }

      setDataLoading(false);
    };

    fetchServiceLog();
  }, [id]);

  const handleSave = async () => {
    // Validation
    const itemsError = validateServiceItems(formData.items || []);
    if (itemsError) {
      setErrorMessage(itemsError);
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

    // Calculate total cost and serialize items
    const totalCost = calculateTotalCost(formData.items || []);
    const itemsJson = JSON.stringify(formData.items || []);

    const updateData = {
      service_type: formData.service_type,
      description: itemsJson, // Store items as JSON for backward compatibility
      cost: totalCost,
      date: formData.date,
      odometer_reading: formData.odometer_reading,
      next_service_due: formData.next_service_due?.trim() || undefined,
      // Don't update receipt_image_url or ocr_extracted_data in edit
    };

    const { data, error } = await ServiceLogService.updateServiceLog(
      id!,
      updateData,
    );
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
    const reading = parseInt(value.replace(/,/g, ""));
    if (isNaN(reading) || reading <= 0) {
      return "Please enter a valid odometer reading";
    }
    return undefined;
  };

  const isFormValid = () => {
    const itemsValid =
      formData.items &&
      formData.items.length > 0 &&
      formData.items.some((item) => item.description.trim() && item.price > 0);

    return itemsValid && formData.odometer_reading > 0 && formData.date;
  };

  const ServiceTypeSelector = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        Service Type <Text style={styles.requiredLabel}>*</Text>
      </Text>
      <View style={styles.serviceTypeGrid}>
        {SERVICE_TYPES.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.serviceTypeOption,
              formData.service_type === type.value &&
                styles.serviceTypeOptionSelected,
            ]}
            onPress={() =>
              setFormData((prev) => ({ ...prev, service_type: type.value }))
            }
          >
            <IconSymbol
              name={type.icon}
              size={20}
              color={
                formData.service_type === type.value ? colors.tint : colors.icon
              }
            />
            <Text
              style={[
                styles.serviceTypeText,
                formData.service_type === type.value &&
                  styles.serviceTypeTextSelected,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isWeb ? colors.icon + "08" : colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.icon + "20",
      backgroundColor: colors.background,
    },
    backButton: {
      marginRight: 16,
      padding: 4,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      flex: 1,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: isWeb ? 40 : 20,
      paddingBottom: 100,
      ...(isWeb && {
        maxWidth: 600,
        width: "100%",
        alignSelf: "center",
      }),
    },
    title: {
      fontSize: 32,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 8,
      textAlign: isWeb ? "center" : "left",
    },
    subtitle: {
      fontSize: 16,
      color: colors.icon,
      marginBottom: 32,
      textAlign: isWeb ? "center" : "left",
    },
    card: {
      backgroundColor: colors.background,
      borderRadius: isWeb ? 16 : 12,
      padding: isWeb ? 32 : 20,
      ...(isWeb && {
        shadowColor: colorScheme === "dark" ? "#ffffff" : "#000000",
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: colorScheme === "dark" ? 0.1 : 0.08,
        shadowRadius: 12,
        elevation: 4,
      }),
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 16,
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
      marginBottom: 8,
    },
    requiredLabel: {
      color: "#ff4444",
    },
    row: {
      flexDirection: isWeb ? "row" : "column",
      gap: 16,
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
      backgroundColor: colors.icon + "10",
      borderRadius: 8,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    vehicleIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.tint,
      alignItems: "center",
      justifyContent: "center",
    },
    vehicleText: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
    },
    vehiclePlate: {
      fontSize: 14,
      color: colors.icon,
      marginTop: 2,
    },
    serviceTypeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    serviceTypeOption: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.icon + "30",
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
      minWidth: "45%",
    },
    serviceTypeOptionSelected: {
      borderColor: colors.tint,
      backgroundColor: colors.tint + "10",
    },
    serviceTypeText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.text,
    },
    serviceTypeTextSelected: {
      color: colors.tint,
    },
    buttonContainer: {
      flexDirection: "row",
      gap: 12,
      marginTop: 32,
    },
    cancelButton: {
      flex: 1,
    },
    saveButton: {
      flex: 2,
    },
  });

  if (dataLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {!isWeb && (
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <IconSymbol name="chevron.left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Service Log</Text>
          </View>
        )}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {!isWeb && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Service Log</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isWeb && (
            <>
              <Text style={styles.title}>Edit Service Log</Text>
              <Text style={styles.subtitle}>
                Update your service log details
              </Text>
            </>
          )}

          <View style={styles.card}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Vehicle</Text>
              {serviceLog?.vehicles && (
                <View style={styles.vehicleInfo}>
                  <View style={styles.vehicleIcon}>
                    <IconSymbol name="car.fill" size={16} color="white" />
                  </View>
                  <View>
                    <Text style={styles.vehicleText}>
                      {serviceLog.vehicles.year} {serviceLog.vehicles.make}{" "}
                      {serviceLog.vehicles.model}
                    </Text>
                    <Text style={styles.vehiclePlate}>
                      {serviceLog.vehicles.license_plate}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Service Information</Text>

              <ServiceTypeSelector />

              {formData.receipt_image_url && (
                <View style={styles.inputContainer}>
                  <ReceiptViewer
                    receiptImageUrl={formData.receipt_image_url}
                    ocrData={formData.ocr_extracted_data}
                    showOcrData={!!formData.ocr_extracted_data}
                  />
                </View>
              )}

              <ServiceItemsInput
                items={formData.items || []}
                onItemsChange={(items) =>
                  setFormData((prev) => ({ ...prev, items }))
                }
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vehicle Details</Text>

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

              <View style={styles.row}>
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

                <View style={styles.flex1}>
                  <DatePicker
                    label="Next Service Due"
                    value={formData.next_service_due}
                    onDateChange={(date) =>
                      setFormData((prev) => ({
                        ...prev,
                        next_service_due: date,
                      }))
                    }
                    placeholder="Select next service date"
                    style={{ marginBottom: 0 }}
                  />
                </View>
              </View>
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
    </SafeAreaView>
  );
}
