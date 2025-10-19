import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

/**
 * Example component demonstrating React Native Unistyles usage
 * This replaces the old NativeWind (Tailwind CSS) approach
 */
export function UnistylesExample() {
  const { styles, theme } = useStyles(stylesheet);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Unistyles Example</Text>
        <Text style={styles.subtitle}>Modern styling for React Native</Text>
      </View>

      {/* Card Grid */}
      <View style={styles.cardGrid}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Primary Card</Text>
          <Text style={styles.cardText}>
            This card uses theme colors and spacing
          </Text>
        </View>

        <View style={[styles.card, styles.cardSecondary]}>
          <Text style={styles.cardTitle}>Secondary Card</Text>
          <Text style={styles.cardText}>Styled with variants</Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.buttonText}>Primary Button</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Secondary</Text>
        </TouchableOpacity>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 Theme Support</Text>
        <Text style={styles.infoText}>
          Current theme:{" "}
          {theme.colors.background === "#FFFFFF" ? "Light" : "Dark"}
        </Text>
        <Text style={styles.infoText}>
          Colors automatically adjust based on system preferences!
        </Text>
      </View>
    </ScrollView>
  );
}

// Stylesheet using Unistyles theme
const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
    alignItems: "center" as const,
  },
  title: {
    fontSize: theme.fontSize["3xl"],
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.white,
    opacity: 0.9,
  },
  cardGrid: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardSecondary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  cardText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  buttonGroup: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: "center" as const,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold as any,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: "center" as const,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold as any,
  },
  infoBox: {
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.success + "20", // 20% opacity
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
  },
  infoTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
}));
