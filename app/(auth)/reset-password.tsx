import {
  AuthButton,
  AuthHeader,
  AuthInput,
  AuthLayout,
} from "@/components/auth";
import { PasswordStrengthIndicator } from "@/components/ui";
import { toast } from "@/hooks/useToast";
import { useAuth } from "@/lib/contexts/AuthContext";
import { postLoginRoute } from "@/lib/utils/postLoginRoute";
import { parseVerifiedRedirect } from "@/lib/utils/authRedirect";
import { initialUrl, supabase } from "@/services/supabaseClient";
import { validatePassword } from "@/utils/validation";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, TextInput } from "react-native";

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const pending = useRef(false),
    mounted = useRef(true);
  const confirmInput = useRef<TextInput>(null);
  const {
    initialized,
    updatePassword,
    signOut,
    clearPasswordRecovery,
    isPasswordRecovery,
  } = useAuth();
  const params = useLocalSearchParams<{
    error?: string;
    error_description?: string;
  }>();
  const initialRedirect = parseVerifiedRedirect(
    initialUrl.search,
    initialUrl.hash,
  );
  const linkError =
    params.error ||
    params.error_description ||
    (initialRedirect?.status === "error" ? initialRedirect.message : undefined);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!initialized) return;
    let active = true;
    setChecking(true);
    void (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (active)
          setSessionUserId(
            !linkError && !error ? (data.session?.user.id ?? null) : null,
          );
      } catch {
        if (active) setSessionUserId(null);
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [initialized, linkError]);

  const submit = async () => {
    if (
      pending.current ||
      passwordUpdated ||
      !sessionUserId ||
      linkError ||
      checking ||
      !initialized
    )
      return;
    const submittedPassword = password;
    const validation: Record<string, string> = {};
    const requirements = validatePassword(submittedPassword);
    if (!requirements.isValid)
      validation.password = requirements.errors.join(", ");
    if (submittedPassword !== confirmPassword)
      validation.confirmPassword = "Passwords do not match";
    setErrors(validation);
    if (Object.keys(validation).length) return;
    pending.current = true;
    setLoading(true);
    try {
      const { error } = await updatePassword(submittedPassword);
      if (!mounted.current) return;
      if (error) {
        toast.error("Update Failed", { message: error });
        return;
      }
      setPasswordUpdated(true);
    } catch {
      if (mounted.current)
        toast.error("Update Failed", { message: "Please try again." });
    } finally {
      pending.current = false;
      if (mounted.current) setLoading(false);
    }
  };

  const leave = async (
    destination: "/(auth)/login" | "/(auth)/forgot-password",
  ) => {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    try {
      if (sessionUserId || isPasswordRecovery) {
        const { error } = await signOut();
        if (!mounted.current) return;
        if (error) {
          toast.error("Couldn't leave password recovery", { message: error });
          return;
        }
      }
      if (!mounted.current) return;
      clearPasswordRecovery();
      router.replace(destination);
    } catch {
      if (mounted.current)
        toast.error("Couldn't leave password recovery", {
          message: "Please try again.",
        });
    } finally {
      pending.current = false;
      if (mounted.current) setLoading(false);
    }
  };
  const continueToApp = async () => {
    if (pending.current || !sessionUserId) return;
    pending.current = true;
    setLoading(true);
    try {
      const destination = await postLoginRoute(sessionUserId, "/(tabs)");
      if (!mounted.current) return;
      clearPasswordRecovery();
      router.replace(destination as never);
    } catch {
      if (mounted.current)
        toast.error("Couldn't open the app. Please try again.");
    } finally {
      pending.current = false;
      if (mounted.current) setLoading(false);
    }
  };

  if (!initialized || checking)
    return (
      <AuthLayout>
        <AuthHeader
          icon="lock-closed"
          title="Checking reset link"
          subtitle="Please wait while we check your session."
        />
        <ActivityIndicator accessibilityLabel="Checking reset link" />
      </AuthLayout>
    );
  if (linkError || !sessionUserId)
    return (
      <AuthLayout>
        <AuthHeader
          icon="alert-circle-outline"
          title="Reset link unavailable"
          subtitle="This link is invalid or has expired. Request a new email to reset your password."
        />
        <AuthButton
          title="Request new reset link"
          loading={loading}
          onPress={() => {
            void leave("/(auth)/forgot-password");
          }}
        />
        <AuthButton
          title="Back to Login"
          variant="outline"
          disabled={loading}
          onPress={() => {
            void leave("/(auth)/login");
          }}
        />
      </AuthLayout>
    );
  if (passwordUpdated)
    return (
      <AuthLayout>
        <AuthHeader
          icon="checkmark-circle-outline"
          title="Password Updated!"
          subtitle="Your new password is saved. Continue to your account."
        />
        <AuthButton
          title="Continue to App"
          onPress={continueToApp}
          loading={loading}
        />
      </AuthLayout>
    );
  return (
    <AuthLayout>
      <AuthHeader
        icon="lock-closed"
        title="Set New Password"
        subtitle="Enter your new password below."
      />
      <AuthInput
        label="New Password"
        placeholder="Enter new password"
        value={password}
        onChangeText={setPassword}
        leftIcon="lock-closed-outline"
        type="password"
        editable={!loading}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmInput.current?.focus()}
        error={errors.password}
      >
        <PasswordStrengthIndicator password={password} />
      </AuthInput>
      <AuthInput
        ref={confirmInput}
        label="Confirm Password"
        placeholder="Confirm new password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        leftIcon="lock-closed-outline"
        type="password"
        editable={!loading}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={submit}
        error={
          confirmPassword && confirmPassword !== password
            ? "Passwords do not match"
            : errors.confirmPassword
        }
      />
      <AuthButton
        title="Update Password"
        onPress={submit}
        loading={loading}
        disabled={
          !validatePassword(password).isValid || password !== confirmPassword
        }
      />
      <AuthButton
        title="Back to Login"
        variant="outline"
        disabled={loading}
        onPress={() => {
          void leave("/(auth)/login");
        }}
      />
    </AuthLayout>
  );
}
