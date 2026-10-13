import { useAuth } from "@/lib/contexts/AuthContext";
import { Redirect } from "expo-router";
import React from "react";

// Native: the in-app flow. The public guide is delete-account.web.tsx.
// Signed-out users go to login and come back to the delete screen.
export default function DeleteAccountRedirect() {
  const { user, initialized, loading } = useAuth();
  // initialized flips before the session is restored; wait for loading too.
  if (!initialized || loading) return null;
  return (
    <Redirect
      href={user ? "/account/delete" : "/(auth)/login?next=/account/delete"}
    />
  );
}
