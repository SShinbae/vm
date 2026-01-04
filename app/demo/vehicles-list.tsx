// @ts-nocheck - Demo file with known unistyles type incompatibilities
/**
 * Demo Vehicles Page
 *
 * Displays a list of demo vehicles with their details
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { DEMO_VEHICLES } from "@/lib/demo/mockData";

export default function DemoVehiclesPage() {
  const { styles } = useStyles(stylesheet);
  const router = useRouter();
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Vehicles</Text>
        <Text style={styles.subtitle}>{DEMO_VEHICLES.length} vehicles</Text>
      </View>

      {/* Vehicles List */}
      <View style={styles.vehiclesList}>
        {DEMO_VEHICLES.map((vehicle) => (
          <TouchableOpacity
            key={vehicle.id}
            style={[
              styles.vehicleCard,
              selectedVehicle === vehicle.id && styles.vehicleCardSelected,
            ]}
            onPress={() => setSelectedVehicle(vehicle.id)}
          >
            {/* Vehicle Header */}
            <View style={styles.vehicleHeader}>
              <Text style={styles.vehicleName}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Text>
              {vehicle.license_plate && (
                <View style={styles.licensePlate}>
                  <Text style={styles.licensePlateText}>
                    {vehicle.license_plate}
                  </Text>
                </View>
              )}
            </View>

            {/* Vehicle Info Grid */}
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Color</Text>
                <Text style={styles.infoValue}>{vehicle.color}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Mileage</Text>
                <Text style={styles.infoValue}>
                  {vehicle.current_mileage.toLocaleString()}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Fuel Type</Text>
                <Text style={styles.infoValue}>{vehicle.fuel_type}</Text>
              </View>
              {vehicle.vin && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>VIN</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {vehicle.vin}
                  </Text>
                </View>
              )}
            </View>

            {/* Vehicle Notes */}
            {vehicle.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.notesLabel}>Notes:</Text>
                <Text style={styles.notesText}>{vehicle.notes}</Text>
              </View>
            )}

            {/* Expanded Details */}
            {selectedVehicle === vehicle.id && (
              <View style={styles.expandedSection}>
                <View style={styles.divider} />
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {}}
                  >
                    <Text style={styles.actionButtonText}>⛽ Fuel Logs</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {}}
                  >
                    <Text style={styles.actionButtonText}>🔧 Services</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {}}
                  >
                    <Text style={styles.actionButtonText}>📊 Analytics</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Vehicle Demo Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() =>
          alert("Demo Mode: New vehicles cannot be added permanently")
        }
      >
        <Text style={styles.addButtonText}>+ Add Vehicle (Demo)</Text>
      </TouchableOpacity>

      {/* Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoBoxText}>
          💡 In demo mode, you can explore these sample vehicles but cannot make
          permanent changes. Create an account to manage your own vehicles!
        </Text>
      </View>
    </ScrollView>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  vehiclesList: {
    marginBottom: 16,
  },
  vehicleCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  vehicleCardSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  vehicleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
    flex: 1,
  },
  licensePlate: {
    backgroundColor: theme.colors.primary + "20",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  licensePlateText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.primary,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  infoItem: {
    flex: 1,
    minWidth: 120,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  notesLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  expandedSection: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.primary + "10",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.primary,
    textAlign: "center",
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  infoBox: {
    backgroundColor: theme.colors.info || "#E3F2FD",
    borderRadius: 12,
    padding: 16,
  },
  infoBoxText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
}));
