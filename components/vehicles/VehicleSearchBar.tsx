import React from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

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
  const { isMobile } = useResponsiveLayout();

  const iconSize = isMobile ? 18 : 20;

  return (
    <View
      style={[styles.searchContainer, isMobile && styles.searchContainerMobile]}
    >
      <IconSymbol
        name="magnifyingglass"
        size={iconSize}
        color={theme.colors.textSecondary}
      />
      <TextInput
        style={[styles.searchInput, isMobile && styles.searchInputMobile]}
        placeholder="Search vehicles by make, model, plate..."
        placeholderTextColor={theme.colors.textSecondary}
        value={searchQuery}
        onChangeText={onSearchChange}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => onSearchChange("")}>
          <IconSymbol
            name="xmark.circle.fill"
            size={iconSize}
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
  searchContainerMobile: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
  },
  searchInputMobile: {
    fontSize: theme.fontSize.sm,
  },
}));
