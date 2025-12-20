import { AuthButton, AuthLayout } from "@/components/auth";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function ConfirmationSuccessScreen() {
  const [redirecting, setRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleGoToLogin();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoToLogin = () => {
    if (redirecting) return;
    setRedirecting(true);
    router.replace("/(auth)/login");
  };

  const styles = StyleSheet.create({
    iconContainer: {
      alignItems: "center",
      marginBottom: 32,
    },
    successIcon: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.success || "#10B981",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
      shadowColor: colors.success || "#10B981",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    checkIcon: {
      fontSize: 50,
      color: "#FFFFFF",
      fontWeight: "bold",
    },
    title: {
      fontSize: 32,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 12,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 18,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 26,
      marginBottom: 8,
    },
    card: {
      backgroundColor: colors.card || colors.background,
      borderRadius: 16,
      padding: 32,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
      marginBottom: 24,
    },
    celebrationText: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
      textAlign: "center",
      marginBottom: 16,
    },
    descriptionText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      marginBottom: 32,
    },
    countdownText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      fontStyle: "italic",
      marginTop: -16,
    },
    featuresList: {
      marginTop: 24,
      paddingTop: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    featureItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    featureIcon: {
      fontSize: 18,
      color: colors.success || "#10B981",
      marginRight: 12,
      width: 20,
    },
    featureText: {
      fontSize: 14,
      color: colors.textSecondary,
      flex: 1,
    },
  });

  return (
    <AuthLayout>
      {/* Success Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.successIcon}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>
        <Text style={styles.title}>Welcome aboard!</Text>
        <Text style={styles.subtitle}>
          Your email has been successfully verified
        </Text>
      </View>

      {/* Success Card */}
      <View style={styles.card}>
        <Text style={styles.celebrationText}>🎉 Account Confirmed!</Text>
        <Text style={styles.descriptionText}>
          Your email has been successfully verified! You can now sign in to your
          account and start managing your vehicles, tracking maintenance, and
          accessing all features.
        </Text>

        <AuthButton
          title="Continue to Sign In"
          onPress={handleGoToLogin}
          loading={redirecting}
        />

        {!redirecting && countdown > 0 && (
          <Text style={styles.countdownText}>
            Redirecting automatically in {countdown} second
            {countdown !== 1 ? "s" : ""}...
          </Text>
        )}

        {/* Features Preview */}
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🚗</Text>
            <Text style={styles.featureText}>
              Add and manage multiple vehicles
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔧</Text>
            <Text style={styles.featureText}>
              Track maintenance and service records
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>⛽</Text>
            <Text style={styles.featureText}>
              Monitor fuel consumption and costs
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={styles.featureText}>View analytics and reports</Text>
          </View>
        </View>
      </View>
    </AuthLayout>
  );
}
