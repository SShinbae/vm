/**
 * Test script for notifications
 * Run with: npx ts-node scripts/test-notifications.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "YOUR_SUPABASE_URL";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || "YOUR_SERVICE_KEY";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testCreateGroupInvitationNotification() {
  console.log("🧪 Testing Group Invitation Notification...\n");

  try {
    // Get a test user
    const { data: users } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .limit(1);

    if (!users || users.length === 0) {
      console.error("❌ No users found in database");
      return;
    }

    const testUser = users[0];
    console.log(`📧 Using test user: ${testUser.email} (${testUser.id})`);

    // Create a test notification directly in database
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        user_id: testUser.id,
        notification_type: "group_invite",
        title: "Test Group Invitation",
        body: "This is a test invitation notification",
        data: {
          inviterName: "Test User",
          inviterId: testUser.id,
          invitationId: "test-invitation-123",
        },
        read: false,
        related_vehicle_id: null,
        related_group_id: null,
        action_url: null,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating notification:", error);
      return;
    }

    console.log("✅ Notification created successfully!");
    console.log("📬 Notification details:", notification);

    // Verify it was created
    const { data: verify } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notification.id)
      .single();

    console.log("\n✅ Verification: Notification exists in database");
    console.log("📊 Data:", verify);

    // Clean up (optional)
    const cleanup = process.argv.includes("--cleanup");
    if (cleanup) {
      await supabase.from("notifications").delete().eq("id", notification.id);
      console.log("\n🧹 Cleaned up test notification");
    } else {
      console.log(
        "\n💡 Tip: Run with --cleanup flag to remove test notification",
      );
      console.log(
        `   Delete manually: DELETE FROM notifications WHERE id = '${notification.id}';`,
      );
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

async function testRealtimeSubscription() {
  console.log("🧪 Testing Realtime Subscription...\n");

  try {
    // Get a test user
    const { data: users } = await supabase
      .from("profiles")
      .select("id, email")
      .limit(1);

    if (!users || users.length === 0) {
      console.error("❌ No users found in database");
      return;
    }

    const testUser = users[0];
    console.log(`📧 Subscribing to notifications for: ${testUser.email}`);

    // Set up realtime subscription
    const channel = supabase
      .channel("test-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${testUser.id}`,
        },
        (payload) => {
          console.log("\n🔔 REALTIME EVENT RECEIVED!");
          console.log("📬 New notification:", payload.new);
        },
      )
      .subscribe((status) => {
        console.log(`📡 Subscription status: ${status}`);

        if (status === "SUBSCRIBED") {
          console.log(
            "\n✅ Subscription active! Now insert a notification to test...",
          );
          console.log("\nRun this in another terminal:");
          console.log(`npx ts-node scripts/test-notifications.ts`);
          console.log("\nPress Ctrl+C to stop listening\n");
        }
      });

    // Keep the script running
    process.on("SIGINT", () => {
      console.log("\n\n🛑 Stopping realtime subscription...");
      channel.unsubscribe();
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

async function testWebhookLocally() {
  console.log("🧪 Testing Webhook Function Locally...\n");

  try {
    // Simulate webhook payload for group invitation
    const mockPayload = {
      type: "INSERT",
      table: "group_invitations",
      record: {
        id: "test-invitation-123",
        group_id: "test-group-id",
        email: "test@example.com",
        invited_by: "test-user-id",
        status: "pending",
        created_at: new Date().toISOString(),
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
      schema: "public",
    };

    console.log(
      "📦 Mock webhook payload:",
      JSON.stringify(mockPayload, null, 2),
    );
    console.log("\n💡 To test the actual webhook function:");
    console.log(
      "1. Make sure Netlify CLI is installed: npm install -g netlify-cli",
    );
    console.log("2. Run: netlify dev");
    console.log(
      "3. Send POST request to: http://localhost:8888/.netlify/functions/send-push-notification",
    );
    console.log("4. With the payload above\n");

    console.log("Example curl command:");
    console.log(`curl -X POST http://localhost:8888/.netlify/functions/send-push-notification \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(mockPayload)}'`);
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Main menu
async function main() {
  const command = process.argv[2];

  console.log("🔔 Notification Testing Suite\n");

  switch (command) {
    case "create":
      await testCreateGroupInvitationNotification();
      break;
    case "realtime":
      await testRealtimeSubscription();
      break;
    case "webhook":
      await testWebhookLocally();
      break;
    default:
      console.log(
        "Usage: npx ts-node scripts/test-notifications.ts [command]\n",
      );
      console.log("Commands:");
      console.log("  create    - Create a test notification in database");
      console.log("  realtime  - Test realtime subscription (keep running)");
      console.log("  webhook   - Show how to test webhook locally");
      console.log("\nOptions:");
      console.log("  --cleanup - Remove test notification after creation\n");
      console.log("Examples:");
      console.log("  npx ts-node scripts/test-notifications.ts create");
      console.log(
        "  npx ts-node scripts/test-notifications.ts create --cleanup",
      );
      console.log("  npx ts-node scripts/test-notifications.ts realtime");
      console.log("  npx ts-node scripts/test-notifications.ts webhook");
      process.exit(0);
  }
}

main().catch(console.error);
