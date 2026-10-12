import { functionUrl } from "@/lib/config";
import { supabase } from "@/services/supabaseClient";

export type ScheduleResult =
  | { kind: "scheduled"; scheduledFor: string }
  | { kind: "reauth" }
  | { kind: "blocked"; groups: { id: string; name: string }[] }
  | { kind: "error"; message: string };

export type CancelResult =
  | { kind: "cancelled" }
  | { kind: "not_pending" }
  | { kind: "in_progress" }
  | { kind: "error"; message: string };

type Body = {
  scheduledFor?: string;
  cancelled?: boolean;
  code?: string;
  groups?: { id: string; name: string }[];
  error?: string;
};

async function call(
  method: "POST" | "DELETE",
): Promise<{ status: number; body: Body } | string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return "You're signed out. Sign in and try again.";
  try {
    const res = await fetch(functionUrl("account-deletion"), {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body:
        method === "POST" ? JSON.stringify({ confirm: "DELETE" }) : undefined,
    });
    const body: Body = await res.json().catch(() => ({}));
    return { status: res.status, body };
  } catch {
    return "Couldn't reach the server. Check your connection and try again.";
  }
}

export const AccountDeletionService = {
  async schedule(): Promise<ScheduleResult> {
    const r = await call("POST");
    if (typeof r === "string") return { kind: "error", message: r };
    if (r.status === 200)
      return { kind: "scheduled", scheduledFor: r.body.scheduledFor ?? "" };
    if (r.status === 403 && r.body.code === "REAUTH_REQUIRED")
      return { kind: "reauth" };
    if (r.status === 409 && r.body.code === "OWNS_GROUPS_WITH_MEMBERS") {
      return { kind: "blocked", groups: r.body.groups ?? [] };
    }
    return {
      kind: "error",
      message: r.body.error || "Something went wrong. Please try again.",
    };
  },

  async cancel(): Promise<CancelResult> {
    const r = await call("DELETE");
    if (typeof r === "string") return { kind: "error", message: r };
    if (r.status === 200)
      return r.body.cancelled ? { kind: "cancelled" } : { kind: "not_pending" };
    if (r.status === 409 && r.body.code === "DELETION_IN_PROGRESS")
      return { kind: "in_progress" };
    return {
      kind: "error",
      message: r.body.error || "Something went wrong. Please try again.",
    };
  },
};
