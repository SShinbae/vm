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
    <TouchableOpacity
      style={styles.quickAction}
      onPress={onPress}
      accessibilityLabel={title}
      accessibilityRole="button"
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color + "15" }]}>
        <IconSymbol name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.quickActionTitle} numberOfLines={2}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  quickAction: {
    width: "47%",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: "center",
  },
}));