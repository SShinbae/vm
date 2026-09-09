import { spacing } from "@/src/design-system";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/lib/contexts/ThemeContext";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useStyles } from "react-native-unistyles";

export function ThemeDebugger() {
  const { themeMode, colorScheme, setThemeMode } = useTheme();
  const hookColorScheme = useColorScheme();
  const { theme } = useStyles();
  const colors = theme.colors;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Theme Debug Info
      </Text>

      <Text style={[styles.info, { color: colors.text }]}>
        Theme Mode: {themeMode}
      </Text>
      <Text style={[styles.info, { color: colors.text }]}>
        Color Scheme (Context): {colorScheme}
      </Text>
      <Text style={[styles.info, { color: colors.text }]}>
        Color Scheme (Hook): {hookColorScheme}
      </Text>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => setThemeMode("light")}
        >
          <Text style={[styles.buttonText, { color: colors.white }]}>
            Light
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => setThemeMode("dark")}
        >
          <Text style={[styles.buttonText, { color: "white" }]}>Dark</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => setThemeMode("system")}
        >
          <Text style={[styles.buttonText, { color: "white" }]}>System</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    margin: spacing.xl,
    borderRadius: 10,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: spacing.md,
  },
  info: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  buttons: {
    flexDirection: "row",
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  button: {
    padding: spacing.md,
    borderRadius: 5,
    minWidth: 60,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
