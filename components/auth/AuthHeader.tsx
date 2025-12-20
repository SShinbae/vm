import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    iconContainer: {
      width: iconContainerSize,
      height: iconContainerSize,
      borderRadius: iconContainerSize / 2,
      backgroundColor: colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 12,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 40,
      lineHeight: 24,
      paddingHorizontal: 8,
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
