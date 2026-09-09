import { spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import { Ionicons } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotFoundScreen() {
  const { theme } = useStyles();
  const colors = theme.colors;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.xl,
    },
    iconContainer: {
      marginBottom: spacing.xl,
      opacity: 0.6,
    },
    title: {
      fontSize: 72,
      fontWeight: "700",
      color: colors.primary,
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontSize: 24,
      fontWeight: "600",
      color: colors.text,
      marginBottom: spacing.md,
      textAlign: "center",
    },
    message: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: spacing.xxl,
      maxWidth: 400,
      lineHeight: 24,
    },
    link: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      borderRadius: 8,
      ...Platform.select({
        web: {
          cursor: "pointer",
          transition: "opacity 0.2s ease",
        },
        default: {},
      }),
    },
    linkText: {
      color: theme.colors.white,
      fontSize: 16,
      fontWeight: "600",
    },
    pathContainer: {
      marginTop: spacing.xl,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pathText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: Platform.OS === "web" ? "monospace" : undefined,
    },
  });

  return (
    <>
      <Stack.Screen options={{ title: "Page Not Found", headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="document-text-outline"
              size={80}
              color={colors.textSecondary}
            />
          </View>
          <Text style={styles.title}>404</Text>
          <Text style={styles.subtitle}>Page Not Found</Text>
          <Text style={styles.message}>
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </Text>
          <Link href="/" style={styles.link}>
            <Text style={styles.linkText}>Go to Home</Text>
          </Link>
        </View>
      </SafeAreaView>
    </>
  );
}
