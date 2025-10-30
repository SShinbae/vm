import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Ionicons } from "@expo/vector-icons";
import { Vehicle } from "../../types";

interface VehicleFilterProps {
  vehicles: Vehicle[];
  selectedVehicleIds: string[];
  onToggleVehicle: (vehicleId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export function VehicleFilter({
  vehicles,
  selectedVehicleIds,
  onToggleVehicle,
  onSelectAll,
  onClearAll,
}: VehicleFilterProps) {
  const { styles, theme } = useStyles(stylesheet);
  const [modalVisible, setModalVisible] = useState(false);

  const isAllSelected = selectedVehicleIds.length === 0;
  const selectedCount = isAllSelected
    ? vehicles.length
    : selectedVehicleIds.length;

  const getButtonText = () => {
    if (isAllSelected) {
      return "All Vehicles";
    }
    if (selectedCount === 1) {
      const vehicle = vehicles.find((v) => v.id === selectedVehicleIds[0]);
      return vehicle
        ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
        : "1 Vehicle";
    }
    return `${selectedCount} Vehicles`;
  };

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.label}>Vehicles</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.selectorText}>{getButtonText()}</Text>
          <Ionicons
            name="chevron-down-outline"
            size={20}
            color={theme.colors.text}
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Vehicles</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons
                  name="close-outline"
                  size={24}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  onSelectAll();
                  setModalVisible(false);
                }}
              >
                <Text style={styles.actionButtonText}>All Vehicles</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onClearAll}
              >
                <Text style={styles.actionButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={vehicles}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected =
                  isAllSelected || selectedVehicleIds.includes(item.id);
                return (
                  <TouchableOpacity
                    style={styles.vehicleItem}
                    onPress={() => onToggleVehicle(item.id)}
                  >
                    <View style={styles.vehicleInfo}>
                      <Text style={styles.vehicleName}>
                        {item.year} {item.make} {item.model}
                      </Text>
                      <Text style={styles.vehiclePlate}>
                        {item.license_plate}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected,
                      ]}
                    >
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={theme.colors.white}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    marginBottom: theme.spacing.sm,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectorText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: "80%",
    paddingTop: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  actionButtons: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  vehicleItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  vehiclePlate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
}));
