import type { Handler, HandlerEvent } from "@netlify/functions";
import { createHash } from "node:crypto";
import { supabaseAdmin as supabase } from "./_shared/supabaseAdmin";
import {
  deliverNotification,
  type NotificationType,
} from "./_shared/notifications";
import {
  sendBrevoEmail,
  getInvitationEmailHtml,
  SENDER_EMAIL,
  SENDER_NAME,
} from "./_shared/email";

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: Record<string, any>;
  old_record?: Record<string, any>;
  schema: string;
}

const siteUrl = process.env.SITE_URL || "https://vm.wanahnaf.dev";

function eventKey(payload: WebhookPayload): string {
  const record = payload.record || payload.old_record || {};
  const version = createHash("sha256")
    .update(JSON.stringify(record))
    .digest("hex");
  return `event:${payload.table}:${payload.type}:${record.id}:${version}`;
}

async function handleGroupInvitation(
  payload: WebhookPayload,
): Promise<boolean> {
  const record = payload.record;
  const inviteEmail = String(record.email).toLowerCase();

  const [{ data: invitedUser }, { data: group }, { data: inviter }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id")
        .eq("email", inviteEmail)
        .maybeSingle(),
      supabase.from("groups").select("name").eq("id", record.group_id).single(),
      supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", record.invited_by)
        .single(),
    ]);

  const inviterName = inviter?.full_name || inviter?.email || "Someone";
  const groupName = group?.name || "a group";

  // Always email the invitee — this is the only delivery path for people who
  // don't have an account yet; they sign up and the invite is waiting for them.
  const emailSent = await sendBrevoEmail({
    sender: { email: SENDER_EMAIL, name: SENDER_NAME },
    to: [{ email: inviteEmail }],
    subject: `${inviterName} invited you to join ${groupName}`,
    htmlContent: getInvitationEmailHtml(inviterName, groupName, siteUrl),
  });

  // Existing users additionally get push + in-app notification.
  if (!invitedUser) return emailSent;

  const result = await deliverNotification({
    userId: invitedUser.id,
    notificationKey: `${eventKey(payload)}:${invitedUser.id}`,
    notificationType: "group_invite",
    title: "Group invitation",
    body: `${inviterName} invited you to join ${groupName}`,
    data: {
      type: "group_invite",
      inviterName,
      inviterId: record.invited_by,
      groupId: record.group_id,
      invitationId: record.id,
    },
    relatedGroupId: record.group_id,
    actionUrl: "/notifications",
    webUrl: `${siteUrl}/notifications`,
  });
  return result !== "failed" || emailSent;
}

async function handleLogChange(payload: WebhookPayload): Promise<boolean> {
  const record = payload.record || payload.old_record!;
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("make, model, year")
    .eq("id", record.vehicle_id)
    .single();
  if (!vehicle) return false;

  const { data: shares } = await supabase
    .from("vehicle_group_shares")
    .select("group_id")
    .eq("vehicle_id", record.vehicle_id);
  if (!shares?.length) return false;

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id")
    .in(
      "group_id",
      shares.map((share) => share.group_id),
    )
    .neq("user_id", record.user_id);
  if (!members?.length) return false;

  const { data: user } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", record.user_id)
    .single();
  const userName = user?.full_name || user?.email || "Someone";
  const action =
    payload.type === "INSERT"
      ? "added"
      : payload.type === "DELETE"
        ? "deleted"
        : "updated";
  const logType = payload.table.replace("_logs", "").replace("_", " ");
  const notificationType = payload.table.replace(
    "_logs",
    "_log",
  ) as NotificationType;
  const title = "Vehicle log update";
  const body = `${userName} ${action} a ${logType} for ${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const recipients = [...new Set(members.map((member) => member.user_id))];

  const results = await Promise.all(
    recipients.map((recipientId) =>
      deliverNotification({
        userId: recipientId,
        notificationKey: `${eventKey(payload)}:${recipientId}`,
        notificationType,
        title,
        body,
        data: {
          type: "log_update",
          action: payload.type,
          userName,
          performedBy: record.user_id,
          logType: payload.table.replace("_logs", ""),
          vehicleId: record.vehicle_id,
          logId: record.id,
        },
        relatedVehicleId: record.vehicle_id,
        actionUrl: `/vehicles/${record.vehicle_id}`,
        webUrl: `${siteUrl}/vehicles/${record.vehicle_id}`,
      }),
    ),
  );
  return results.every((result) => result !== "failed");
}

async function handleGroupMemberChange(
  payload: WebhookPayload,
): Promise<boolean> {
  const record = payload.record || payload.old_record!;
  const [{ data: group }, { data: user }, { data: members }] =
    await Promise.all([
      supabase.from("groups").select("name").eq("id", record.group_id).single(),
      supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", record.user_id)
        .single(),
      supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", record.group_id)
        .neq("user_id", record.user_id),
    ]);
  if (!group || !members?.length) return false;

  const userName = user?.full_name || user?.email || "Someone";
  const joined = payload.type === "INSERT";
  const title = joined ? "New group member" : "Member left group";
  const body = `${userName} ${joined ? "joined" : "left"} ${group.name}`;
  const recipients = [...new Set(members.map((member) => member.user_id))];
  const results = await Promise.all(
    recipients.map((recipientId) =>
      deliverNotification({
        userId: recipientId,
        notificationKey: `${eventKey(payload)}:${recipientId}`,
        notificationType: "group_member",
        title,
        body,
        data: {
          type: "group_member",
          action: payload.type,
          userName,
          performedBy: record.user_id,
          groupId: record.group_id,
        },
        relatedGroupId: record.group_id,
        actionUrl: `/groups/${record.group_id}`,
        webUrl: `${siteUrl}/groups/${record.group_id}`,
      }),
    ),
  );
  return results.every((result) => result !== "failed");
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const secret = process.env.SUPABASE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("SUPABASE_WEBHOOK_SECRET is not configured");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Webhook not configured" }),
    };
  }
  if (event.headers.authorization !== `Bearer ${secret}`) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  try {
    const payload = JSON.parse(event.body || "{}") as WebhookPayload;
    if (!payload.record?.id || payload.schema !== "public") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid payload" }),
      };
    }

    let success: boolean;
    if (payload.table === "group_invitations" && payload.type === "INSERT") {
      success = await handleGroupInvitation(payload);
    } else if (
      ["fuel_logs", "mileage_logs", "service_logs"].includes(payload.table) &&
      ["INSERT", "UPDATE", "DELETE"].includes(payload.type)
    ) {
      success = await handleLogChange(payload);
    } else if (
      payload.table === "group_members" &&
      ["INSERT", "DELETE"].includes(payload.type)
    ) {
      success = await handleGroupMemberChange(payload);
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Unsupported event" }),
      };
    }

    return { statusCode: 200, body: JSON.stringify({ success }) };
  } catch (error) {
    console.error("Webhook handler error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
