import { spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import React, { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useToast } from "@/hooks/useToast";
import { signInWithGoogle } from "@/lib/services/googleAuthService";
import { rememberNext, safeNext } from "@/lib/utils/safeNext";
import { useLocalSearchParams } from "expo-router";
import { AuthButton } from "./AuthButton";

/**
 * "or" divider + Continue with Google. Sign-in and sign-up are the same call:
 * Supabase creates the account on first use. Navigation happens via the
 * existing auth-state redirects once the session lands.
 */
export function GoogleSignInButton({
  disabled = false,
  onLoadingChange,
}: {
  disabled?: boolean;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const pending = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const { showError } = useToast();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { theme } = useStyles();
  const colors = theme.colors;

  // ponytail: hidden on iOS until Sign in with Apple ships (App Store guideline 4.8)
  if (Platform.OS === "ios") return null;

  const handlePress = async () => {
    if (pending.current || disabled) return;
    pending.current = true;
    onLoadingChange?.(true);
    setLoading(true);
    try {
      rememberNext(safeNext(next));
      const { error } = await signInWithGoogle();
      if (error && mounted.current) showError(error);
    } catch {
      if (mounted.current)
        showError("Google sign-in failed. Please try again.");
    } finally {
      pending.current = false;
      if (mounted.current) {
        setLoading(false);
        onLoadingChange?.(false);
      }
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
        disabled={disabled}
        variant="outline"
      />
    </>
  );
}
