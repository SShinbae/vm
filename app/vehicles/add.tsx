import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Input } from "@/components/ui/Input";
import { AlertModal } from "@/components/ui/Modal";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { VehicleService } from "@/lib/services/vehicleService";
import { VehicleFormData } from "@/types";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddVehicleScreen() {
  const [formData, setFormData] = useState<VehicleFormData>({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    license_plate: "",
    vin: "",
  });
  const [imageUri, setImageUri] = useState<string>("");
  const [vehicleId, setVehicleId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isWeb = Platform.OS === "web";

  const handleSave = async () => {
    // Validation
    if (!formData.make.trim()) {
      setErrorMessage("Please enter the vehicle make");
      setShowErrorModal(true);
      return;
    }
    if (!formData.model.trim()) {
      setErrorMessage("Please enter the vehicle model");
      setShowErrorModal(true);
      return;
    }
    if (!formData.license_plate.trim()) {
      setErrorMessage("Please enter the license plate");
      setShowErrorModal(true);
      return;
    }
    if (formData.year < 1900 || formData.year > new Date().getFullYear() + 2) {
      setErrorMessage("Please enter a valid year");
      setShowErrorModal(true);
      return;
    }

    setLoading(true);

    const vehicleData = {
      make: formData.make.trim(),
      model: formData.model.trim(),
      year: formData.year,
      license_plate: formData.license_plate.trim().toUpperCase(),
      vin: formData.vin?.trim() || undefined,
    };

    const { error } = await VehicleService.createVehicle(
      vehicleData,
      undefined, // sharedGroupIds
      imageUri || undefined, // imageUri
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
    router.push("/(tabs)/vehicles");
  };

  const handleImageUpload = (url: string) => {
    setImageUri(url);
  };

  const handleImageError = (error: string) => {
    setErrorMessage(error);
    setShowErrorModal(true);
  };

  const validateMake = (value: string) => {
    if (!value.trim()) return "Make is required";
    return undefined;
  };

  const validateModel = (value: string) => {
    if (!value.trim()) return "Model is required";
    return undefined;
  };

  const validateYear = (value: string) => {
    const year = parseInt(value);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 2) {
      return "Please enter a valid year";
    }
    return undefined;
  };

  const validateLicensePlate = (value: string) => {
    if (!value.trim()) return "License plate is required";
    return undefined;
  };

  const validateVin = (value: string) => {
    if (value && value.length !== 17) {
      return "VIN must be exactly 17 characters";
    }
    return undefined;
  };

  const isFormValid = () => {
    return (
      formData.make.trim() &&
      formData.model.trim() &&
      formData.license_plate.trim() &&
      formData.year >= 1900 &&
      formData.year <= new Date().getFullYear() + 2
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
    avatarContainer: {
      alignItems: "center",
      marginBottom: 32,
    },
    avatarUpload: {
      width: 120,
      height: 120,
      borderRadius: 60,
    },
    avatarLabel: {
      fontSize: 14,
      color: colors.icon,
      marginTop: 12,
      textAlign: "center",
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
    row: {
      flexDirection: isWeb ? "row" : "column",
      gap: 16,
    },
    flex1: {
      flex: 1,
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
  });

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "bottom", "left", "right"]}
    >
      {!isWeb && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Vehicle</Text>
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
              <Text style={styles.title}>Add Vehicle</Text>
              <Text style={styles.subtitle}>
                Add a new vehicle to your fleet
              </Text>
            </>
          )}

          <View style={styles.card}>
            {/* Circular Vehicle Photo */}
            <View style={styles.avatarContainer}>
              <ImageUpload
                type="avatar"
                currentImageUrl={imageUri}
                onUploadComplete={handleImageUpload}
                onUploadError={handleImageError}
                placeholder="Add Vehicle Photo"
                style={styles.avatarUpload}
              />
              <Text style={styles.avatarLabel}>Vehicle Photo (Optional)</Text>
            </View>

            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Input
                    label="Make"
                    value={formData.make}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, make: text }))
                    }
                    placeholder="Toyota"
                    autoCapitalize="words"
                    autoCorrect={false}
                    required
                    error={
                      formData.make ? validateMake(formData.make) : undefined
                    }
                    leftIcon="car"
                  />
                </View>

                <View style={styles.flex1}>
                  <Input
                    label="Model"
                    value={formData.model}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, model: text }))
                    }
                    placeholder="Camry"
                    autoCapitalize="words"
                    autoCorrect={false}
                    required
                    error={
                      formData.model ? validateModel(formData.model) : undefined
                    }
                  />
                </View>
              </View>

              <Input
                label="Year"
                value={formData.year.toString()}
                onChangeText={(text) => {
                  const year = parseInt(text) || new Date().getFullYear();
                  setFormData((prev) => ({ ...prev, year }));
                }}
                placeholder="2024"
                keyboardType="numeric"
                maxLength={4}
                required
                error={
                  formData.year
                    ? validateYear(formData.year.toString())
                    : undefined
                }
                leftIcon="calendar"
              />

              <Input
                label="License Plate"
                value={formData.license_plate}
                onChangeText={(text) =>
                  setFormData((prev) => ({
                    ...prev,
                    license_plate: text.toUpperCase(),
                  }))
                }
                placeholder="ABC123"
                autoCapitalize="characters"
                autoCorrect={false}
                required
                error={
                  formData.license_plate
                    ? validateLicensePlate(formData.license_plate)
                    : undefined
                }
                helperText="Enter the license plate number as shown on your vehicle"
                leftIcon="number"
              />

              <Input
                label="VIN (Optional)"
                value={formData.vin || ""}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, vin: text.toUpperCase() }))
                }
                placeholder="1HGBH41JXMN109186"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={17}
                showCharacterCount
                error={formData.vin ? validateVin(formData.vin) : undefined}
                helperText="Vehicle Identification Number (17 characters)"
                leftIcon="barcode"
              />
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
                title="Save Vehicle"
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
        message="Vehicle added successfully!"
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
