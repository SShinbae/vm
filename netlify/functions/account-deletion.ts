import type { Handler, HandlerEvent } from "@netlify/functions";
import { createElement, type ReactElement } from "react";
import { supabaseAdmin } from "./_shared/supabaseAdmin";
import { renderEmail, sendBrevoEmail, SITE_URL } from "./_shared/email";
import DeletionScheduled, {
  deletionScheduledSubject,
  formatDeletionDate,
} from "./_shared/emails/DeletionScheduled";
import DeletionCancelled, {
  deletionCancelledSubject,
} from "./_shared/emails/DeletionCancelled";

export const GRACE_DAYS = 30;
export const REAUTH_HOURS = 24;

// Web app calls from SITE_URL in production and localhost in development.
function corsHeaders(origin: string | undefined): Record<string, string> {
  const allowed =
    !!origin &&
    (origin === SITE_URL || /^http:\/\/localhost:\d+$/.test(origin));
  return allowed
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
        Vary: "Origin",
      }
    : {};
}

function json(statusCode: number, body: unknown, cors: Record<string, string>) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...cors },
    body: JSON.stringify(body),
  };
}

async function sendEmail(
  to: string,
  name: string,
  subject: string,
  element: ReactElement,
) {
  // Best-effort: the deletion date is the source of truth, not the email.
  try {
    const { html, text } = await renderEmail(element);
    const ok = await sendBrevoEmail({
      to: [{ email: to, name: name || undefined }],
      subject,
      htmlContent: html,
      textContent: text,
    });
    if (!ok) console.error("account-deletion: email not sent", subject);
  } catch (error) {
    console.error("account-deletion: email failed", error);
  }
}

export const handler: Handler = async (event: HandlerEvent) => {
  const cors = corsHeaders(event.headers.origin);
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }
  if (event.httpMethod !== "POST" && event.httpMethod !== "DELETE") {
    return json(405, { error: "Method not allowed" }, cors);
  }

  const auth = event.headers.authorization || event.headers.Authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return json(401, { error: "Not signed in" }, cors);

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  const user = data?.user;
  if (error || !user) return json(401, { error: "Not signed in" }, cors);

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("full_name, deletion_scheduled_at")
    .eq("id", user.id)
    .single();
  // A failed read must not look like "nothing pending".
  if (profileError) return json(500, { error: profileError.message }, cors);
  const name = profile?.full_name || "";
  const pending: string | null = profile?.deletion_scheduled_at ?? null;

  if (event.httpMethod === "DELETE") {
    if (!pending) return json(200, { cancelled: false }, cors);
    // Once the date has passed the purge may already be running; only a
    // still-future date can be cleared (purge_account_data re-checks too).
    const nowIso = new Date().toISOString();
    if (Date.parse(pending) <= Date.now()) {
      return json(409, { code: "DELETION_IN_PROGRESS" }, cors);
    }
    const { data: cleared, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ deletion_scheduled_at: null })
      .eq("id", user.id)
      .gt("deletion_scheduled_at", nowIso)
      .select("id");
    if (updateError) return json(500, { error: updateError.message }, cors);
    if (!cleared?.length) {
      return json(409, { code: "DELETION_IN_PROGRESS" }, cors);
    }
    if (user.email) {
      await sendEmail(
        user.email,
        name,
        deletionCancelledSubject,
        createElement(DeletionCancelled, { name }),
      );
    }
    return json(200, { cancelled: true }, cors);
  }

  // POST: schedule
  let body: { confirm?: string } = {};
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    body = {};
  }
  if (body.confirm !== "DELETE") {
    return json(400, { error: "Type DELETE to confirm" }, cors);
  }

  const lastSignIn = user.last_sign_in_at
    ? Date.parse(user.last_sign_in_at)
    : 0;
  if (Date.now() - lastSignIn > REAUTH_HOURS * 3600000) {
    return json(403, { code: "REAUTH_REQUIRED" }, cors);
  }

  if (pending) return json(200, { scheduledFor: pending }, cors);

  const { data: owned, error: groupsError } = await supabaseAdmin
    .from("groups")
    .select("id, name, group_members(user_id)")
    .eq("owner_id", user.id);
  if (groupsError) return json(500, { error: groupsError.message }, cors);
  const blocking = (owned || [])
    .filter((g: any) =>
      (g.group_members || []).some(
        (m: { user_id: string }) => m.user_id !== user.id,
      ),
    )
    .map((g: any) => ({ id: g.id, name: g.name }));
  if (blocking.length > 0) {
    return json(
      409,
      { code: "OWNS_GROUPS_WITH_MEMBERS", groups: blocking },
      cors,
    );
  }

  const scheduledFor = new Date(
    Date.now() + GRACE_DAYS * 86400000,
  ).toISOString();
  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ deletion_scheduled_at: scheduledFor })
    .eq("id", user.id);
  if (updateError) return json(500, { error: updateError.message }, cors);

  await supabaseAdmin.from("push_tokens").delete().eq("user_id", user.id);
  // "others", not "global": global also kills the requesting session, so the
  // app's own local signOut then gets 400 AuthSessionMissingError and keeps
  // the stored session. The app clears this device itself.
  const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(
    token,
    "others",
  );
  if (signOutError)
    console.error(
      "account-deletion: sign-out of other sessions failed",
      signOutError,
    );

  if (user.email) {
    await sendEmail(
      user.email,
      name,
      deletionScheduledSubject,
      createElement(DeletionScheduled, {
        name,
        deletionDate: formatDeletionDate(scheduledFor),
        signInUrl: `${SITE_URL}/login`,
      }),
    );
  }

  return json(200, { scheduledFor }, cors);
};
