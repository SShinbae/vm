import { Redirect } from "expo-router";
import React from "react";

// Native: the in-app flow. The public guide is delete-account.web.tsx.
export default function DeleteAccountRedirect() {
  return <Redirect href="/account/delete" />;
}
