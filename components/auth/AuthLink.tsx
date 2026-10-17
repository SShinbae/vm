import { spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import { Link } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AuthLinkProps {
  text: string;
  linkText: string;
  href: string;
  disabled?: boolean;
  onPress?: () => void;
}

/**
 * AuthLink - Navigation link section for auth pages
 *
 * Example: "Don't have an account? Sign up"
 *
 * Features:
 * - Centered row layout
 * - Secondary text + primary link styling
 */
export function AuthLink({
  text,
  linkText,
  href,
  disabled = false,
  onPress,
}: AuthLinkProps) {
  const { theme } = useStyles();
  const colors = theme.colors;

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
    },
    text: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    link: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "600",
    },
  });

  const link = (
    <TouchableOpacity
      accessibilityRole="link"
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={onPress}
      style={{ minHeight: 48, justifyContent: "center" }}
    >
      <Text style={styles.link}>{linkText}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
      {onPress ? (
        link
      ) : (
        <Link href={href as any} asChild>
          {link}
        </Link>
      )}
    </View>
  );
}
