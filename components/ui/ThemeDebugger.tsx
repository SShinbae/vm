import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/lib/contexts/ThemeContext";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function ThemeDebugger() {
  const { themeMode, colorScheme, setThemeMode } = useTheme();
  const hookColorScheme = useColorScheme();
  const colors = Colors[hookColorScheme ?? "light"];

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
          style={[styles.button, { backgroundColor: colors.buttonPrimary }]}
          onPress={() => setThemeMode("light")}
        >
          <Text style={[styles.buttonText, { color: "white" }]}>Light</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.buttonPrimary }]}
          onPress={() => setThemeMode("dark")}
        >
          <Text style={[styles.buttonText, { color: "white" }]}>Dark</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.buttonPrimary }]}
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
    padding: 20,
    margin: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  info: {
    fontSize: 14,
    marginBottom: 5,
  },
  buttons: {
    flexDirection: "row",
    marginTop: 15,
    gap: 10,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    minWidth: 60,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
