import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStyles } from "react-native-unistyles";
import { Image } from "expo-image";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { storageImageUrl } from "@/lib/utils/storagePath";
import { VehicleWithDetails } from "@/types/database-v2";

interface Props {
  vehicles: VehicleWithDetails[];
  selectedId?: string;
  onSelect: (id?: string) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  visible: boolean;
  onOpen: () => void;
  onClose: () => void;
}

function VehicleChoice({
  vehicle,
  selected,
  onPress,
}: {
  vehicle: VehicleWithDetails;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useStyles();
  const [imageError, setImageError] = useState(false);
  const name = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Select ${name}, ${vehicle.license_plate}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minHeight: 64,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      {vehicle.main_image_url && !imageError ? (
        <Image
          source={{
            uri: storageImageUrl("vehicle-images", vehicle.main_image_url),
          }}
          onError={() => setImageError(true)}
          style={{ width: 40, height: 40, borderRadius: 8 }}
        />
      ) : (
        <View
          style={{
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            backgroundColor: theme.colors.surface,
          }}
        >
          <IconSymbol name="car.fill" size={24} color={theme.colors.primary} />
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text style={{ color: theme.colors.text, fontWeight: "600" }}>
          {name}
        </Text>
        <Text style={{ color: theme.colors.textSecondary }}>
          {vehicle.license_plate}
          {!vehicle.is_own_vehicle ? " · Shared" : ""}
        </Text>
      </View>
      {selected && (
        <IconSymbol name="checkmark" size={20} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );
}

export function LogVehicleFilter({
  vehicles,
  selectedId,
  onSelect,
  loading,
  error,
  onRetry,
  visible,
  onOpen,
  onClose,
}: Props) {
  const { theme } = useStyles();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const selected =
    vehicles.find((v) => v.id === selectedId) ||
    (vehicles.length === 1 ? vehicles[0] : undefined);
  const term = search.trim().toLowerCase();
  const matching = vehicles.filter((v) =>
    `${v.year} ${v.make} ${v.model} ${v.license_plate}`
      .toLowerCase()
      .includes(term),
  );
  const select = (id?: string) => {
    onSelect(id);
    onClose();
  };
  const label = selected
    ? `${selected.year} ${selected.make} ${selected.model} · ${selected.license_plate}`
    : "All vehicles";
  return (
    <>
      <View style={{ gap: 8 }}>
        {vehicles.length === 1 && !error && !loading ? (
          <Text
            style={{ color: theme.colors.textSecondary, paddingVertical: 12 }}
          >
            {label}
          </Text>
        ) : (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Filter by vehicle"
            accessibilityState={{ expanded: visible, disabled: loading }}
            disabled={loading}
            onPress={() => {
              setSearch("");
              onOpen();
            }}
            style={{
              minHeight: 48,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 12,
              borderWidth: 1,
              borderRadius: 8,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            }}
          >
            <IconSymbol
              name="car.fill"
              size={22}
              color={theme.colors.primary}
            />
            <Text style={{ flex: 1, minWidth: 0, color: theme.colors.text }}>
              {loading ? "Loading vehicles…" : label}
            </Text>
            <IconSymbol
              name="chevron.down"
              size={22}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        {error && (
          <View style={{ gap: 8 }}>
            <Text style={{ color: theme.colors.textSecondary }}>{error}</Text>
            <Button
              title="Retry vehicles"
              variant="outline"
              style={{ minHeight: 48 }}
              onPress={onRetry}
            />
          </View>
        )}
      </View>
      <Modal
        visible={visible}
        onClose={onClose}
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
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Text
              accessibilityRole="header"
              style={{
                flex: 1,
                color: theme.colors.text,
                fontSize: theme.fontSize.lg,
                fontWeight: "600",
              }}
            >
              Choose vehicle
            </Text>
            <Button
              title="Close"
              variant="outline"
              style={{ minHeight: 48 }}
              onPress={onClose}
            />
          </View>
          <Input
            accessibilityLabel="Search vehicles by name or plate"
            placeholder="Search name or plate"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            inputStyle={{ minHeight: 48 }}
          />
          <ScrollView
            style={{ maxHeight: height * 0.4 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Select all vehicles"
              accessibilityState={{ selected: !selectedId }}
              onPress={() => select()}
              style={{
                minHeight: 48,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Text
                style={{ flex: 1, color: theme.colors.text, fontWeight: "600" }}
              >
                All vehicles
              </Text>
              {!selectedId && (
                <IconSymbol
                  name="checkmark"
                  size={20}
                  color={theme.colors.primary}
                />
              )}
            </TouchableOpacity>
            {loading ? (
              <ActivityIndicator />
            ) : (
              matching.map((vehicle) => (
                <VehicleChoice
                  key={vehicle.id}
                  vehicle={vehicle}
                  selected={selectedId === vehicle.id}
                  onPress={() => select(vehicle.id)}
                />
              ))
            )}
            {!loading && !matching.length && (
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  paddingVertical: 16,
                }}
              >
                {vehicles.length
                  ? "No vehicles match your search"
                  : error || "No vehicles available"}
              </Text>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
