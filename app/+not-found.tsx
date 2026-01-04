import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotFoundScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    iconContainer: {
      marginBottom: 24,
      opacity: 0.6,
    },
    title: {
      fontSize: 72,
      fontWeight: "700",
      color: colors.primary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 24,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 12,
      textAlign: "center",
    },
    message: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 32,
      maxWidth: 400,
      lineHeight: 24,
    },
    link: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 14,
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
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
    pathContainer: {
      marginTop: 24,
      paddingHorizontal: 16,
      paddingVertical: 8,
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
