import React, { ComponentProps } from "react";
import { Pressable, Text } from "react-native";
import { useStyles } from "react-native-unistyles";
import { withOpacity } from "@/src/design-system";
import { IconSymbol } from "./icon-symbol";

export function WebFilterButton({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: ComponentProps<typeof IconSymbol>["name"];
}) {
  const { theme } = useStyles();
  const [hovered, setHovered] = React.useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{
        minHeight: 36,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
        backgroundColor: selected
          ? theme.colors.primary
          : hovered
            ? withOpacity(theme.colors.primary, 0.08)
            : "transparent",
      }}
    >
      {icon && (
        <IconSymbol
          name={icon}
          size={18}
          color={selected ? theme.colors.white : theme.colors.textSecondary}
        />
      )}
      <Text
        style={{
          color: selected ? theme.colors.white : theme.colors.textSecondary,
          fontSize: theme.fontSize.sm,
          fontWeight: theme.fontWeight.semibold,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
