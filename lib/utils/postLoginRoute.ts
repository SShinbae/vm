import { supabase } from "@/services/supabaseClient";

export const POST_LOGIN_TIMEOUT_MS = 5000;

/**
 * Where to land right after sign-in. A pending-deletion user goes straight to
 * the pending screen so the dashboard never flashes while the AuthContext
 * profile is still loading. Any error or timeout falls back to the normal
 * destination, so a hung query can never keep the user on /login.
 */
export async function postLoginRoute(
  userId: string,
  fallback: string,
): Promise<string> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<string>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve(fallback);
    }, POST_LOGIN_TIMEOUT_MS);
  });
  const lookup = (async () => {
    const { data, error } = (await supabase
      .from("profiles")
      .select("deletion_scheduled_at")
      .eq("id", userId)
      .abortSignal(controller.signal)
      .maybeSingle()) as {
      data: { deletion_scheduled_at: string | null } | null;
      error: unknown;
    };
    if (error || !data?.deletion_scheduled_at) return fallback;
    return "/account-pending-deletion";
  })().catch(() => fallback);
  try {
    return await Promise.race([lookup, timedOut]);
  } finally {
    clearTimeout(timer);
  }
}
