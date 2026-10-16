import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useStyles } from "react-native-unistyles";
import { Ionicons } from "@expo/vector-icons";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Vehicle } from "@/types";

export function AnalyticsVehiclePicker({
  compact = false,
  vehicles,
  selectedVehicleIds,
  onToggleVehicle,
  onSelectAll,
}: {
  compact?: boolean;
  vehicles: Vehicle[];
  selectedVehicleIds: string[];
  onToggleVehicle: (id: string) => void;
  onSelectAll: () => void;
}) {
  const { theme } = useStyles();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  useFocusEffect(useCallback(() => () => setVisible(false), []));
  const selected = vehicles.filter((v) => selectedVehicleIds.includes(v.id));
  const label = !selectedVehicleIds.length
    ? "All vehicles"
    : selected.length === 1
      ? `${selected[0].year} ${selected[0].make} ${selected[0].model} · ${selected[0].license_plate}`
      : `${selected.length} vehicles selected`;
  const matching = vehicles.filter((v) =>
    `${v.year} ${v.make} ${v.model} ${v.license_plate}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  const apply = () => {
    if (!draft.length) onSelectAll();
    else {
      selectedVehicleIds
        .filter((id) => !draft.includes(id))
        .forEach((id) => onToggleVehicle(id));
      draft
        .filter((id) => !selectedVehicleIds.includes(id))
        .forEach((id) => onToggleVehicle(id));
    }
    setVisible(false);
  };
  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Filter analytics by vehicle"
        accessibilityValue={{ text: label }}
        accessibilityState={{ expanded: visible }}
        onPress={() => {
          setDraft([...selectedVehicleIds]);
          setSearch("");
          setVisible(true);
        }}
        style={{
          minHeight: compact ? 56 : 48,
          flexGrow: compact ? 1 : 0,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.borderRadius.lg,
          padding: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: compact ? 6 : 12,
        }}
      >
        <Ionicons
          name="car-outline"
          size={compact ? 18 : 22}
          color={theme.colors.textSecondary}
        />
        <Text
          numberOfLines={compact ? 2 : undefined}
          style={{
            flex: 1,
            minWidth: 0,
            color: theme.colors.text,
            fontSize: theme.fontSize.sm,
          }}
        >
          {compact && selected.length === 1
            ? `${selected[0].make} ${selected[0].model}`
            : label}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>
      <Modal
        visible={visible}
        onClose={() => setVisible(false)}
        variant="bottom-sheet"
        showCloseButton={false}
        contentStyle={{
          maxHeight: height - insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <KeyboardAvoidingView
          enabled={Platform.OS !== "web"}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{
            maxHeight: Math.max(120, height - insets.top - insets.bottom - 96),
          }}
        >
          <ScrollView
            style={{ flexShrink: 1 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <Text
              accessibilityRole="header"
              style={{
                color: theme.colors.text,
                fontSize: theme.fontSize.lg,
                fontWeight: "600",
                marginBottom: 16,
              }}
            >
              Choose vehicles
            </Text>
            <Input
              accessibilityLabel="Search vehicles by name or plate"
              placeholder="Search name or plate"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              inputStyle={{ minHeight: 48 }}
            />
            <View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: !draft.length }}
                onPress={() => setDraft([])}
                style={{
                  minHeight: 48,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    color: theme.colors.text,
                    fontWeight: "600",
                  }}
                >
                  All vehicles
                </Text>
                {!draft.length && (
                  <Ionicons
                    name="checkmark"
                    size={22}
                    color={theme.colors.primary}
                  />
                )}
              </TouchableOpacity>
              {matching.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${v.year} ${v.make} ${v.model}, ${v.license_plate}`}
                  accessibilityState={{ selected: draft.includes(v.id) }}
                  onPress={() =>
                    setDraft((prev) =>
                      prev.includes(v.id)
                        ? prev.filter((id) => id !== v.id)
                        : [...prev, v.id],
                    )
                  }
                  style={{
                    minHeight: 64,
                    paddingVertical: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    borderTopWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                >
                  <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                    <Text
                      style={{ color: theme.colors.text, fontWeight: "600" }}
                    >
                      {v.year} {v.make} {v.model}
                    </Text>
                    <Text style={{ color: theme.colors.textSecondary }}>
                      {v.license_plate}
                    </Text>
                  </View>
                  {draft.includes(v.id) && (
                    <Ionicons
                      name="checkmark"
                      size={22}
                      color={theme.colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
              {!matching.length && (
                <Text
                  style={{
                    paddingVertical: 16,
                    color: theme.colors.textSecondary,
                  }}
                >
                  {vehicles.length
                    ? "No vehicles match your search"
                    : "No vehicles available"}
                </Text>
              )}
            </View>
            <View style={{ flexDirection: "row", gap: 12, paddingTop: 16 }}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setVisible(false)}
                style={{ flex: 1, minHeight: 48 }}
              />
              <Button
                title="Apply"
                onPress={apply}
                style={{ flex: 1, minHeight: 48 }}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
