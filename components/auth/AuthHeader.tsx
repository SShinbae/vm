import { withOpacity, spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface AuthHeaderProps {
  icon: IoniconsName;
  title: string;
  subtitle: string;
  iconSize?: number;
  iconContainerSize?: number;
}

/**
 * AuthHeader - Icon + Title + Subtitle block for auth pages
 *
 * Provides:
 * - Circular icon container with primary background (15% opacity)
 * - Centered title (28px, bold)
 * - Centered subtitle (16px, secondary color)
 */
export function AuthHeader({
  icon,
  title,
  subtitle,
  iconSize = 40,
  iconContainerSize = 80,
}: AuthHeaderProps) {
  const { theme } = useStyles();
  const colors = theme.colors;

  const styles = StyleSheet.create({
    iconContainer: {
      width: iconContainerSize,
      height: iconContainerSize,
      borderRadius: iconContainerSize / 2,
      backgroundColor: withOpacity(colors.primary, 0.08),
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      marginBottom: spacing.xl,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: spacing.md,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: spacing.xxxl,
      lineHeight: 24,
      paddingHorizontal: spacing.sm,
    },
  });

  return (
    <>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={iconSize} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </>
  );
}
