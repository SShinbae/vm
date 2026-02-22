import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/hooks/useToast";
import {
  OCRResultDisplay,
  ReceiptCapture,
} from "@/components/ui/ReceiptCapture";
import { ReceiptViewer } from "@/components/ui/ReceiptViewer";
import { SkeletonServiceLogForm } from "@/components/ui/Skeleton";
import {
  ServiceItemsInput,
  calculateTotalCost,
  createDefaultServiceItems,
  validateServiceItems,
} from "@/components/ui/ServiceItemsInput";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ServiceLogService } from "@/lib/services/loggingService";
import { OCRService, ReceiptProcessingResult } from "@/lib/services/ocrService";
import { VehicleService } from "@/lib/services/vehicleService";
import { ServiceLogFormData, ServiceType } from "@/types";
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
  useWindowDimensions,
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

export default function AddServiceLogScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId?: string }>();
  const [vehicles, setVehicles] = useState<VehicleWithDetails[]>([]);
  const [formData, setFormData] = useState<ServiceLogFormData>({
    vehicle_id: vehicleId || "",
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
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const { showSuccess, showError, showInfo } = useToast();
  const posthog = usePostHog();
  const [ocrResult, setOcrResult] = useState<ReceiptProcessingResult | null>(
    null,
  );
  const [showOcrResult, setShowOcrResult] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isWeb = Platform.OS === "web";
  const { width: screenWidth } = useWindowDimensions();

  // Responsive breakpoints
  const isSmallScreen = screenWidth < 380;
  const isMediumScreen = screenWidth >= 380 && screenWidth < 600;
  const isLargeScreen = screenWidth >= 600;

  // --- Custom Header (standardized across all log forms) ---
  const CustomHeader = () => {
    const headerTitle =
      vehicleId && vehicles.find((v) => v.id === vehicleId)
        ? `Add Service - ${vehicles.find((v) => v.id === vehicleId)?.year} ${vehicles.find((v) => v.id === vehicleId)?.make}`
        : "Add Service Log";

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
              Record your vehicle service
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

    const itemsError = validateServiceItems(formData.items || []);
    if (itemsError) {
      showError(itemsError);
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

    const totalCost = calculateTotalCost(formData.items || []);
    const itemsJson = JSON.stringify(formData.items || []);

    const logData = {
      vehicle_id: formData.vehicle_id,
      service_type: formData.service_type,
      description: itemsJson,
      cost: totalCost,
      date: formData.date,
      odometer_reading: formData.odometer_reading,
      next_service_due: formData.next_service_due?.trim() || undefined,
      receipt_image_url: formData.receipt_image_url || undefined,
      ocr_extracted_data: formData.ocr_extracted_data || undefined,
      auto_filled: formData.auto_filled || undefined,
    };

    const { error } = await ServiceLogService.createServiceLog(logData);
    setLoading(false);

    if (error) {
      showError(error);
    } else {
      posthog.capture("service_log_created", {
        service_type: logData.service_type,
        cost: totalCost,
        auto_filled: logData.auto_filled || false,
      });
      showSuccess("Service log added successfully!");
      router.push("/(tabs)/logs");
    }
  };

  const isFormValid = () => {
    const itemsValid =
      formData.items &&
      formData.items.length > 0 &&
      formData.items.some((item) => item.description.trim() && item.price > 0);

    return (
      formData.vehicle_id &&
      itemsValid &&
      formData.odometer_reading > 0 &&
      formData.date
    );
  };

  const handleReceiptProcessed = async (result: ReceiptProcessingResult) => {
    if (result.success && result.data) {
      setOcrResult(result);
      setShowOcrResult(true);
      if (result.imageUri) {
        setCapturedImageUri(result.imageUri);
      }
    } else {
      showError(result.error || "Failed to process receipt");
    }
  };

  const handlePictureOnly = async (result: ReceiptProcessingResult) => {
    if (result.success && result.uploadedImageUrl) {
      setFormData((prev) => ({
        ...prev,
        receipt_image_url: result.uploadedImageUrl || "",
        auto_filled: false,
      }));

      if (result.imageUri) {
        setCapturedImageUri(result.imageUri);
      }

      showSuccess("Picture saved successfully!");
    } else {
      showError(result.error || "Failed to save picture");
    }
  };

  const handleAcceptOcrData = async () => {
    if (!ocrResult?.data) {
      showError("No OCR data available to apply");
      return;
    }

    try {
      setLoading(true);
      const { extracted_fields } = ocrResult.data;

      let receiptImageUrl = "";
      if (ocrResult.imageUri) {
        try {
          const uploadResult = await OCRService.uploadReceiptImage(
            ocrResult.imageUri,
            `receipt_${Date.now()}.jpg`,
          );

          if (uploadResult.error) {
            setLoading(false);
            showError(
              "The receipt image could not be saved, but the extracted data will still be applied.",
            );
            return;
          }

          if (uploadResult.data) {
            receiptImageUrl = uploadResult.data;
          }
        } catch (error) {
          console.warn("Failed to upload receipt image:", error);
        }
      }

      const mapServiceType = (ocrType: string): ServiceType => {
        const typeMap: Record<string, ServiceType> = {
          oil_change: "oil_change",
          tire_rotation: "tire_rotation",
          brake_service: "brake_service",
          general_maintenance: "general_maintenance",
          repair: "repair",
          inspection: "inspection",
        };
        return typeMap[ocrType] || "general_maintenance";
      };

      setFormData((prev) => ({
        ...prev,
        service_type: extracted_fields.service_type
          ? mapServiceType(extracted_fields.service_type)
          : prev.service_type,
        description: extracted_fields.description || prev.description,
        cost: extracted_fields.cost || prev.cost,
        date: extracted_fields.date
          ? new Date(extracted_fields.date).toISOString().split("T")[0]
          : prev.date,
        odometer_reading:
          extracted_fields.odometer_reading || prev.odometer_reading,
        receipt_image_url: receiptImageUrl,
        ocr_extracted_data: ocrResult.data,
        auto_filled: true,
      }));

      setShowOcrResult(false);
      posthog.capture("ocr_data_accepted");
      showInfo(
        "Service details auto-filled from receipt. Please review and adjust if needed.",
      );
    } catch (error) {
      console.error("Error applying OCR data:", error);
      showError(
        "Failed to apply the extracted data. You can still enter the information manually.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRejectOcrData = () => {
    setOcrResult(null);
    setShowOcrResult(false);
  };

  const handleDeletePicture = () => {
    setCapturedImageUri(null);
    setFormData((prev) => ({
      ...prev,
      receipt_image_url: "",
      ocr_extracted_data: undefined,
      auto_filled: false,
    }));
    setOcrResult(null);
    setShowOcrResult(false);
  };

  const validateOdometer = (value: string) => {
    const num = parseInt(value.replace(/,/g, ""));
    if (isNaN(num) || num <= 0) return "Please enter a valid odometer reading";
    return undefined;
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
                <IconSymbol name="lock.fill" size={14} color={colors.icon} />
              </View>
            </View>
            <Text style={styles.lockedHelpText}>
              Adding service log for this vehicle
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
              name={type.icon as any}
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

  // Calculate service type chip width based on screen size
  // Small screens: full width (1 per row)
  // Medium screens: ~48% width (2 per row)
  // Large screens: ~31% width (3 per row)
  const getServiceTypeWidth = () => {
    if (isSmallScreen) return "100%";
    if (isMediumScreen) return "48%";
    return "31%";
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
      paddingHorizontal: isSmallScreen ? 12 : 20,
      paddingVertical: 16,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.icon + "20",
    },
    customBackButton: {
      marginRight: isSmallScreen ? 8 : 16,
      padding: 4,
    },
    titleContainer: {
      flex: 1,
    },
    headerTitle: {
      fontSize: isSmallScreen ? 20 : 24,
      fontWeight: "bold",
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: isSmallScreen ? 12 : 14,
      color: colors.icon,
      marginTop: 2,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: isLargeScreen ? 40 : isSmallScreen ? 12 : 16,
      paddingBottom: 100,
      ...(isLargeScreen && {
        maxWidth: 600,
        width: "100%",
        alignSelf: "center",
      }),
    },
    card: {
      backgroundColor: colors.background,
      borderRadius: isLargeScreen ? 16 : 12,
      padding: isLargeScreen ? 32 : isSmallScreen ? 12 : 16,
      ...(isLargeScreen && {
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
    row: {
      flexDirection: "row",
      gap: isSmallScreen ? 8 : 12,
    },
    flex1: {
      flex: 1,
      minWidth: 0, // Allow flex items to shrink below content size
    },
    buttonContainer: {
      flexDirection: "row",
      gap: isSmallScreen ? 8 : 12,
      marginTop: isSmallScreen ? 24 : 32,
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
      marginBottom: isSmallScreen ? 16 : 20,
    },
    label: {
      fontSize: isSmallScreen ? 14 : 16,
      fontWeight: "500",
      color: colors.text,
      marginBottom: 8,
    },
    requiredLabel: {
      color: "#ff4444",
    },
    vehicleSelector: {
      maxHeight: 120,
    },
    vehicleSelectorContent: {
      gap: isSmallScreen ? 8 : 12,
    },
    vehicleOption: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.icon + "30",
      borderRadius: 8,
      padding: isSmallScreen ? 10 : 12,
      minWidth: isSmallScreen ? 100 : 120,
      alignItems: "center",
      gap: 8,
    },
    vehicleOptionSelected: {
      borderColor: colors.tint,
      backgroundColor: colors.tint + "10",
    },
    vehicleIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.tint,
      alignItems: "center",
      justifyContent: "center",
    },
    vehicleOptionText: {
      fontSize: isSmallScreen ? 12 : 14,
      fontWeight: "600",
      color: colors.text,
      textAlign: "center",
    },
    vehicleOptionTextSelected: {
      color: colors.tint,
    },
    vehiclePlateText: {
      fontSize: isSmallScreen ? 10 : 12,
      color: colors.icon,
      textAlign: "center",
    },
    vehiclePlateTextSelected: {
      color: colors.tint,
    },
    lockedVehicleContainer: {
      gap: 8,
    },
    lockedVehicle: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.tint,
      borderRadius: 8,
      padding: isSmallScreen ? 12 : 16,
      flexDirection: "row",
      alignItems: "center",
      gap: isSmallScreen ? 8 : 12,
    },
    lockedVehicleInfo: {
      flex: 1,
    },
    lockedVehicleText: {
      fontSize: isSmallScreen ? 14 : 16,
      fontWeight: "600",
      color: colors.text,
    },
    lockedVehiclePlate: {
      fontSize: isSmallScreen ? 12 : 14,
      color: colors.icon,
      marginTop: 2,
    },
    lockIcon: {
      padding: 4,
    },
    lockedHelpText: {
      fontSize: isSmallScreen ? 11 : 12,
      color: colors.icon,
      fontStyle: "italic",
    },
    serviceTypeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: isSmallScreen ? 8 : 10,
      justifyContent: "flex-start",
    },
    serviceTypeOption: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.icon + "30",
      borderRadius: 8,
      paddingHorizontal: isSmallScreen ? 10 : 12,
      paddingVertical: isSmallScreen ? 8 : 10,
      gap: 6,
      // Dynamic width based on screen size
      width: getServiceTypeWidth(),
      flexGrow: isSmallScreen ? 0 : 1,
      flexShrink: 0,
    },
    serviceTypeOptionSelected: {
      borderColor: colors.tint,
      backgroundColor: colors.tint + "10",
    },
    serviceTypeText: {
      fontSize: isSmallScreen ? 12 : 14,
      fontWeight: "500",
      color: colors.text,
      flexShrink: 1,
    },
    serviceTypeTextSelected: {
      color: colors.tint,
    },
    autoFillIndicator: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#4CAF50" + "15",
      paddingHorizontal: isSmallScreen ? 10 : 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 8,
      marginBottom: 16,
    },
    autoFillText: {
      fontSize: isSmallScreen ? 12 : 14,
      color: "#4CAF50",
      fontWeight: "500",
      flex: 1,
    },
    pictureIndicator: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.tint + "15",
      paddingHorizontal: isSmallScreen ? 10 : 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 8,
      marginBottom: 16,
    },
    pictureText: {
      fontSize: isSmallScreen ? 12 : 14,
      color: colors.tint,
      fontWeight: "500",
      flex: 1,
    },
    receiptContainer: {
      marginBottom: isSmallScreen ? 16 : 20,
    },
  });

  if (vehiclesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <SkeletonServiceLogForm />
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
            style={{ marginTop: 20 }}
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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Receipt/Picture</Text>
              <ReceiptCapture
                onReceiptProcessed={handleReceiptProcessed}
                onPictureOnly={handlePictureOnly}
                disabled={loading}
              />
            </View>

            {capturedImageUri && (
              <View style={styles.receiptContainer}>
                <ReceiptViewer
                  receiptImageUrl={capturedImageUri}
                  ocrData={formData.ocr_extracted_data}
                  showOcrData={!!formData.ocr_extracted_data}
                  onDelete={handleDeletePicture}
                />
              </View>
            )}

            {showOcrResult && ocrResult?.data && (
              <OCRResultDisplay
                ocrData={ocrResult.data}
                onAccept={handleAcceptOcrData}
                onReject={handleRejectOcrData}
              />
            )}

            <ServiceTypeSelector />

            {formData.auto_filled && (
              <View style={styles.autoFillIndicator}>
                <IconSymbol
                  name="checkmark.circle.fill"
                  size={16}
                  color="#4CAF50"
                />
                <Text style={styles.autoFillText}>
                  Data auto-filled from receipt
                </Text>
              </View>
            )}

            {formData.receipt_image_url && !formData.auto_filled && (
              <View style={styles.pictureIndicator}>
                <IconSymbol name="photo.fill" size={16} color={colors.tint} />
                <Text style={styles.pictureText}>
                  Picture attached to service record
                </Text>
              </View>
            )}

            <ServiceItemsInput
              items={formData.items || []}
              onItemsChange={(items) =>
                setFormData((prev) => ({ ...prev, items }))
              }
            />

            <Input
              label="Odometer (km)"
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
                  label="Next Service"
                  value={formData.next_service_due || ""}
                  onDateChange={(date) =>
                    setFormData((prev) => ({ ...prev, next_service_due: date }))
                  }
                  placeholder="Select date"
                  style={{ marginBottom: 0 }}
                />
              </View>
            </View>

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
