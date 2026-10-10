import { LegalPage } from "@/components/legal/LegalPage";
import { PRIVACY_POLICY } from "@/lib/legal/documents";
import React from "react";

export default function PrivacyPage() {
  return (
    <LegalPage
      doc={PRIVACY_POLICY}
      description="How Vehicle Management collects, uses and protects your information."
      other={{ href: "/terms", label: "Terms of Service" }}
    />
  );
}
