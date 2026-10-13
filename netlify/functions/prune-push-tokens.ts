import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./_shared/supabaseAdmin";

// The app refreshes its token's updated_at on every start (pushService.syncUser
// → register_push_token). A token untouched this long belongs to an app that
// was uninstalled, reset or not opened since — prune it so sends stop going to it.
// ponytail: age-based, not Expo receipts (owner's choice); dead tokens can linger
// up to this many days. Add a receipts check if wasted sends ever matter.
export const STALE_TOKEN_DAYS = 60;
export const ACTOR_RETENTION_HOURS = 24;

export const handler: Handler = async () => {
  // Actor cleanup first, so a token delete failure cannot skip it.
  // log_change_actors only needs to outlive the webhook round trip.
  const actorCutoff = new Date(
    Date.now() - ACTOR_RETENTION_HOURS * 60 * 60 * 1000,
  ).toISOString();
  const { data: actors, error: actorError } = await supabaseAdmin
    .from("log_change_actors")
    .delete()
    .lt("created_at", actorCutoff)
    .select("id");
  if (actorError) {
    console.error("prune-push-tokens: actor cleanup failed", actorError);
  } else {
    console.log(
      `prune-push-tokens: pruned ${actors?.length ?? 0} actor row(s)`,
    );
  }

  const cutoff = new Date(
    Date.now() - STALE_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabaseAdmin
    .from("push_tokens")
    .delete()
    .lt("updated_at", cutoff)
    .select("id");

  if (error) {
    console.error("prune-push-tokens: delete failed", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  const pruned = data?.length ?? 0;
  console.log(
    `prune-push-tokens: removed ${pruned} token(s) older than ${cutoff}`,
  );
  return { statusCode: 200, body: JSON.stringify({ pruned }) };
};
