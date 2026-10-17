import {
  AuthButton,
  AuthCheckbox,
  AuthHeader,
  AuthInput,
  AuthLayout,
  AuthLink,
  GoogleSignInButton,
} from "@/components/auth";
import { PasswordStrengthIndicator } from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/lib/contexts/AuthContext";
import { postLoginRoute } from "@/lib/utils/postLoginRoute";
import { safeNext, takeRememberedNext } from "@/lib/utils/safeNext";
import { isValidEmail, validatePassword } from "@/utils/validation";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Text, TextInput } from "react-native";
import { useStyles } from "react-native-unistyles";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const pending = useRef(false),
    mounted = useRef(true),
    completed = useRef(false);
  const googleAttempted = useRef(false);
  const emailInput = useRef<TextInput>(null),
    passwordInput = useRef<TextInput>(null),
    confirmInput = useRef<TextInput>(null);
  const { signUp, user, initialized } = useAuth();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { showError, showSuccess } = useToast();
  const { theme } = useStyles();
  const busy = loading || googleLoading;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!initialized || !user || !googleAttempted.current || completed.current)
      return;
    completed.current = true;
    void postLoginRoute(
      user.id,
      safeNext(next) ?? takeRememberedNext() ?? "/(tabs)",
    ).then((route) => {
      if (mounted.current) router.replace(route as never);
    });
  }, [user, initialized, next]);

  const handleSignUp = async () => {
    if (pending.current || completed.current) return;
    const submittedEmail = email.trim().toLowerCase(),
      submittedName = fullName.trim(),
      submittedPassword = password;
    const validation: Record<string, string> = {};
    if (!submittedName) validation.fullName = "Please enter your full name";
    if (!isValidEmail(submittedEmail))
      validation.email = "Please enter a valid email address";
    const requirements = validatePassword(submittedPassword);
    if (!requirements.isValid)
      validation.password = requirements.errors.join(", ");
    if (submittedPassword !== confirmPassword)
      validation.confirmPassword = "Passwords do not match";
    if (!agreeToTerms)
      validation.terms = "Please agree to the Terms of Service";
    setErrors(validation);
    if (Object.keys(validation).length) return;
    pending.current = true;
    setLoading(true);
    try {
      const { error } = await signUp(
        submittedEmail,
        submittedPassword,
        submittedName,
      );
      if (!mounted.current) return;
      if (error) {
        showError("Registration Failed", { message: error });
        return;
      }
      completed.current = true;
      showSuccess("Account created!");
      router.replace({
        pathname: "/(auth)/email-confirmation",
        params: { email: submittedEmail },
      });
    } catch {
      if (mounted.current)
        showError("Registration Failed", { message: "Please try again." });
    } finally {
      pending.current = false;
      if (mounted.current) setLoading(false);
    }
  };
  const valid = !!(
    fullName.trim() &&
    isValidEmail(email) &&
    validatePassword(password).isValid &&
    password === confirmPassword &&
    agreeToTerms
  );
  return (
    <AuthLayout>
      <AuthHeader
        icon="person-add"
        title="Create Account"
        subtitle="Start managing your vehicles."
      />
      <AuthInput
        label="Full Name"
        placeholder="John Doe"
        value={fullName}
        onChangeText={setFullName}
        leftIcon="person-outline"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        editable={!busy}
        returnKeyType="next"
        onSubmitEditing={() => emailInput.current?.focus()}
        error={errors.fullName}
      />
      <AuthInput
        ref={emailInput}
        label="Email Address"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        leftIcon="mail-outline"
        type="email"
        autoComplete="email"
        textContentType="emailAddress"
        editable={!busy}
        returnKeyType="next"
        onSubmitEditing={() => passwordInput.current?.focus()}
        error={errors.email}
      />
      <AuthInput
        ref={passwordInput}
        label="Password"
        placeholder="Create a password"
        value={password}
        onChangeText={setPassword}
        leftIcon="lock-closed-outline"
        type="password"
        autoComplete="new-password"
        textContentType="newPassword"
        editable={!busy}
        returnKeyType="next"
        onSubmitEditing={() => confirmInput.current?.focus()}
        error={errors.password}
      >
        <PasswordStrengthIndicator password={password} />
      </AuthInput>
      <AuthInput
        ref={confirmInput}
        label="Confirm Password"
        placeholder="Re-enter your password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        leftIcon="lock-closed-outline"
        type="password"
        autoComplete="new-password"
        textContentType="newPassword"
        editable={!busy}
        returnKeyType="done"
        onSubmitEditing={handleSignUp}
        error={
          confirmPassword && password !== confirmPassword
            ? "Passwords do not match"
            : errors.confirmPassword
        }
      />
      <AuthCheckbox
        checked={agreeToTerms}
        onToggle={() => setAgreeToTerms(!agreeToTerms)}
        disabled={busy}
        accessibilityLabel="Agree to Terms of Service and Privacy Policy"
        label={
          <Text style={{ color: theme.colors.text, flexShrink: 1 }}>
            I agree to the{" "}
            <Text
              accessibilityRole="link"
              style={{ color: theme.colors.primary }}
              onPress={() => {
                if (!pending.current) router.push("/terms");
              }}
            >
              Terms of Service
            </Text>{" "}
            and{" "}
            <Text
              accessibilityRole="link"
              style={{ color: theme.colors.primary }}
              onPress={() => {
                if (!pending.current) router.push("/privacy");
              }}
            >
              Privacy Policy
            </Text>
          </Text>
        }
      />
      {errors.terms && (
        <Text accessibilityRole="alert" style={{ color: theme.colors.error }}>
          {errors.terms}
        </Text>
      )}
      <AuthButton
        title="Create Account"
        onPress={handleSignUp}
        loading={loading}
        disabled={googleLoading || !valid}
      />
      <GoogleSignInButton
        disabled={loading}
        onLoadingChange={(value) => {
          if (value) googleAttempted.current = true;
          pending.current = value;
          setGoogleLoading(value);
        }}
      />
      <AuthLink
        text="Already have an account?"
        linkText="Log in"
        href="/(auth)/login"
        disabled={busy}
        onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace("/(auth)/login");
        }}
      />
    </AuthLayout>
  );
}
