import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

type FuelPriceChipProps = {
  price: number;
  isSelected: boolean;
  onPress: () => void;
};

export function FuelPriceChip({
  price,
  isSelected,
  onPress,
}: FuelPriceChipProps) {
  const { styles, theme } = useStyles(stylesheet);

  // Use 'primary' color as the tint
  const selectedStyles = isSelected && {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + "15",
  };

  return (
    <TouchableOpacity
      style={[styles.fuelPriceOption, selectedStyles]}
      onPress={onPress}
    >
      <Text
        style={[styles.fuelPriceOptionText, isSelected && styles.selectedText]}
      >
        RM {price.toFixed(2)}
      </Text>
    </TouchableOpacity>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  fuelPriceOption: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  fuelPriceOptionText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  selectedText: {
    color: theme.colors.primary,
  },
}));
