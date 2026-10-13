import type { Handler } from "@netlify/functions";
import { createElement } from "react";
import { supabaseAdmin } from "./_shared/supabaseAdmin";
import { renderEmail, sendBrevoEmail } from "./_shared/email";
import AccountDeleted, {
  accountDeletedSubject,
} from "./_shared/emails/AccountDeleted";

export const STORAGE_BATCH = 100;
export const PURGE_BATCH = 20;

type DueAccount = {
  id: string;
  email: string | null;
  full_name: string | null;
};
type Member = { user_id: string; joined_at: string };

// Unwrap a supabase-js { data, error } result, throwing on error.
async function must<R extends { error: { message: string } | null }>(
  p: PromiseLike<R>,
  what: string,
): Promise<R extends { data: infer D } ? D : never> {
  const result = await p;
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return (
    result as unknown as { data: R extends { data: infer D } ? D : never }
  ).data;
}

async function purgeAccount(account: DueAccount): Promise<void> {
  const uid = account.id;

  // 1. Hand over groups that gained members after deletion was scheduled.
  const owned = await must(
    supabaseAdmin
      .from("groups")
      .select("id, group_members(user_id, joined_at)")
      .eq("owner_id", uid),
    "owned groups",
  );
  for (const g of (owned || []) as { id: string; group_members: Member[] }[]) {
    const next = (g.group_members || [])
      .filter((m) => m.user_id !== uid)
      .sort((a, b) => a.joined_at.localeCompare(b.joined_at))[0];
    if (next) {
      await must(
        supabaseAdmin.rpc("transfer_group_ownership_admin", {
          p_group: g.id,
          p_from: uid,
          p_to: next.user_id,
        }),
        "transfer group",
      );
    }
  }

  // 2. Own vehicles and memberships out, logs on others' vehicles anonymised (no pushes).
  await must(
    supabaseAdmin.rpc("purge_account_data", { p_user: uid }),
    "purge data",
  );

  // 3. Files, after the purge so kept receipts are excluded.
  const objects = await must(
    supabaseAdmin.rpc("account_storage_objects", { p_user: uid }),
    "list storage",
  );
  const byBucket = new Map<string, string[]>();
  for (const o of (objects || []) as { bucket_id: string; name: string }[]) {
    byBucket.set(o.bucket_id, [...(byBucket.get(o.bucket_id) || []), o.name]);
  }
  for (const [bucket, names] of byBucket) {
    for (let i = 0; i < names.length; i += STORAGE_BATCH) {
      await must(
        supabaseAdmin.storage
          .from(bucket)
          .remove(names.slice(i, i + STORAGE_BATCH)),
        `remove ${bucket}`,
      );
    }
  }

  // 4. Auth user: cascades profile, groups, invitations, tokens, notifications.
  await must(supabaseAdmin.auth.admin.deleteUser(uid), "delete user");

  // 5. Final notice (best-effort; the account is already gone).
  if (account.email) {
    try {
      const name = account.full_name || "";
      const { html, text } = await renderEmail(
        createElement(AccountDeleted, { name }),
      );
      await sendBrevoEmail({
        to: [{ email: account.email, name: name || undefined }],
        subject: accountDeletedSubject,
        htmlContent: html,
        textContent: text,
      });
    } catch (error) {
      console.error("purge: final email failed", uid, error);
    }
  }
}

export const handler: Handler = async () => {
  const { data: due, error } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name")
    .not("deletion_scheduled_at", "is", null)
    .lte("deletion_scheduled_at", new Date().toISOString())
    // The rest are processed on the next daily run, which keeps the function
    // within its scheduled-function time limit.
    .order("deletion_scheduled_at", { ascending: true })
    .limit(PURGE_BATCH);
  if (error) {
    console.error("purge: query failed", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  let purged = 0;
  let failed = 0;
  for (const account of (due || []) as DueAccount[]) {
    try {
      await purgeAccount(account);
      purged++;
    } catch (err) {
      // Left scheduled; the next run retries.
      failed++;
      console.error("purge: account failed", account.id, err);
    }
  }

  console.log(`purge-deleted-accounts: purged ${purged}, failed ${failed}`);
  return { statusCode: 200, body: JSON.stringify({ purged, failed }) };
};
