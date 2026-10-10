import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { config } from "@/lib/config";
import { supabase } from "@/services/supabaseClient";

// Browser OAuth (PKCE). The session lands via onAuthStateChange in AuthContext,
// which already identifies the user and sets state, so callers only handle errors.
export async function signInWithGoogle(): Promise<{ error: string | null }> {
  const redirectTo =
    Platform.OS === "web"
      ? `${config.siteUrl}/login`
      : Linking.createURL("login");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    // Web: full-page redirect; detectSessionInUrl exchanges ?code on return.
    options: { redirectTo, skipBrowserRedirect: Platform.OS !== "web" },
  });
  if (error) return { error: error.message };
  if (Platform.OS === "web") return { error: null };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") return { error: null }; // user cancelled

  const { queryParams } = Linking.parse(result.url);
  if (queryParams?.error_description) {
    return { error: String(queryParams.error_description) };
  }
  if (typeof queryParams?.code !== "string") {
    return { error: "Google sign-in did not return a code" };
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
    queryParams.code,
  );
  return { error: exchangeError?.message ?? null };
}
