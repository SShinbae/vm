import { spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import {
  AuthButton,
  AuthHeader,
  AuthInput,
  AuthLayout,
} from "@/components/auth";
import {
  PasswordStrengthIndicator,
  useAlert,
  withWebAlert,
} from "@/components/ui";
import { useAuth } from "@/lib/contexts/AuthContext";
import { validatePassword } from "@/utils/validation";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

function ResetPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const { updatePassword, clearPasswordRecovery } = useAuth();
  const { showError } = useAlert();
  const { theme } = useStyles();
  const colors = theme.colors;
  const params = useLocalSearchParams();

  useEffect(() => {
    // Check if there's an error in the URL parameters
    if (params.error) {
      let errorMessage = "Password reset failed";

      if (params.error_description) {
        errorMessage =
          typeof params.error_description === "string"
            ? params.error_description.replace(/\+/g, " ")
            : "Password reset link is invalid or has expired";
      }

      showError("Reset Failed", errorMessage);
    }
  }, [params.error, params.error_description, showError]);

  const handleResetPassword = async () => {
    // Prevent double submission
    if (loading) {
      if (__DEV__) {
        console.log("Already loading, skipping...");
      }
      return;
    }

    if (!password.trim()) {
      showError("Error", "Please enter a new password");
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      showError(
        "Password Requirements",
        `Your password needs:\n• ${passwordValidation.errors.join("\n• ")}`,
      );
      return;
    }

    if (password !== confirmPassword) {
      showError("Error", "Passwords do not match");
      return;
    }

    setLoading(true);
    if (__DEV__) {
      console.log("Calling updatePassword...");
    }

    const { error } = await updatePassword(password);

    if (__DEV__) {
      console.log("updatePassword returned:", { error });
    }

    if (error) {
      setLoading(false);
      showError("Update Failed", error);
    } else {
      // Show success first, then clear recovery state after a delay
      // This prevents AuthGuard from redirecting before success view shows
      if (__DEV__) {
        console.log("Password update successful, showing success view");
      }
      setLoading(false);
      setPasswordUpdated(true);
    }
  };

  const isFormValid = () => {
    return (
      password.trim() &&
      confirmPassword.trim() &&
      validatePassword(password).isValid &&
      password === confirmPassword
    );
  };

  const styles = StyleSheet.create({
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
    },
    backButtonText: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: "500",
    },
    passwordMismatch: {
      fontSize: 12,
      color: colors.error || theme.colors.error,
      marginTop: spacing.sm,
      marginLeft: spacing.xs,
    },
    // Success state styles
    iconContainer: {
      alignItems: "center",
      marginBottom: spacing.xxl,
    },
    successIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.success || theme.colors.success,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xl,
      shadowColor: colors.success || theme.colors.success,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    checkIcon: {
      fontSize: 40,
      color: theme.colors.white,
      fontWeight: "bold",
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: spacing.md,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      marginBottom: spacing.xxl,
    },
  });

  // Show success view after password is updated
  if (passwordUpdated) {
    if (__DEV__) {
      console.log("Rendering success view");
    }
    return (
      <AuthLayout>
        <View style={styles.iconContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={40} color={theme.colors.white} />
          </View>
          <Text style={styles.title}>Password Updated!</Text>
          <Text style={styles.subtitle}>
            Your password has been successfully updated. You can now sign in
            with your new password.
          </Text>
        </View>

        <AuthButton
          title="Continue to App"
          onPress={() => {
            clearPasswordRecovery();
            router.replace("/(tabs)");
          }}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthHeader
        icon="lock-closed"
        title="Set New Password"
        subtitle="Enter your new password below."
      />

      {/* New Password Input */}
      <AuthInput
        label="New Password"
        placeholder="Enter new password"
        value={password}
        onChangeText={setPassword}
        leftIcon="lock-closed-outline"
        type="password"
      >
        <PasswordStrengthIndicator password={password} />
      </AuthInput>

      {/* Confirm Password Input */}
      <View>
        <AuthInput
          label="Confirm Password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          leftIcon="lock-closed-outline"
          type="password"
        />
        {confirmPassword.length > 0 && password !== confirmPassword && (
          <Text style={styles.passwordMismatch}>Passwords do not match</Text>
        )}
      </View>

      {/* Update Password Button */}
      <AuthButton
        title="Update Password"
        onPress={handleResetPassword}
        loading={loading}
        disabled={!isFormValid()}
      />

      {/* Back to Login */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.replace("/(auth)/login")}
      >
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
        <Text style={styles.backButtonText}>Back to Login</Text>
      </TouchableOpacity>
    </AuthLayout>
  );
}

export default withWebAlert(ResetPasswordScreen);
