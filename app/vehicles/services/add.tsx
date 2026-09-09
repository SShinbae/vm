import { withOpacity, spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useToast } from "@/hooks/useToast";
import { VehicleService } from "@/lib/services/vehicleService";
import { ServiceItemFormData, ServiceTemplateFormData } from "@/types";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddServiceScreen() {
  const [formData, setFormData] = useState<ServiceTemplateFormData>({
    name: "",
    description: "",
    items: [
      { description: "", price: 0 },
      { description: "", price: 0 },
    ],
  });
  const [loading, setLoading] = useState(false);
  const { theme } = useStyles();
  const colors = theme.colors;
  const { showSuccess, showError } = useToast();

  const calculateTotalCost = (items: ServiceItemFormData[]): number => {
    return items.reduce((total, item) => total + (item.price || 0), 0);
  };

  const totalCost = calculateTotalCost(formData.items);

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      showError("Please enter a service name");
      return;
    }

    const validItems = formData.items.filter(
      (item) => item.description.trim() && item.price > 0,
    );

    if (validItems.length === 0) {
      showError("Please add at least one valid service item");
      return;
    }

    setLoading(true);

    const cleanFormData = {
      ...formData,
      items: validItems,
    };

    const result = await VehicleService.createServiceTemplate(cleanFormData);
    setLoading(false);

    if (result.error) {
      showError(result.error);
    } else {
      showSuccess("Service template created successfully!");
      router.back();
    }
  };

  const updateItem = (
    index: number,
    field: keyof ServiceItemFormData,
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { description: "", price: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length <= 1) {
      showError("At least one service item is required");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const isFormValid = () => {
    const hasName = formData.name.trim().length > 0;
    const hasValidItems = formData.items.some(
      (item) => item.description.trim() && item.price > 0,
    );
    return hasName && hasValidItems;
  };

  const ServiceItem = ({
    item,
    index,
  }: {
    item: ServiceItemFormData;
    index: number;
  }) => (
    <View style={styles.serviceItem}>
      <View style={styles.serviceItemHeader}>
        <Text style={styles.serviceItemTitle}>Item {index + 1}</Text>
        {formData.items.length > 1 && (
          <TouchableOpacity
            style={styles.removeItemButton}
            onPress={() => removeItem(index)}
          >
            <IconSymbol name="trash" size={16} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.serviceItemContent}>
        <View style={styles.serviceItemDescriptionContainer}>
          <Text style={styles.serviceItemLabel}>Description</Text>
          <TextInput
            style={styles.serviceItemInput}
            value={item.description}
            onChangeText={(text) => updateItem(index, "description", text)}
            placeholder="e.g., Engine Oil (5L)"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.serviceItemPriceContainer}>
          <Text style={styles.serviceItemLabel}>Price (RM)</Text>
          <TextInput
            style={styles.serviceItemInput}
            value={item.price?.toString() || ""}
            onChangeText={(text) => {
              const price = parseFloat(text) || 0;
              updateItem(index, "price", price);
            }}
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </View>
      </View>
    </View>
  );

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
    },
    backButton: {
      marginRight: spacing.lg,
      padding: spacing.xs,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      flex: 1,
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      color: "white",
      fontSize: 14,
      fontWeight: "600",
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.xl,
    },
    formCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: spacing.xl,
      borderWidth: 1,
      borderColor: withOpacity(colors.textSecondary, 0.12),
      marginBottom: spacing.xl,
    },
    inputContainer: {
      marginBottom: spacing.xl,
    },
    label: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
      marginBottom: spacing.sm,
    },
    requiredLabel: {
      color: colors.error,
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.textSecondary,
      borderRadius: 8,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      fontSize: 16,
      color: colors.text,
    },
    textArea: {
      height: 80,
      textAlignVertical: "top",
    },
    itemsSection: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: spacing.lg,
    },
    serviceItem: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: withOpacity(colors.textSecondary, 0.19),
      borderRadius: 8,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    serviceItemHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    serviceItemTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    removeItemButton: {
      padding: spacing.xs,
    },
    serviceItemContent: {
      gap: spacing.md,
    },
    serviceItemDescriptionContainer: {
      flex: 1,
    },
    serviceItemPriceContainer: {
      width: 120,
    },
    serviceItemLabel: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.text,
      marginBottom: spacing.sm,
    },
    serviceItemInput: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: withOpacity(colors.textSecondary, 0.31),
      borderRadius: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 14,
      color: colors.text,
    },
    addItemButton: {
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.primary,
      borderStyle: "dashed",
      borderRadius: 8,
      padding: spacing.lg,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: spacing.sm,
    },
    addItemButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "500",
    },
    totalSection: {
      backgroundColor: withOpacity(colors.primary, 0.06),
      borderRadius: 8,
      padding: spacing.lg,
      alignItems: "center",
    },
    totalLabel: {
      fontSize: 14,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    totalCost: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.primary,
    },
    helpText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      lineHeight: 16,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Service Template</Text>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!isFormValid() || loading) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!isFormValid() || loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <IconSymbol name="checkmark" size={14} color="white" />
              <Text style={styles.saveButtonText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Service Name <Text style={styles.requiredLabel}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, name: text }))
                }
                placeholder="e.g., Basic Oil Change"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, description: text }))
                }
                placeholder="Optional description of the service..."
                placeholderTextColor={colors.textSecondary}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>Service Items</Text>

            {formData.items.map((item, index) => (
              <ServiceItem key={index} item={item} index={index} />
            ))}

            <TouchableOpacity style={styles.addItemButton} onPress={addItem}>
              <IconSymbol name="plus" size={16} color={colors.primary} />
              <Text style={styles.addItemButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total Cost</Text>
            <Text style={styles.totalCost}>RM{totalCost.toFixed(2)}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
