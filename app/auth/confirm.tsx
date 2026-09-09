import { spacing } from "@/src/design-system";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useStyles } from "react-native-unistyles";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../services/supabaseClient";

const { width: screenWidth } = Dimensions.get("window");

export default function ConfirmEmailScreen() {
  const { token_hash, type } = useLocalSearchParams<{
    token_hash: string;
    type: string;
  }>();
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const { theme } = useStyles();
  const colors = theme.colors;

  useEffect(() => {
    const confirmEmail = async () => {
      console.log("=== EMAIL CONFIRMATION DEBUG ===");
      console.log("URL params:", { token_hash, type });
      console.log("================================");

      if (!token_hash || !type) {
        console.error("Missing required params:", { token_hash, type });
        setError("Invalid confirmation link");
        setLoading(false);
        return;
      }

      try {
        console.log("Attempting to verify OTP...");
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as "signup" | "recovery" | "email_change",
        });

        console.log("Verification result:", { data, error });

        if (error) {
          console.error("Email confirmation error:", error);
          setError(error.message || "Failed to confirm email");
        } else if (data.user) {
          console.log("User confirmed successfully:", data.user.email);
          setConfirmed(true);
          // Sign out user after verification to ensure manual login
          console.log("Signing out user to force manual login...");
          await supabase.auth.signOut();
          // Redirect to confirmation success page after 2 seconds
          setTimeout(() => {
            console.log("Redirecting to confirmation success page...");
            setRedirecting(true);
            router.replace("/(auth)/confirmation-success");
          }, 2000);
        } else {
          console.error("No user data returned after verification");
          setError("Confirmation failed");
        }
      } catch (err) {
        console.error("Unexpected error during confirmation:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    confirmEmail();
  }, [token_hash, type]);

  const handleGoToLogin = () => {
    setRedirecting(true);
    router.replace("/(auth)/confirmation-success");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingVertical: spacing.xl,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.xl,
      justifyContent: "center",
      maxWidth: screenWidth > 600 ? 400 : "100%",
      alignSelf: "center",
      width: "100%",
    },
    iconContainer: {
      alignItems: "center",
      marginBottom: spacing.xxl,
    },
    loadingIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xl,
    },
    successIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.success,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xl,
      shadowColor: theme.colors.success,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    errorIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.error,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xl,
      shadowColor: theme.colors.error,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    iconText: {
      fontSize: 40,
      color: theme.colors.white,
      fontWeight: "bold",
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
      textAlign: "center",
      marginBottom: spacing.md,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      marginBottom: spacing.xxl,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.xl,
      shadowColor: theme.colors.black,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      marginBottom: spacing.xl,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: spacing.lg,
      alignItems: "center",
      minHeight: 52,
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    primaryButtonDisabled: {
      opacity: 0.6,
      shadowOpacity: 0,
      elevation: 0,
    },
    primaryButtonText: {
      color: theme.colors.white,
      fontSize: 16,
      fontWeight: "600",
    },
    redirectText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: spacing.lg,
      fontStyle: "italic",
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <View style={styles.loadingIcon}>
                <ActivityIndicator color="white" size="large" />
              </View>
              <Text style={styles.title}>Confirming Email</Text>
              <Text style={styles.subtitle}>
                Please wait while we verify your email address...
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <View style={styles.errorIcon}>
                <IconSymbol name="xmark" size={48} color={theme.colors.white} />
              </View>
              <Text style={styles.title}>Confirmation Failed</Text>
              <Text style={styles.subtitle}>{error}</Text>
            </View>

            <View style={styles.card}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleGoToLogin}
              >
                <Text style={styles.primaryButtonText}>Go to Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (confirmed) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <View style={styles.successIcon}>
                <IconSymbol
                  name="checkmark"
                  size={48}
                  color={theme.colors.white}
                />
              </View>
              <Text style={styles.title}>Email Confirmed!</Text>
              <Text style={styles.subtitle}>
                Your email has been successfully verified. Click continue to
                proceed to sign in.
              </Text>
            </View>

            <View style={styles.card}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  redirecting && styles.primaryButtonDisabled,
                ]}
                onPress={handleGoToLogin}
                disabled={redirecting}
              >
                {redirecting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Continue</Text>
                )}
              </TouchableOpacity>

              {!redirecting && (
                <Text style={styles.redirectText}>
                  Redirecting to success page in a moment...
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}
