import { formPageStyles } from "@/components/layout/formPageStyles";
import { goBack } from "@/lib/utils/goBack";
import { withOpacity, spacing } from "@/src/design-system";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useStyles } from "react-native-unistyles";
import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Input } from "@/components/ui/Input";
import { YearPicker } from "@/components/ui/YearPicker";
import { SkeletonVehicleEdit } from "@/components/ui/Skeleton";
import { useToast } from "@/hooks/useToast";
import { VehicleService } from "@/lib/services/vehicleService";
import { VehicleFormData } from "@/types";
import { Vehicle } from "@/types/database-v2";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DashboardWebLayout } from "@/components/layout/DashboardWebLayout";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { webPageStyles } from "@/components/layout/webPageStyles";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export default function EditVehicleScreen() {
  return (
    <DashboardWebLayout>
      <EditVehicleContent />
    </DashboardWebLayout>
  );
}

function EditVehicleContent() {
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
  const posthog = usePostHog();
  const { theme } = useStyles();
  const colorScheme = useColorScheme();
  const colors = theme.colors;
  const isWeb = Platform.OS === "web";
  const layout = useResponsiveLayout();
  const isDesktopWeb = layout.isWeb && !layout.isMobile;
  const { styles: web } = useStyles(webPageStyles);
  const { styles: formWeb } = useStyles(formPageStyles);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setVehicle(null);
    setLoading(true);
    setLoadError(null);
    const fetchVehicle = async () => {
      try {
        if (!id) throw new Error("Vehicle not found");
        const { data, error } = await VehicleService.getVehicleById(id);
        if (cancelled) return;
        if (error || !data) throw new Error(error || "Vehicle not found");
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
      } catch {
        if (cancelled) return;
        setLoadError("Failed to load vehicle details");
        showError("Failed to load vehicle details");
        if (!isDesktopWeb)
          goBack({ pathname: "/vehicles/[id]", params: { id } });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchVehicle();
    return () => {
      cancelled = true;
    };
    // Toast helpers change identity on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, retry]);

  const vehicleName =
    vehicle?.id === id
      ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
      : "Vehicle";
  const breadcrumbs = (
    <Breadcrumbs
      items={[
        { label: "Vehicles", href: "/vehicles" },
        {
          label: vehicleName,
          href: { pathname: "/vehicles/[id]", params: { id } },
        },
        { label: "Vehicle Edit" },
      ]}
    />
  );

  const handleSave = async () => {
    if (!vehicle || saving || loading) return;

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

    try {
      const { error } = await VehicleService.updateVehicle(vehicle.id, updates);

      if (error) {
        let errorMsg = error;
        if (error.includes("permission") || error.includes("access denied")) {
          errorMsg =
            "You do not have permission to edit this vehicle. Only the owner can modify vehicle details.";
        }
        showError(errorMsg);
      } else {
        posthog?.capture("vehicle_updated", {
          make: updates.make,
          model: updates.model,
          year: updates.year,
        });
        showSuccess("Vehicle updated successfully!");
        router.push("/(tabs)/vehicles");
      }
    } catch {
      showError("Failed to update vehicle. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (url: string) => {
    setImageUri(url);
    showSuccess("Vehicle picture updated successfully!");
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
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: withOpacity(colors.textSecondary, 0.12),
      backgroundColor: colors.background,
    },
    backButton: {
      marginRight: spacing.lg,
      padding: spacing.xs,
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
      paddingBottom: spacing.xxxl,
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
      marginBottom: spacing.sm,
      textAlign: isWeb ? "center" : "left",
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: spacing.xxl,
      textAlign: isWeb ? "center" : "left",
    },
    avatarContainer: {
      alignItems: "center",
      marginBottom: spacing.xxl,
    },
    avatarUpload: {
      width: 120,
      height: 120,
      borderRadius: 60,
    },
    avatarLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: spacing.md,
      textAlign: "center",
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: spacing.lg,
    },
    row: {
      flexDirection: isWeb ? "row" : "column",
      gap: spacing.lg,
    },
    flex1: {
      flex: 1,
    },
    card: {
      backgroundColor: colors.background,
      borderRadius: isWeb ? 16 : 12,
      padding: isWeb ? 32 : 20,
      ...(isWeb && {
        shadowColor:
          colorScheme === "dark" ? theme.colors.white : theme.colors.black,
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
      gap: spacing.md,
      marginTop: spacing.xxl,
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
      backgroundColor: withOpacity(colors.textSecondary, 0.06),
      borderRadius: 8,
      padding: spacing.md,
      marginBottom: spacing.xl,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    sharedNoticeText: {
      fontSize: 14,
      color: colors.textSecondary,
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
              onPress={() =>
                goBack({ pathname: "/vehicles/[id]", params: { id } })
              }
            >
              <IconSymbol name="chevron.left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Vehicle</Text>
          </View>
        )}
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isDesktopWeb && formWeb.content,
          ]}
        >
          {isDesktopWeb && breadcrumbs}
          <SkeletonVehicleEdit />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isDesktopWeb && loadError) {
    return (
      <View style={[web.frame, formWeb.content]}>
        {breadcrumbs}
        <View style={[formWeb.panel, { gap: theme.spacing.lg }]}>
          <Text style={{ color: colors.text }}>{loadError}</Text>
          <Button
            title="Retry"
            onPress={() => setRetry((value) => value + 1)}
          />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {!isWeb && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              goBack({ pathname: "/vehicles/[id]", params: { id } })
            }
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
          contentContainerStyle={[
            styles.scrollContent,
            isDesktopWeb && formWeb.content,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isDesktopWeb && breadcrumbs}
          {isWeb && !isDesktopWeb && (
            <>
              <Text style={styles.title}>
                Edit Vehicle {isSharedVehicle && "(Shared)"}
              </Text>
              <Text style={styles.subtitle}>Update vehicle information</Text>
            </>
          )}

          <View style={[styles.card, isDesktopWeb && formWeb.panel]}>
            {isSharedVehicle && (
              <View style={styles.sharedNotice}>
                <IconSymbol
                  name="person.2.fill"
                  size={16}
                  color={colors.textSecondary}
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
                type="vehicle_main"
                vehicleId={vehicle?.id}
                currentImageUrl={imageUri}
                onUploadComplete={handleImageUpload}
                placeholder="Add Vehicle Photo"
                style={styles.avatarUpload}
                showDeleteButton={false}
                circular
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
                onPress={() =>
                  goBack({ pathname: "/vehicles/[id]", params: { id } })
                }
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
