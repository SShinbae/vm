import { IconSymbol } from "@/components/ui/icon-symbol";
import { VehicleWithShares } from "@/hooks/useDashboardDataQuery";
import { searchHomeVehicles } from "@/lib/dashboard/homeOverview";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

export function HomeVehicleSearch({
  vehicles,
}: {
  vehicles: VehicleWithShares[];
}) {
  const { styles, theme } = useStyles(stylesheet);
  const [query, setQuery] = useState("");
  const matches = searchHomeVehicles(vehicles, query);

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <IconSymbol
          name="magnifyingglass"
          size={18}
          color={theme.colors.textSecondary}
        />
        <TextInput
          accessibilityLabel="Search vehicles"
          placeholder="Search vehicles"
          placeholderTextColor={theme.colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          style={styles.input}
        />
        {!!query && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => setQuery("")}
          >
            <IconSymbol
              name="xmark.circle.fill"
              size={18}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {!!query.trim() && (
        <ScrollView style={styles.results} keyboardShouldPersistTaps="always">
          {matches.length ? (
            matches.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                accessibilityRole="button"
                onPress={() => {
                  setQuery("");
                  router.push(`/vehicles/${vehicle.id}` as any);
                }}
                style={styles.result}
              >
                <Text style={styles.resultName}>
                  {[vehicle.year, vehicle.make, vehicle.model]
                    .filter(Boolean)
                    .join(" ")}
                </Text>
                <Text style={styles.resultPlate}>
                  {vehicle.license_plate || "No plate"}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noResults}>No matching vehicles</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: { position: "relative", zIndex: 20, minWidth: 0 },
  inputRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    minWidth: 0,
  },
  results: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    maxHeight: 240,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    zIndex: 30,
  },
  result: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  resultName: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  resultPlate: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
  },
  noResults: {
    color: theme.colors.textSecondary,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.sm,
  },
}));
