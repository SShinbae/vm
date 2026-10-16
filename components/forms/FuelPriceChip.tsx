import { withOpacity } from "@/src/design-system";
import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

type FuelPriceChipProps = {
  price: number;
  isSelected: boolean;
  onPress: () => void;
  label?: string;
};

export function FuelPriceChip({
  price,
  isSelected,
  onPress,
  label,
}: FuelPriceChipProps) {
  const { styles, theme } = useStyles(stylesheet);

  // Use 'primary' color as the tint
  const selectedStyles = isSelected && {
    borderColor: theme.colors.primary,
    backgroundColor: withOpacity(theme.colors.primary, 0.08),
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={label || `RM ${price.toFixed(2)} per liter`}
      style={[styles.fuelPriceOption, selectedStyles]}
      onPress={onPress}
    >
      <Text
        style={[styles.fuelPriceOptionText, isSelected && styles.selectedText]}
      >
        {label || `RM ${price.toFixed(2)}`}
      </Text>
    </TouchableOpacity>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  fuelPriceOption: {
    minHeight: 48,
    flex: 1,
    minWidth: "30%", // wraps to ~3 chips per row
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
