import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Link } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AuthLinkProps {
  text: string;
  linkText: string;
  href: string;
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
export function AuthLink({ text, linkText, href }: AuthLinkProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
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

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
      <Link href={href as any} asChild>
        <TouchableOpacity>
          <Text style={styles.link}>{linkText}</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
