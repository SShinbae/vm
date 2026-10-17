import {
  AuthButton,
  AuthHeader,
  AuthInput,
  AuthLayout,
  AuthLink,
  GoogleSignInButton,
} from "@/components/auth";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/lib/contexts/AuthContext";
import { postLoginRoute } from "@/lib/utils/postLoginRoute";
import { safeNext, takeRememberedNext } from "@/lib/utils/safeNext";
import { supabase } from "@/services/supabaseClient";
import { isValidEmail } from "@/utils/validation";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { TextInput } from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const pending = useRef(false);
  const mounted = useRef(true);
  const loginAttempted = useRef(false);
  const redirected = useRef(false);
  const passwordInput = useRef<TextInput>(null);
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { signIn, user, initialized } = useAuth();
  const { showSuccess, showError } = useToast();
  const busy = loading || googleLoading;
  const destination = () => safeNext(next) ?? takeRememberedNext() ?? "/(tabs)";

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!initialized || !user || loginAttempted.current || redirected.current)
      return;
    redirected.current = true;
    void postLoginRoute(user.id, destination()).then((route) => {
      if (mounted.current) router.replace(route as never);
    });
    // The redirected ref makes destination consumption one-shot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, initialized]);

  const handleSignIn = async () => {
    if (pending.current || redirected.current) return;
    const submittedEmail = email.trim().toLowerCase();
    const submittedPassword = password;
    const validation: Record<string, string> = {};
    if (!isValidEmail(submittedEmail))
      validation.email = "Please enter a valid email address";
    if (!submittedPassword) validation.password = "Please enter your password";
    setErrors(validation);
    if (Object.keys(validation).length) return;
    pending.current = true;
    loginAttempted.current = true;
    setLoading(true);
    try {
      const { error } = await signIn(submittedEmail, submittedPassword);
      if (!mounted.current) return;
      if (error) {
        showError(error);
        loginAttempted.current = false;
        return;
      }
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!mounted.current) return;
      if (sessionError || !data.session) throw new Error("Session unavailable");
      const route = await postLoginRoute(data.session.user.id, destination());
      if (!mounted.current) return;
      redirected.current = true;
      showSuccess("Welcome back!");
      router.replace(route as never);
    } catch {
      if (mounted.current) {
        loginAttempted.current = false;
        showError("An unexpected error occurred. Please try again.");
      }
    } finally {
      pending.current = false;
      if (mounted.current) setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthHeader
        icon="lock-closed"
        title="Welcome Back"
        subtitle="Please enter your details to sign in."
      />
      <AuthInput
        label="Email Address"
        placeholder="you@example.com"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setErrors({});
        }}
        leftIcon="mail-outline"
        type="email"
        editable={!busy}
        autoComplete="username"
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => passwordInput.current?.focus()}
        error={errors.email}
      />
      <AuthInput
        ref={passwordInput}
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setErrors({});
        }}
        leftIcon="lock-closed-outline"
        type="password"
        editable={!busy}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={handleSignIn}
        error={errors.password}
      />
      <AuthLink
        text=""
        linkText="Forgot password?"
        href="/(auth)/forgot-password"
        disabled={busy}
      />
      <AuthButton
        title="Sign in"
        onPress={handleSignIn}
        loading={loading}
        disabled={googleLoading || !email.trim() || !password}
      />
      <GoogleSignInButton
        disabled={loading}
        onLoadingChange={(value) => {
          pending.current = value;
          setGoogleLoading(value);
        }}
      />
      <AuthLink
        text="Don't have an account?"
        linkText="Sign up"
        href="/(auth)/register"
        disabled={busy}
      />
    </AuthLayout>
  );
}
