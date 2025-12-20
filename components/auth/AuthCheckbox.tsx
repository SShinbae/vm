import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React, { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AuthCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label: string | ReactNode;
}

/**
 * AuthCheckbox - Checkbox with label text for auth pages
 *
 * Features:
 * - 20x20 checkbox with themed border
 * - Checkmark icon when checked
 * - Support for string or ReactNode label (for links)
 */
export function AuthCheckbox({ checked, onToggle, label }: AuthCheckboxProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 24,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: checked ? colors.primary : colors.border,
      borderRadius: 4,
      marginRight: 10,
      marginTop: 2,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: checked ? colors.primary : colors.background,
    },
    label: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
      lineHeight: 20,
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.checkbox}>
        {checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </View>
      {typeof label === "string" ? (
        <Text style={styles.label}>{label}</Text>
      ) : (
        <View style={{ flex: 1 }}>{label}</View>
      )}
    </TouchableOpacity>
  );
}
