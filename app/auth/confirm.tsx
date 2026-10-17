import { AuthButton, AuthHeader, AuthLayout } from "@/components/auth";
import { parseVerifiedRedirect } from "@/lib/utils/authRedirect";
import { initialUrl, supabase } from "@/services/supabaseClient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator } from "react-native";

type Result =
  | { route: "/(auth)/reset-password" | "/(auth)/confirmation-success" }
  | { error: string };
export default function ConfirmEmailScreen() {
  const { token_hash, type } = useLocalSearchParams<{
    token_hash?: string;
    type?: string;
  }>();
  const [error, setError] = useState<string | null>(null);
  const attempt = useRef<{ key: string; promise: Promise<Result> } | null>(
    null,
  );
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    const key = JSON.stringify([
      token_hash,
      type,
      initialUrl.search,
      initialUrl.hash,
    ]);
    if (attempt.current?.key !== key) {
      setError(null);
      const verify = async (): Promise<Result> => {
        try {
          const url = new URLSearchParams(initialUrl.search);
          new URLSearchParams(initialUrl.hash.replace(/^#/, "")).forEach(
            (value, name) => url.set(name, value),
          );
          const action = type ?? url.get("type");
          let recovery = action === "recovery";
          if (token_hash !== undefined) {
            if (
              typeof token_hash !== "string" ||
              !token_hash ||
              (action !== "signup" &&
                action !== "recovery" &&
                action !== "email_change")
            )
              return { error: "Invalid confirmation link" };
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash,
              type: action,
            });
            if (error)
              return { error: error.message || "Failed to confirm email" };
            if (!data.user) return { error: "Confirmation failed" };
          } else {
            const redirect = parseVerifiedRedirect(
              initialUrl.search,
              initialUrl.hash,
            );
            if (redirect?.status === "error")
              return { error: redirect.message };
            if (!redirect) return { error: "Invalid confirmation link" };
            const { data, error } = await supabase.auth.getSession();
            if (error || !data.session)
              return {
                error:
                  error?.message ||
                  "This link is invalid or has expired. Please request a new email.",
              };
            recovery = action === "recovery";
          }
          if (!mounted.current || attempt.current?.key !== key)
            return { error: "Verification interrupted" };
          if (recovery) return { route: "/(auth)/reset-password" };
          const { error } = await supabase.auth.signOut();
          if (error)
            return {
              error: "Couldn't finish verification. Please try signing in.",
            };
          return { route: "/(auth)/confirmation-success" };
        } catch {
          return {
            error: "Couldn't verify this link. Please request a new email.",
          };
        }
      };
      attempt.current = { key, promise: verify() };
    }
    void attempt.current.promise.then((result) => {
      if (!active) return;
      if ("error" in result) setError(result.error);
      else router.replace(result.route);
    });
    return () => {
      active = false;
    };
  }, [token_hash, type]);
  return (
    <AuthLayout>
      <AuthHeader
        icon={error ? "alert-circle-outline" : "mail-outline"}
        title={error ? "Confirmation Failed" : "Confirming Email"}
        subtitle={error ?? "Please wait while we verify your email address."}
      />
      {error ? (
        <>
          {type === "recovery" && (
            <AuthButton
              title="Request new reset link"
              onPress={() => router.replace("/(auth)/forgot-password")}
            />
          )}
          <AuthButton
            title="Go to Sign In"
            onPress={() => router.replace("/(auth)/login")}
          />
        </>
      ) : (
        <ActivityIndicator accessibilityLabel="Verifying email" />
      )}
    </AuthLayout>
  );
}
