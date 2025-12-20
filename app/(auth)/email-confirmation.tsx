import { AuthButton, AuthLayout } from "@/components/auth";
import { useAlert, withWebAlert } from "@/components/ui";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Link, router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

function EmailConfirmationScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const colorScheme = useColorScheme();
  const { showConfirm } = useAlert();
  const colors = Colors[colorScheme ?? "light"];

  if (__DEV__) {
    console.log("=== EMAIL CONFIRMATION SCREEN ===");
    console.log("Email param received:", email);
    console.log("=================================");
  }

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (!email || resendCooldown > 0) return;

    setResendLoading(true);

    // Note: Since we don't have access to the original password and full name,
    // we'll show a message to go back to registration for now
    showConfirm(
      "Resend Verification",
      "To resend the verification email, please go back to the registration form and try again.",
      () => router.replace("/(auth)/register"),
      undefined,
      "Go to Registration",
      "Cancel",
    );

    setResendLoading(false);
    setResendCooldown(60); // 60 seconds cooldown
  };

  const styles = StyleSheet.create({
    iconContainer: {
      alignItems: "center",
      marginBottom: 32,
    },
    successIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.success || "#10B981",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
      shadowColor: colors.success || "#10B981",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    checkIcon: {
      fontSize: 40,
      color: "#FFFFFF",
      fontWeight: "bold",
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 12,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      marginBottom: 8,
    },
    emailText: {
      fontSize: 16,
      color: colors.primary,
      textAlign: "center",
      fontWeight: "600",
      marginBottom: 32,
    },
    card: {
      backgroundColor: colors.card || colors.background,
      borderRadius: 12,
      padding: 24,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      marginBottom: 24,
    },
    instructionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 16,
      textAlign: "center",
    },
    instructionList: {
      marginBottom: 20,
    },
    instructionItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    instructionNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      marginTop: 2,
    },
    instructionNumberText: {
      fontSize: 12,
      color: "#FFFFFF",
      fontWeight: "bold",
    },
    instructionText: {
      fontSize: 14,
      color: colors.textSecondary,
      flex: 1,
      lineHeight: 20,
    },
    buttonContainer: {
      gap: 12,
    },
    secondaryButton: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: 14,
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
      marginTop: 20,
    },
    linkText: {
      color: colors.primary,
      textDecorationLine: "underline",
    },
  });

  return (
    <AuthLayout>
      {/* Success Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.successIcon}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We&apos;ve sent a verification link to
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
              Click the verification link in the email
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>3</Text>
            </View>
            <Text style={styles.instructionText}>
              Return to the app and sign in
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <AuthButton
            title={
              resendCooldown > 0
                ? `Resend email (${resendCooldown}s)`
                : "Resend verification email"
            }
            onPress={handleResendEmail}
            loading={resendLoading}
            disabled={resendCooldown > 0}
            style={{ marginBottom: 0 }}
          />

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Back to Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      <Text style={styles.footerText}>
        Didn&apos;t receive the email? Check your spam folder or{" "}
        <Link href="/(auth)/register" asChild>
          <Text style={styles.linkText}>try again with a different email</Text>
        </Link>
      </Text>
    </AuthLayout>
  );
}

export default withWebAlert(EmailConfirmationScreen);
