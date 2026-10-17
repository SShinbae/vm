import {
  AuthButton,
  AuthHeader,
  AuthInput,
  AuthLayout,
} from "@/components/auth";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/lib/contexts/AuthContext";
import { isValidEmail } from "@/utils/validation";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Text } from "react-native";
import { useStyles } from "react-native-unistyles";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false),
    mounted = useRef(true);
  const { resetPassword } = useAuth();
  const { showError } = useToast();
  const { theme } = useStyles();
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const goBack = () => {
    if (pending.current) return;
    if (router.canGoBack()) router.back();
    else router.replace("/(auth)/login");
  };
  const submit = async () => {
    if (pending.current) return;
    const submittedEmail = email.trim().toLowerCase();
    if (!isValidEmail(submittedEmail)) {
      setError("Please enter a valid email address");
      return;
    }
    setError("");
    pending.current = true;
    setLoading(true);
    try {
      const { error } = await resetPassword(submittedEmail);
      if (!mounted.current) return;
      if (error) {
        showError("Reset Failed", { message: error });
        return;
      }
      setSentEmail(submittedEmail);
    } catch {
      if (mounted.current)
        showError("Reset Failed", { message: "Please try again." });
    } finally {
      pending.current = false;
      if (mounted.current) setLoading(false);
    }
  };
  return (
    <AuthLayout>
      {sentEmail ? (
        <>
          <AuthHeader
            icon="mail-open-outline"
            title="Check your email"
            subtitle="If an account exists, reset instructions have been sent to:"
          />
          <Text
            style={{
              textAlign: "center",
              color: theme.colors.text,
              marginBottom: 24,
            }}
          >
            {sentEmail}
          </Text>
          <Text style={{ color: theme.colors.textSecondary, marginBottom: 24 }}>
            Open the link in your browser to reset your password. Then return
            here to sign in. Check your spam folder if you don’t see the email.
          </Text>
          <AuthButton
            title="Back to Sign In"
            onPress={() => router.replace("/(auth)/login")}
          />
          <AuthButton
            title="Try another email"
            variant="outline"
            onPress={() => setSentEmail(null)}
          />
        </>
      ) : (
        <>
          <AuthHeader
            icon="key"
            title="Forgot Password?"
            subtitle="We’ll email you a link to reset your password."
          />
          <AuthInput
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError("");
            }}
            leftIcon="mail-outline"
            type="email"
            autoComplete="email"
            textContentType="emailAddress"
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={submit}
            error={error}
          />
          <AuthButton
            title="Send Reset Link"
            onPress={submit}
            loading={loading}
            disabled={!email.trim()}
          />
          <AuthButton
            title="Back to log in"
            variant="outline"
            disabled={loading}
            onPress={goBack}
          />
        </>
      )}
    </AuthLayout>
  );
}
