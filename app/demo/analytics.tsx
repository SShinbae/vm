/**
 * Demo Analytics Page
 *
 * Displays analytics and statistics using demo data
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DEMO_VEHICLES,
  DEMO_FUEL_LOGS,
  DEMO_SERVICE_LOGS,
  DEMO_DASHBOARD_STATS,
} from "@/lib/demo/mockData";

export default function DemoAnalyticsPage() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  // Filter logs by selected vehicle
  const filteredFuelLogs = selectedVehicle
    ? DEMO_FUEL_LOGS.filter((log) => log.vehicle_id === selectedVehicle)
    : DEMO_FUEL_LOGS;
  const filteredServiceLogs = selectedVehicle
    ? DEMO_SERVICE_LOGS.filter((log) => log.vehicle_id === selectedVehicle)
    : DEMO_SERVICE_LOGS;

  // Calculate stats using correct field names from mock data
  const totalFuelCost = filteredFuelLogs.reduce(
    (sum, log) => sum + (log.cost || 0),
    0,
  );
  const totalServiceCost = filteredServiceLogs.reduce(
    (sum, log) => sum + (log.cost || 0),
    0,
  );
  const totalFuelQuantity = filteredFuelLogs.reduce(
    (sum, log) => sum + (log.liters_filled || 0),
    0,
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backText, { color: colors.primary }]}>
            ← Kembali
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Analitik</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Statistik & laporan demo
        </Text>
      </View>

      {/* Vehicle Selector */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Pilih Kenderaan
        </Text>
        <View style={styles.vehicleSelector}>
          <TouchableOpacity
            style={[
              styles.vehicleTab,
              { backgroundColor: colors.surface, borderColor: colors.border },
              !selectedVehicle && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setSelectedVehicle(null)}
          >
            <Text
              style={[
                styles.vehicleTabText,
                { color: colors.text },
                !selectedVehicle && { color: "#FFFFFF" },
              ]}
            >
              Semua
            </Text>
          </TouchableOpacity>
          {DEMO_VEHICLES.map((vehicle) => (
            <TouchableOpacity
              key={vehicle.id}
              style={[
                styles.vehicleTab,
                { backgroundColor: colors.surface, borderColor: colors.border },
                selectedVehicle === vehicle.id && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setSelectedVehicle(vehicle.id)}
            >
              <Text
                style={[
                  styles.vehicleTabText,
                  { color: colors.text },
                  selectedVehicle === vehicle.id && { color: "#FFFFFF" },
                ]}
              >
                {vehicle.make} {vehicle.model}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Overview Stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Ringkasan
        </Text>
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {filteredFuelLogs.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Log Minyak
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {filteredServiceLogs.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Servis
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {totalFuelQuantity.toFixed(1)}L
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Jumlah Liter
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {DEMO_VEHICLES.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Kenderaan
            </Text>
          </View>
        </View>
      </View>

      {/* Cost Analysis */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Analisis Kos
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.costRow}>
            <Text style={[styles.costLabel, { color: colors.textSecondary }]}>
              Kos Minyak
            </Text>
            <Text style={[styles.costValue, { color: colors.text }]}>
              RM{totalFuelCost.toFixed(2)}
            </Text>
          </View>
          <View style={styles.costRow}>
            <Text style={[styles.costLabel, { color: colors.textSecondary }]}>
              Kos Servis
            </Text>
            <Text style={[styles.costValue, { color: colors.text }]}>
              RM{totalServiceCost.toFixed(2)}
            </Text>
          </View>
          <View
            style={[
              styles.costRow,
              styles.totalRow,
              { borderTopColor: colors.border },
            ]}
          >
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Jumlah Kos
            </Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              RM{(totalFuelCost + totalServiceCost).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Average Cost per Liter */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              marginTop: 12,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
            Purata Kos per Liter
          </Text>
          <Text style={[styles.largeValue, { color: colors.primary }]}>
            RM
            {totalFuelQuantity > 0
              ? (totalFuelCost / totalFuelQuantity).toFixed(2)
              : "0.00"}
          </Text>
          <Text style={[styles.smallText, { color: colors.textSecondary }]}>
            Berdasarkan {totalFuelQuantity.toFixed(1)} liter minyak
          </Text>
        </View>
      </View>

      {/* Fuel Economy */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Penjimatan Minyak
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartText}>⛽</Text>
            <Text style={[styles.chartLabel, { color: colors.text }]}>
              Purata: {DEMO_DASHBOARD_STATS.averageFuelEconomy} km/L
            </Text>
            <Text
              style={[styles.chartSubtext, { color: colors.textSecondary }]}
            >
              Berdasarkan {filteredFuelLogs.length} log minyak
            </Text>
          </View>
        </View>
      </View>

      {/* Recent Fuel Logs */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Log Minyak Terkini
        </Text>
        {filteredFuelLogs
          .slice(-3)
          .reverse()
          .map((log) => {
            const vehicle = DEMO_VEHICLES.find((v) => v.id === log.vehicle_id);
            return (
              <View
                key={log.id}
                style={[
                  styles.logCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.logHeader}>
                  <Text style={[styles.logDate, { color: colors.text }]}>
                    {new Date(log.date).toLocaleDateString("ms-MY")}
                  </Text>
                  <Text style={[styles.logCost, { color: colors.primary }]}>
                    RM{(log.cost || 0).toFixed(2)}
                  </Text>
                </View>
                <Text
                  style={[styles.logVehicle, { color: colors.textSecondary }]}
                >
                  {vehicle?.year} {vehicle?.make} {vehicle?.model}
                </Text>
                <View style={styles.logDetails}>
                  <Text
                    style={[styles.logDetail, { color: colors.textSecondary }]}
                  >
                    {log.liters_filled}L
                  </Text>
                  {log.location && (
                    <Text
                      style={[
                        styles.logDetail,
                        { color: colors.textSecondary },
                      ]}
                    >
                      • {log.location}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
      </View>

      {/* Recent Services */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Servis Terkini
        </Text>
        {filteredServiceLogs
          .slice(-3)
          .reverse()
          .map((log) => {
            const vehicle = DEMO_VEHICLES.find((v) => v.id === log.vehicle_id);
            return (
              <View
                key={log.id}
                style={[
                  styles.logCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.logHeader}>
                  <Text style={[styles.logDate, { color: colors.text }]}>
                    {new Date(log.date).toLocaleDateString("ms-MY")}
                  </Text>
                  <Text style={[styles.logCost, { color: colors.primary }]}>
                    RM{(log.cost || 0).toFixed(2)}
                  </Text>
                </View>
                <Text
                  style={[styles.logVehicle, { color: colors.textSecondary }]}
                >
                  {vehicle?.year} {vehicle?.make} {vehicle?.model}
                </Text>
                <Text style={[styles.serviceType, { color: colors.text }]}>
                  {log.service_type}
                </Text>
                {log.description && (
                  <Text
                    style={[styles.logDetail, { color: colors.textSecondary }]}
                  >
                    {log.description}
                  </Text>
                )}
              </View>
            );
          })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  vehicleSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  vehicleTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  vehicleTabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  largeValue: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 4,
  },
  smallText: {
    fontSize: 12,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  costLabel: {
    fontSize: 14,
  },
  costValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  totalRow: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  chartPlaceholder: {
    alignItems: "center",
    paddingVertical: 24,
  },
  chartText: {
    fontSize: 48,
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  chartSubtext: {
    fontSize: 14,
  },
  logCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  logDate: {
    fontSize: 14,
    fontWeight: "600",
  },
  logCost: {
    fontSize: 16,
    fontWeight: "700",
  },
  logVehicle: {
    fontSize: 14,
    marginBottom: 8,
  },
  serviceType: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  logDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  logDetail: {
    fontSize: 12,
  },
});
