import { ImageUpload } from "@/components/ui/ImageUpload";
import { Input } from "@/components/ui/Input";
import { AlertModal } from "@/components/ui/Modal";
import { FormLayout } from "@/lib/design-system/components/templates/FormLayout";
import { Spacer } from "@/lib/design-system/components/atoms/Spacer";
import { Text } from "@/lib/design-system/components/atoms/Text";
import { useStyles } from "react-native-unistyles";
import { VehicleService } from "@/lib/services/vehicleService";
import { VehicleFormData } from "@/types";
import { Vehicle } from "@/types/database-v2";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function EditVehicleScreen() {
  const { theme } = useStyles();
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
        setErrorMessage(errorMsg);
        setShowErrorModal(true);
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
  }, [id]);

  const handleSave = async () => {
    if (!vehicle) return;

    // Check if this is a shared vehicle - only owners can edit vehicle details
    if (isSharedVehicle) {
      setErrorMessage(
        "Only the vehicle owner can edit vehicle details. You have read-only access to this shared vehicle.",
      );
      setShowErrorModal(true);
      return;
    }

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
      setErrorMessage(errorMsg);
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

  if (loading) {
    return (
      <FormLayout
        header={{
          title: "Edit Vehicle",
          showBack: true,
        }}
        onSubmit={() => {}}
      >
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: theme.spacing.xl }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Spacer size="md" />
          <Text color="secondary">Loading vehicle details...</Text>
        </View>
      </FormLayout>
    );
  }

  if (!vehicle) {
    return null;
  }

  return (
    <>
      <FormLayout
        header={{
          title: "Edit Vehicle",
          showBack: true,
        }}
        title="Edit Vehicle"
        description={`Update details for ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
        submitLabel="Update Vehicle"
        cancelLabel="Cancel"
        onSubmit={handleSave}
        onCancel={() => router.back()}
        loading={saving}
      >
        {/* Shared Vehicle Warning */}
        {isSharedVehicle && (
          <>
            <View
              style={{
                backgroundColor: theme.colors.warning + "10",
                borderColor: theme.colors.warning,
                borderWidth: 1,
                borderRadius: 8,
                padding: theme.spacing.md,
              }}
            >
              <Text weight="semibold" color="secondary">
                Read-Only Access
              </Text>
              <Spacer size="xs" />
              <Text size="sm" color="secondary">
                This is a shared vehicle. Only the owner can edit vehicle
                details.
              </Text>
            </View>
            <Spacer size="lg" />
          </>
        )}

        {/* Circular Vehicle Photo */}
        <View style={{ alignItems: "center", marginBottom: theme.spacing.lg }}>
          <ImageUpload
            type="avatar"
            currentImageUrl={imageUri}
            onUploadComplete={handleImageUpload}
            onUploadError={handleImageError}
            placeholder="Add Vehicle Photo"
            style={{ width: 120, height: 120, borderRadius: 60 }}
            disabled={isSharedVehicle}
          />
          <Spacer size="xs" />
          <Text size="sm" color="secondary" align="center">
            Vehicle Photo (Optional)
          </Text>
        </View>

        <Spacer size="md" />

        {/* Basic Information */}
        <Text variant="heading" weight="semibold">
          Basic Information
        </Text>
        <Spacer size="md" />

        <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
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
              error={formData.make ? validateMake(formData.make) : undefined}
              leftIcon="car"
              editable={!isSharedVehicle}
            />
          </View>

          <View style={{ flex: 1 }}>
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
              error={formData.model ? validateModel(formData.model) : undefined}
              editable={!isSharedVehicle}
            />
          </View>
        </View>

        <Spacer size="md" />

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
            formData.year ? validateYear(formData.year.toString()) : undefined
          }
          leftIcon="calendar"
          editable={!isSharedVehicle}
        />

        <Spacer size="md" />

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
          editable={!isSharedVehicle}
        />

        <Spacer size="md" />

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
          editable={!isSharedVehicle}
        />
      </FormLayout>

      <AlertModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Success"
        message="Vehicle updated successfully!"
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
