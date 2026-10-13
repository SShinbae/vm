import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useDialog } from "@/lib/contexts/DialogContext";
import { router } from "expo-router";
import { useRef, useState } from "react";

/**
 * Shared sign-out flow: optional confirm, in-flight guard, error toast,
 * redirect. Pass `redirectTo: null` where AuthGuard handles navigation.
 */
export function useSignOut({
  redirectTo = "/(auth)/login",
}: { redirectTo?: string | null } = {}) {
  const { signOut: authSignOut } = useAuth();
  const { confirm } = useDialog();
  const { showError } = useToast();
  const [signingOut, setSigningOut] = useState(false);
  const inFlight = useRef(false);

  const signOut = async ({ confirm: ask }: { confirm?: boolean } = {}) => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      if (ask) {
        const ok = await confirm({
          title: "Sign out?",
          message: "Are you sure you want to sign out?",
          confirmText: "Sign out",
        });
        if (!ok) {
          inFlight.current = false;
          return;
        }
      }
      setSigningOut(true);
      const { error } = await authSignOut();
      if (error) {
        showError("Couldn't sign you out", {
          message: "Check your connection and try again.",
        });
        inFlight.current = false;
        setSigningOut(false);
        return;
      }
      if (redirectTo) router.replace(redirectTo as never);
    } catch (e) {
      inFlight.current = false;
      setSigningOut(false);
      throw e;
    }
  };

  return { signOut, signingOut };
}
