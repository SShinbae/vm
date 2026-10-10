import { spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import React, { useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useToast } from "@/hooks/useToast";
import { signInWithGoogle } from "@/lib/services/googleAuthService";
import { AuthButton } from "./AuthButton";

/**
 * "or" divider + Continue with Google. Sign-in and sign-up are the same call:
 * Supabase creates the account on first use. Navigation happens via the
 * existing auth-state redirects once the session lands.
 */
export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const { showError } = useToast();
  const { theme } = useStyles();
  const colors = theme.colors;

  // ponytail: hidden on iOS until Sign in with Apple ships (App Store guideline 4.8)
  if (Platform.OS === "ios") return null;

  const handlePress = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) showError(error);
    } catch {
      showError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    divider: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.xl,
    },
    line: { flex: 1, height: 1, backgroundColor: colors.border },
    orText: {
      marginHorizontal: spacing.md,
      color: colors.textSecondary,
      fontSize: 14,
    },
  });

  return (
    <>
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.orText}>or</Text>
        <View style={styles.line} />
      </View>
      <AuthButton
        title="Continue with Google"
        onPress={handlePress}
        loading={loading}
        variant="outline"
      />
    </>
  );
}
