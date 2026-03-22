import { IconSymbol } from "@/components/ui/icon-symbol";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

type QuickActionButtonProps = {
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
};

export function QuickActionButton({
  title,
  icon,
  color,
  onPress,
}: QuickActionButtonProps) {
  const { styles } = useStyles(stylesheet);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.circle}
        onPress={onPress}
        accessibilityLabel={title}
        accessibilityRole="button"
      >
        <IconSymbol name={icon as any} size={28} color={color} />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: "center",
  },
}));
