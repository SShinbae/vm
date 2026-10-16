import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { IconSymbol } from "@/components/ui/icon-symbol";
import React from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { withOpacity } from "@/src/design-system";
import { createStyleSheet, useStyles } from "react-native-unistyles";

type QuickActionButtonProps = {
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
  description?: string;
};

export function QuickActionButton({
  title,
  icon,
  color,
  onPress,
  description,
}: QuickActionButtonProps) {
  const { styles, theme } = useStyles(stylesheet);
  const { isMobile: isMobileLayout } = useResponsiveLayout();
  const isCompact = Platform.OS !== "web" || isMobileLayout;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        description && styles.desktopContainer,
        isCompact && { paddingVertical: theme.spacing.md },
      ]}
      onPress={onPress}
      accessibilityLabel={title}
      accessibilityRole="button"
    >
      <View
        style={[
          description && styles.iconTile,
          description && { backgroundColor: withOpacity(color, 0.16) },
        ]}
      >
        <IconSymbol name={icon as any} size={22} color={color} />
      </View>
      <View style={(description || isCompact) && styles.labelGroup}>
        <Text
          style={[
            styles.title,
            (description || isCompact) && styles.desktopTitle,
          ]}
          numberOfLines={isCompact ? undefined : 1}
        >
          {title}
        </Text>
        {!!description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}
      </View>
      {!!description && (
        <IconSymbol
          name="chevron.right"
          size={15}
          color={theme.colors.textSecondary}
        />
      )}
    </TouchableOpacity>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    minHeight: 56,
    paddingHorizontal: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
  },
  desktopContainer: {
    minHeight: 86,
    justifyContent: "flex-start",
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  labelGroup: { flex: 1, gap: 2 },
  desktopTitle: { textAlign: "left" },
  description: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
  },
  title: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: "center",
  },
}));
