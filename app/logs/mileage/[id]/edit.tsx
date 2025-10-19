import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Input } from "@/components/ui/Input";
import { AlertModal } from "@/components/ui/Modal";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MileageLogService } from "@/lib/services/loggingService";
import { MileageLog, MileageLogFormData } from "@/types";
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

export default function EditMileageLogScreen() {
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isWeb = Platform.OS === "web";

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
          console.error("Error fetching mileage logs:", error);
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
          console.error("No mileage log found with ID:", id);
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
      } catch (error) {
        console.error("Error fetching mileage log:", error);
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
      console.error("Error updating mileage log:", error);

      let errorMsg = error;
      if (error.includes("not found") || error.includes("no longer exists")) {
        errorMsg =
          "This mileage log no longer exists. It may have been deleted by another user.";
      } else if (
        error.includes("Access denied") ||
        error.includes("permission")
      ) {
        errorMsg =
          "You do not have permission to edit this mileage log. Please contact the vehicle owner if this is a shared vehicle.";
      } else if (error.includes("User not authenticated")) {
        errorMsg = "Your session has expired. Please log in again.";
      } else if (error.includes("Failed to update mileage log")) {
        errorMsg =
          "Unable to save changes. Please check your internet connection and try again.";
      } else if (error.includes("could not be updated")) {
        errorMsg =
          "The mileage log could not be updated. It may have been deleted or you may not have sufficient permissions.";
      }

      setErrorMessage(errorMsg);
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

  const isFormValid = () => {
    return formData.odometer_reading > 0 && formData.date;
  };

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
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
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
            <Text style={styles.headerTitle}>Edit Mileage Log</Text>
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
          <Text style={styles.headerTitle}>Edit Mileage Log</Text>
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
              <Text style={styles.title}>Edit Mileage Log</Text>
              <Text style={styles.subtitle}>Update mileage information</Text>
            </>
          )}

          <View style={styles.card}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Vehicle</Text>
              {(mileageLog as any)?.vehicles && (
                <View style={styles.vehicleInfo}>
                  <View style={styles.vehicleIcon}>
                    <IconSymbol name="car.fill" size={16} color="white" />
                  </View>
                  <View>
                    <Text style={styles.vehicleText}>
                      {(mileageLog as any).vehicles.year}{" "}
                      {(mileageLog as any).vehicles.make}{" "}
                      {(mileageLog as any).vehicles.model}
                    </Text>
                    <Text style={styles.vehiclePlate}>
                      {(mileageLog as any).vehicles.license_plate}
                    </Text>
                  </View>
                </View>
              )}
            </View>

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
              required={true}
            />

            <Input
              label="Notes (Optional)"
              value={formData.notes || ""}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, notes: text }))
              }
              placeholder="Add any notes about this mileage reading..."
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
                title="Update Log"
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
    </SafeAreaView>
  );
}
