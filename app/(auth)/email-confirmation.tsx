import { AuthButton, AuthHeader, AuthLayout } from "@/components/auth";
import { useToast } from "@/hooks/useToast";
import { config } from "@/lib/config";
import { supabase } from "@/services/supabaseClient";
import { isValidEmail } from "@/utils/validation";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Text } from "react-native";
import { useStyles } from "react-native-unistyles";

export default function EmailConfirmationScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";
  const [loading, setLoading] = useState(false);
  const [resendUntil, setResendUntil] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const pending = useRef(false),
    mounted = useRef(true);
  const currentEmail = useRef(normalizedEmail);
  currentEmail.current = normalizedEmail;
  const { showError, showSuccess } = useToast();
  const { theme } = useStyles();
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!resendUntil) return;
    const update = () =>
      setCooldown(Math.max(0, Math.ceil((resendUntil - Date.now()) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [resendUntil]);
  const resend = async () => {
    if (
      pending.current ||
      Date.now() < resendUntil ||
      !isValidEmail(normalizedEmail)
    )
      return;
    const submittedEmail = normalizedEmail;
    pending.current = true;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: submittedEmail,
        options: { emailRedirectTo: `${config.siteUrl}/auth/confirm` },
      });
      if (!mounted.current || currentEmail.current !== submittedEmail) return;
      if (error) {
        showError("Couldn't resend verification email", {
          message: error.message,
        });
        return;
      }
      setCooldown(60);
      setResendUntil(Date.now() + 60000);
      showSuccess("Verification email sent. Check your inbox.");
    } catch {
      if (mounted.current)
        showError("Couldn't resend verification email", {
          message: "Please try again.",
        });
    } finally {
      pending.current = false;
      if (mounted.current) setLoading(false);
    }
  };
  return (
    <AuthLayout>
      <AuthHeader
        icon="mail-open-outline"
        title="Check your email"
        subtitle={
          normalizedEmail
            ? "We’ve sent a verification link to:"
            : "Enter your email when you register to receive a verification link."
        }
      />
      {!!normalizedEmail && (
        <Text
          style={{
            textAlign: "center",
            color: theme.colors.text,
            marginBottom: 24,
          }}
        >
          {normalizedEmail}
        </Text>
      )}
      <Text style={{ color: theme.colors.textSecondary, marginBottom: 24 }}>
        Open the link in your browser to verify your email, then return here to
        sign in. Check your spam folder if needed.
      </Text>
      <AuthButton
        title={
          cooldown > 0
            ? `Resend email (${cooldown}s)`
            : "Resend verification email"
        }
        onPress={resend}
        loading={loading}
        disabled={cooldown > 0 || !isValidEmail(normalizedEmail)}
      />
      <AuthButton
        title="Back to Sign In"
        variant="outline"
        disabled={loading}
        onPress={() => router.replace("/(auth)/login")}
      />
      <AuthButton
        title="Use a different email"
        variant="outline"
        disabled={loading}
        onPress={() => router.replace("/(auth)/register")}
      />
    </AuthLayout>
  );
}
