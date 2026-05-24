import type { Handler, HandlerEvent } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import {
  getUserPreferences,
  shouldDeliverNotification,
} from "./_shared/notifications";

// Environment variables
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY!;
const ONESIGNAL_APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY!;

// Webhook payload types
interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: any;
  old_record?: any;
  schema: string;
}

interface OneSignalNotification {
  app_id: string;
  include_external_user_ids: string[];
  headings: { en: string };
  contents: { en: string };
  data: Record<string, any>;
  web_url?: string;
  app_url?: string;
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Create notification record in database
 */
async function createNotificationRecord(
  userId: string,
  notificationType:
    | "mileage_log"
    | "fuel_log"
    | "service_log"
    | "group_member"
    | "group_invite",
  title: string,
  body: string,
  data: any,
  relatedVehicleId?: string | null,
  relatedGroupId?: string | null,
  actionUrl?: string | null,
): Promise<boolean> {
  try {
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      notification_type: notificationType,
      title,
      body,
      data,
      read: false,
      related_vehicle_id: relatedVehicleId,
      related_group_id: relatedGroupId,
      action_url: actionUrl,
    });

    if (error) {
      console.error("Error creating notification record:", error);
      return false;
    }

    console.log(`Notification record created for user ${userId}`);
    return true;
  } catch (error) {
    console.error("Error creating notification record:", error);
    return false;
  }
}

/**
 * Send push notification via OneSignal REST API
 */
async function sendOneSignalNotification(
  notification: OneSignalNotification,
): Promise<boolean> {
  try {
    console.log("Sending OneSignal notification:", {
      recipients: notification.include_external_user_ids,
      heading: notification.headings.en,
    });

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notification),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OneSignal API error:", response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log("OneSignal notification sent successfully:", result.id);
    return true;
  } catch (error) {
    console.error("OneSignal send error:", error);
    return false;
  }
}

/**
 * Handle group invitation notifications
 */
async function handleGroupInvitation(record: any): Promise<boolean> {
  console.log("Processing group invitation:", record.id);

  try {
    // Get recipient user by email
    const { data: invitedUser, error: userError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("email", record.email.toLowerCase())
      .single();

    if (userError || !invitedUser) {
      console.log(
        "Recipient not registered yet or error:",
        record.email,
        userError,
      );
      return false;
    }

    // Get group details
    const { data: group } = await supabase
      .from("groups")
      .select("name")
      .eq("id", record.group_id)
      .single();

    // Get inviter details
    const { data: inviter } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", record.invited_by)
      .single();

    const groupName = group?.name || "a group";
    const inviterName = inviter?.full_name || inviter?.email || "Someone";

    const title = "Group Invitation";
    const body = `${inviterName} invited you to join ${groupName}`;

    // Always create notification record in database (visible in-app)
    await createNotificationRecord(
      invitedUser.id,
      "group_invite",
      title,
      body,
      {
        inviterName,
        inviterId: record.invited_by,
        invitationId: record.id,
      },
      null,
      record.group_id,
      `${process.env.SITE_URL}/notifications`,
    );

    // Check user preferences before sending push
    const prefs = await getUserPreferences(invitedUser.id);
    const { deliver, reason } = shouldDeliverNotification(
      prefs,
      "group_invite",
    );

    if (!deliver) {
      console.log(`Push skipped for ${invitedUser.id}: ${reason}`);
      return true; // Record created, push skipped
    }

    // Send push notification
    const pushSuccess = await sendOneSignalNotification({
      app_id: ONESIGNAL_APP_ID,
      include_external_user_ids: [invitedUser.id],
      headings: { en: title },
      contents: { en: body },
      data: {
        type: "group_invite",
        groupId: record.group_id,
        invitationId: record.id,
      },
      web_url: `${process.env.SITE_URL}/notifications`,
      app_url: "yourapp://notifications",
    });

    return pushSuccess;
  } catch (error) {
    console.error("Error handling group invitation:", error);
    return false;
  }
}

/**
 * Handle log change notifications (fuel, mileage, service)
 */
async function handleLogChange(
  table: string,
  record: any,
  eventType: string,
): Promise<boolean> {
  console.log(`Processing ${table} ${eventType}:`, record.id);

  try {
    // Get vehicle details
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("make, model, year, user_id")
      .eq("id", record.vehicle_id)
      .single();

    if (!vehicle) {
      console.log("Vehicle not found:", record.vehicle_id);
      return false;
    }

    // Get groups sharing this vehicle
    const { data: shares } = await supabase
      .from("vehicle_group_shares")
      .select("group_id")
      .eq("vehicle_id", record.vehicle_id);

    if (!shares || shares.length === 0) {
      console.log("No group shares for vehicle:", record.vehicle_id);
      return false;
    }

    const groupIds = shares.map((s: any) => s.group_id);

    // Get all group members (exclude the person who made the change)
    const { data: members } = await supabase
      .from("group_members")
      .select("user_id")
      .in("group_id", groupIds)
      .neq("user_id", record.user_id);

    if (!members || members.length === 0) {
      console.log("No other members to notify");
      return false;
    }

    // Get unique user IDs (a user might be in multiple groups)
    const recipientIds = [...new Set(members.map((m: any) => m.user_id))];

    // Get user who made the change
    const { data: user } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", record.user_id)
      .single();

    const userName = user?.full_name || user?.email || "Someone";
    const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    const logType = table.replace("_logs", "").replace("_", " ");

    let action = "updated";
    if (eventType === "INSERT") action = "added";
    else if (eventType === "DELETE") action = "deleted";

    const title = "Vehicle Log Update";
    const body = `${userName} ${action} a ${logType} for ${vehicleName}`;
    // Convert table name to notification_type enum: "mileage_logs" -> "mileage_log"
    const notificationType = table.replace("_logs", "_log") as
      | "mileage_log"
      | "fuel_log"
      | "service_log";

    // Create notification records + filter push recipients by preferences
    const pushRecipientIds: string[] = [];

    for (const recipientId of recipientIds) {
      // Always create in-app notification record
      await createNotificationRecord(
        recipientId,
        notificationType,
        title,
        body,
        {
          action: eventType,
          userName,
          performedBy: record.user_id,
          logId: record.id,
        },
        record.vehicle_id,
        null,
        `${process.env.SITE_URL}/vehicles/${record.vehicle_id}`,
      );

      // Check preferences for push delivery
      const prefs = await getUserPreferences(recipientId);
      const { deliver } = shouldDeliverNotification(prefs, notificationType);
      if (deliver) {
        pushRecipientIds.push(recipientId);
      }
    }

    // Send push only to users who have it enabled
    let pushSuccess = false;
    if (pushRecipientIds.length > 0) {
      pushSuccess = await sendOneSignalNotification({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: pushRecipientIds,
        headings: { en: title },
        contents: { en: body },
        data: {
          type: "log_update",
          logType: table.replace("_logs", ""),
          vehicleId: record.vehicle_id,
          logId: record.id,
        },
        web_url: `${process.env.SITE_URL}/vehicles/${record.vehicle_id}`,
        app_url: `yourapp://vehicles/${record.vehicle_id}`,
      });
    }

    console.log(
      `Notification: ${recipientIds.length} records created, ${pushRecipientIds.length} pushes sent: ${pushSuccess}`,
    );
    return pushSuccess;
  } catch (error) {
    console.error("Error handling log change:", error);
    return false;
  }
}

/**
 * Handle group member change notifications
 */
async function handleGroupMemberChange(
  record: any,
  eventType: string,
): Promise<boolean> {
  console.log(`Processing group_members ${eventType}:`, record.id);

  try {
    // Get group details
    const { data: group } = await supabase
      .from("groups")
      .select("name")
      .eq("id", record.group_id)
      .single();

    if (!group) {
      console.log("Group not found:", record.group_id);
      return false;
    }

    // Get all group members (exclude the user who joined/left)
    const { data: members } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", record.group_id)
      .neq("user_id", record.user_id);

    if (!members || members.length === 0) {
      console.log("No other members to notify");
      return false;
    }

    const recipientIds = members.map((m: any) => m.user_id);

    // Get user who joined/left
    const { data: user } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", record.user_id)
      .single();

    const userName = user?.full_name || user?.email || "Someone";
    const groupName = group.name;

    let title = "";
    let body = "";

    if (eventType === "INSERT") {
      title = "New Group Member";
      body = `${userName} joined ${groupName}`;
    } else if (eventType === "DELETE") {
      title = "Member Left Group";
      body = `${userName} left ${groupName}`;
    } else {
      return false; // Don't notify on updates
    }

    // Create notification records + filter push recipients by preferences
    const pushRecipientIds: string[] = [];

    for (const recipientId of recipientIds) {
      await createNotificationRecord(
        recipientId,
        "group_member",
        title,
        body,
        {
          action: eventType,
          userName,
          performedBy: record.user_id,
        },
        null,
        record.group_id,
        `${process.env.SITE_URL}/groups/${record.group_id}`,
      );

      const prefs = await getUserPreferences(recipientId);
      const { deliver } = shouldDeliverNotification(prefs, "group_member");
      if (deliver) {
        pushRecipientIds.push(recipientId);
      }
    }

    let pushSuccess = false;
    if (pushRecipientIds.length > 0) {
      pushSuccess = await sendOneSignalNotification({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: pushRecipientIds,
        headings: { en: title },
        contents: { en: body },
        data: {
          type: "group_member",
          groupId: record.group_id,
          userId: record.user_id,
        },
        web_url: `${process.env.SITE_URL}/groups/${record.group_id}`,
        app_url: `yourapp://groups/${record.group_id}`,
      });
    }

    console.log(
      `Notification: ${recipientIds.length} records created, ${pushRecipientIds.length} pushes sent: ${pushSuccess}`,
    );
    return pushSuccess;
  } catch (error) {
    console.error("Error handling group member change:", error);
    return false;
  }
}

/**
 * Main handler for Supabase webhooks
 */
export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Verify webhook secret if configured
  const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;
  if (webhookSecret) {
    const authHeader = event.headers["authorization"];
    if (authHeader !== `Bearer ${webhookSecret}`) {
      // DEBUG_AUTH_MISMATCH — remove after diagnosing 401 issue
      // Logs SHA-256 prefixes so we can compare without leaking the secret
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const crypto = require("crypto");
      const sha = (s: string | undefined) =>
        s
          ? crypto.createHash("sha256").update(s).digest("hex").slice(0, 12)
          : "<empty>";
      const expected = `Bearer ${webhookSecret}`;
      console.error("DEBUG_AUTH_MISMATCH", {
        env_secret_len: webhookSecret.length,
        env_secret_sha12: sha(webhookSecret),
        env_secret_first2: webhookSecret.slice(0, 2),
        env_secret_last2: webhookSecret.slice(-2),
        env_has_lead_ws: /^\s/.test(webhookSecret),
        env_has_trail_ws: /\s$/.test(webhookSecret),
        auth_header_present: !!authHeader,
        auth_header_len: authHeader?.length ?? 0,
        auth_header_sha12: sha(authHeader),
        expected_sha12: sha(expected),
      });
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }
  }

  try {
    const payload: WebhookPayload = JSON.parse(event.body || "{}");

    console.log("Webhook payload:", {
      type: payload.type,
      table: payload.table,
      recordId: payload.record?.id,
    });

    let success = false;

    // Route to appropriate handler based on table
    switch (payload.table) {
      case "group_invitations":
        if (payload.type === "INSERT") {
          success = await handleGroupInvitation(payload.record);
        }
        break;

      case "fuel_logs":
      case "mileage_logs":
      case "service_logs":
        if (["INSERT", "UPDATE", "DELETE"].includes(payload.type)) {
          success = await handleLogChange(
            payload.table,
            payload.record || payload.old_record,
            payload.type,
          );
        }
        break;

      case "group_members":
        if (["INSERT", "DELETE"].includes(payload.type)) {
          success = await handleGroupMemberChange(
            payload.record || payload.old_record,
            payload.type,
          );
        }
        break;

      default:
        console.log("Unsupported table:", payload.table);
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Unsupported table" }),
        };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success,
        message: success
          ? "Notification sent successfully"
          : "Notification skipped or failed",
      }),
    };
  } catch (error) {
    console.error("Webhook handler error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal server error",
      }),
    };
  }
};
