import { spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import {
  AuthButton,
  AuthHeader,
  AuthInput,
  AuthLayout,
} from "@/components/auth";
import { useAlert, withWebAlert } from "@/components/ui";
import { useAuth } from "@/lib/contexts/AuthContext";
import { isValidEmail } from "@/utils/validation";
import { Ionicons } from "@expo/vector-icons";
import { Link, router, useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();
  const { showError } = useAlert();
  const { theme } = useStyles();
  const colors = theme.colors;
  const navigation = useRouter();

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace("/(auth)/login");
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      showError("Error", "Please enter your email address");
      return;
    }

    if (!isValidEmail(email)) {
      showError("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(email.trim().toLowerCase());
    setLoading(false);

    if (error) {
      showError("Reset Failed", error);
    } else {
      setEmailSent(true);
    }
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
      marginBottom: spacing.sm,
    },
    emailText: {
      fontSize: 16,
      color: colors.primary,
      textAlign: "center",
      fontWeight: "600",
      marginBottom: spacing.xxl,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.xl,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      marginBottom: spacing.xl,
    },
    instructionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: spacing.lg,
      textAlign: "center",
    },
    instructionList: {
      marginBottom: spacing.xl,
    },
    instructionItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: spacing.md,
    },
    instructionNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.md,
      marginTop: spacing.xs,
    },
    instructionNumberText: {
      fontSize: 12,
      color: theme.colors.white,
      fontWeight: "bold",
    },
    instructionText: {
      fontSize: 14,
      color: colors.textSecondary,
      flex: 1,
      lineHeight: 20,
    },
    buttonContainer: {
      gap: spacing.md,
    },
    secondaryButton: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: spacing.lg,
      alignItems: "center",
      minHeight: 48,
    },
    secondaryButtonText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "500",
    },
    footerText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 18,
      marginTop: spacing.xl,
    },
    linkText: {
      color: colors.primary,
      textDecorationLine: "underline",
    },
  });

  // Show success view after email is sent
  if (emailSent) {
    return (
      <AuthLayout>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={40} color={theme.colors.white} />
          </View>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We&apos;ve sent password reset instructions to
          </Text>
          <Text style={styles.emailText}>{email}</Text>
        </View>

        {/* Instructions Card */}
        <View style={styles.card}>
          <Text style={styles.instructionTitle}>What&apos;s next?</Text>
          <View style={styles.instructionList}>
            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>1</Text>
              </View>
              <Text style={styles.instructionText}>
                Check your email inbox (and spam folder)
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>2</Text>
              </View>
              <Text style={styles.instructionText}>
                Click the password reset link in the email
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>3</Text>
              </View>
              <Text style={styles.instructionText}>
                Create a new password and sign in
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Back to Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <Text style={styles.footerText}>
          Didn&apos;t receive the email? Check your spam folder or{" "}
          <Text style={styles.linkText} onPress={() => setEmailSent(false)}>
            try again
          </Text>
        </Text>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthHeader
        icon="key"
        title="Forgot Password?"
        subtitle="No worries, we'll send you reset instructions."
      />

      {/* Email Input */}
      <View style={{ marginBottom: spacing.xl }}>
        <AuthInput
          label="Email Address"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          leftIcon="mail-outline"
          type="email"
        />
      </View>

      {/* Send Reset Link Button */}
      <AuthButton
        title="Send Reset Link"
        onPress={handleResetPassword}
        loading={loading}
        disabled={!email.trim()}
      />

      {/* Back to Login */}
      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
        <Text style={styles.backButtonText}>Back to log in</Text>
      </TouchableOpacity>
    </AuthLayout>
  );
}

export default withWebAlert(ForgotPasswordScreen);
