import { LegalScreen } from "@/components/legal/LegalScreen";
import { useLocalSearchParams } from "expo-router";
import React from "react";

// Native in-app screen; the public web page is privacy.web.tsx.
export default function PrivacyScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  return <LegalScreen initialTab={tab === "terms" ? "terms" : "privacy"} />;
}
