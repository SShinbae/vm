import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Input } from "@/components/ui/Input";
import { YearPicker } from "@/components/ui/YearPicker";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useToast } from "@/hooks/useToast";
import { VehicleService } from "@/lib/services/vehicleService";
import { VehicleFormData } from "@/types";
import { Vehicle } from "@/types/database-v2";
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

export default function EditVehicleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isSharedVehicle, setIsSharedVehicle] = useState(false);
  const [formData, setFormData] = useState<VehicleFormData>({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    license_plate: "",
    vin: "",
  });
  const [imageUri, setImageUri] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isWeb = Platform.OS === "web";

  useEffect(() => {
    const fetchVehicle = async () => {
      if (!id) return;

      const { data, error } = await VehicleService.getVehicleById(id);

      if (error) {
        let errorMsg = "Failed to load vehicle details";
        if (error.includes("not found") || error.includes("access denied")) {
          errorMsg =
            "Vehicle not found or you do not have permission to access it.";
        }
        showError(errorMsg);
        router.back();
      } else if (data) {
        setVehicle(data);
        setIsSharedVehicle(!data.is_own_vehicle);
        setFormData({
          make: data.make,
          model: data.model,
          year: data.year,
          license_plate: data.license_plate,
          vin: data.vin || "",
        });
        setImageUri(data.main_image_url || "");
      }

      setLoading(false);
    };

    fetchVehicle();
  }, [id, showError]);

  const handleSave = async () => {
    if (!vehicle) return;

    // Validation
    if (!formData.make.trim()) {
      showError("Please enter the vehicle make");
      return;
    }
    if (!formData.model.trim()) {
      showError("Please enter the vehicle model");
      return;
    }
    if (!formData.license_plate.trim()) {
      showError("Please enter the license plate");
      return;
    }
    if (formData.year < 1900 || formData.year > new Date().getFullYear() + 2) {
      showError("Please enter a valid year");
      return;
    }

    setSaving(true);

    const updates = {
      make: formData.make.trim(),
      model: formData.model.trim(),
      year: formData.year,
      license_plate: formData.license_plate.trim().toUpperCase(),
      vin: formData.vin?.trim() || null,
      main_image_url: imageUri || null,
    };

    const { error } = await VehicleService.updateVehicle(vehicle.id, updates);
    setSaving(false);

    if (error) {
      let errorMsg = error;
      if (error.includes("permission") || error.includes("access denied")) {
        errorMsg =
          "You do not have permission to edit this vehicle. Only the owner can modify vehicle details.";
      }
      showError(errorMsg);
    } else {
      showSuccess("Vehicle updated successfully!");
      router.push("/(tabs)/vehicles");
    }
  };

  const handleImageUpload = (url: string) => {
    setImageUri(url);
  };

  const handleImageError = (error: string) => {
    showError(error);
  };

  const validateMake = (value: string) => {
    if (!value.trim()) return "Make is required";
    return undefined;
  };

  const validateModel = (value: string) => {
    if (!value.trim()) return "Model is required";
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

  const hasChanges = () => {
    if (!vehicle) return false;
    return (
      formData.make.trim() !== vehicle.make ||
      formData.model.trim() !== vehicle.model ||
      formData.year !== vehicle.year ||
      formData.license_plate.trim().toUpperCase() !== vehicle.license_plate ||
      (formData.vin?.trim() || null) !== vehicle.vin ||
      imageUri !== (vehicle.main_image_url || "")
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
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    sharedNotice: {
      backgroundColor: colors.icon + "10",
      borderRadius: 8,
      padding: 12,
      marginBottom: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sharedNoticeText: {
      fontSize: 14,
      color: colors.icon,
      flex: 1,
      lineHeight: 18,
    },
  });

  if (loading) {
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
            <Text style={styles.headerTitle}>Edit Vehicle</Text>
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
          <Text style={styles.headerTitle}>
            Edit Vehicle {isSharedVehicle && "(Shared)"}
          </Text>
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
              <Text style={styles.title}>
                Edit Vehicle {isSharedVehicle && "(Shared)"}
              </Text>
              <Text style={styles.subtitle}>Update vehicle information</Text>
            </>
          )}

          <View style={styles.card}>
            {isSharedVehicle && (
              <View style={styles.sharedNotice}>
                <IconSymbol
                  name="person.2.fill"
                  size={16}
                  color={colors.icon}
                />
                <Text style={styles.sharedNoticeText}>
                  This is a shared vehicle. You can edit details as a group
                  member.
                </Text>
              </View>
            )}

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

              <YearPicker
                label="Year"
                value={formData.year.toString()}
                onYearChange={(year) => {
                  setFormData((prev) => ({ ...prev, year: parseInt(year) }));
                }}
                placeholder="Select year"
                required
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
                title="Update Vehicle"
                onPress={handleSave}
                disabled={!isFormValid() || !hasChanges()}
                loading={saving}
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
