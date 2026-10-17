import { AuthButton, AuthHeader, AuthLayout } from "@/components/auth";
import { router } from "expo-router";
import React, { useRef } from "react";

export default function ConfirmationSuccessScreen() {
  const redirected = useRef(false);
  return (
    <AuthLayout>
      <AuthHeader
        icon="checkmark-circle-outline"
        title="Account Confirmed!"
        subtitle="Your email is verified. Sign in to start managing your vehicles."
      />
      <AuthButton
        title="Continue to Sign In"
        onPress={() => {
          if (redirected.current) return;
          redirected.current = true;
          router.replace("/(auth)/login");
        }}
      />
    </AuthLayout>
  );
}
