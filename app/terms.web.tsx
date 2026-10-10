import { LegalPage } from "@/components/legal/LegalPage";
import { TERMS_OF_SERVICE } from "@/lib/legal/documents";
import React from "react";

export default function TermsPage() {
  return (
    <LegalPage
      doc={TERMS_OF_SERVICE}
      description="The terms for using Vehicle Management on the web, iOS and Android."
      other={{ href: "/privacy", label: "Privacy Policy" }}
    />
  );
}
