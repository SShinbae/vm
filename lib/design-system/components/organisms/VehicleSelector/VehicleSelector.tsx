import { IconSymbol } from "@/components/ui/icon-symbol";
import { VehicleWithDetails } from "@/types/database-v2";
import { Image } from "expo-image";
import React, { useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { useStyles } from "react-native-unistyles";
import { Text } from "../../atoms/Text";
import { Spacer } from "../../atoms/Spacer";

interface VehicleSelectorProps {
  vehicles: VehicleWithDetails[];
  selectedVehicleId?: string;
  onSelect: (vehicleId: string) => void;
  lockedVehicleId?: string;
  label?: string;
  required?: boolean;
}

const VehicleOption: React.FC<{
  vehicle: VehicleWithDetails;
  isSelected: boolean;
  onPress: () => void;
}> = ({ vehicle, isSelected, onPress }) => {
  const { theme } = useStyles();
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity
      style={{
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
        backgroundColor: isSelected
          ? theme.colors.primary + "10"
          : theme.colors.surface,
        marginRight: theme.spacing.sm,
        alignItems: "center",
        minWidth: 120,
      }}
      onPress={onPress}
    >
      {vehicle.main_image_url && !imageError ? (
        <Image
          source={{ uri: vehicle.main_image_url }}
          style={{ width: 40, height: 40, borderRadius: 20 }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
          onError={() => setImageError(true)}
        />
      ) : (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconSymbol name="car.fill" size={20} color="white" />
        </View>
      )}
      <Spacer size="xs" />
      <Text
        size="sm"
        weight="semibold"
        color={isSelected ? "primary" : "primary"}
        align="center"
      >
        {vehicle.year} {vehicle.make}
      </Text>
      <Text size="xs" color="secondary" align="center">
        {vehicle.license_plate}
      </Text>
    </TouchableOpacity>
  );
};

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  vehicles,
  selectedVehicleId,
  onSelect,
  lockedVehicleId,
  label = "Vehicle",
  required = false,
}) => {
  const { theme } = useStyles();
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const isLocked = !!lockedVehicleId;
  const [imageError, setImageError] = useState(false);

  if (isLocked && selectedVehicle) {
    return (
      <View>
        <Text size="sm" weight="semibold" color="secondary">
          {label} {required && <Text color="error">*</Text>}
        </Text>
        <Spacer size="sm" />
        <View
          style={{
            padding: theme.spacing.md,
            borderRadius: 8,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {selectedVehicle.main_image_url && !imageError ? (
              <Image
                source={{ uri: selectedVehicle.main_image_url }}
                style={{ width: 40, height: 40, borderRadius: 20 }}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
                onError={() => setImageError(true)}
              />
            ) : (
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme.colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconSymbol name="car.fill" size={20} color="white" />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
              <Text weight="semibold">
                {selectedVehicle.year} {selectedVehicle.make}{" "}
                {selectedVehicle.model}
              </Text>
              <Text size="sm" color="secondary">
                {selectedVehicle.license_plate}
              </Text>
            </View>
            <IconSymbol
              name="lock.fill"
              size={16}
              color={theme.colors.textSecondary}
            />
          </View>
          <Spacer size="xs" />
          <Text size="sm" color="secondary">
            Adding log for this vehicle
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text size="sm" weight="semibold" color="secondary">
        {label} {required && <Text color="error">*</Text>}
      </Text>
      <Spacer size="sm" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: theme.spacing.xs }}
      >
        {vehicles.map((vehicle) => (
          <VehicleOption
            key={vehicle.id}
            vehicle={vehicle}
            isSelected={selectedVehicleId === vehicle.id}
            onPress={() => onSelect(vehicle.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
};
