import React from "react";
import { TouchableOpacity } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { IconSymbol } from "./icon-symbol";

interface FloatingActionButtonProps {
  onPress: () => void;
  icon: string;
  accessibilityLabel?: string;
}

/**
 * FloatingActionButton Component
 * A circular floating action button typically used for primary actions
 */
export function FloatingActionButton({
  onPress,
  icon,
  accessibilityLabel = "Action",
}: FloatingActionButtonProps) {
  const { styles, theme } = useStyles(stylesheet);

  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
    >
      <IconSymbol name={icon as any} size={24} color={theme.colors.white} />
    </TouchableOpacity>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  fab: {
    position: "absolute",
    bottom: theme.spacing.xl,
    right: theme.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
}));
