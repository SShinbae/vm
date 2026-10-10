import { LegalScreen } from "@/components/legal/LegalScreen";
import React from "react";

// Native fallback for terms.web.tsx: the in-app screen, opened on Terms.
export default function TermsScreen() {
  return <LegalScreen initialTab="terms" />;
}
