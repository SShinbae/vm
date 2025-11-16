import React from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface VehicleSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

/**
 * VehicleSearchBar Component
 * Isolated search input with clear functionality
 * Handles vehicle search by make, model, plate, or year
 */
export function VehicleSearchBar({
  searchQuery,
  onSearchChange,
}: VehicleSearchBarProps) {
  const { styles, theme } = useStyles(stylesheet);

  return (
    <View style={styles.searchContainer}>
      <IconSymbol
        name="magnifyingglass"
        size={20}
        color={theme.colors.textSecondary}
      />
      <TextInput
        style={styles.searchInput}
        placeholder="Search vehicles by make, model, plate..."
        placeholderTextColor={theme.colors.textSecondary}
        value={searchQuery}
        onChangeText={onSearchChange}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => onSearchChange("")}>
          <IconSymbol
            name="xmark.circle.fill"
            size={20}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
  },
}));
