-- Create notification_type enum
CREATE TYPE "public"."notification_type" AS ENUM (
    'mileage_log',
    'fuel_log',
    'service_log',
    'group_member',
    'group_invite'
);

ALTER TYPE "public"."notification_type" OWNER TO "postgres";

-- Create notifications table
CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "notification_type" "public"."notification_type" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "data" "jsonb",
    "read" boolean DEFAULT false NOT NULL,
    "related_vehicle_id" "uuid",
    "related_group_id" "uuid",
    "action_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."notifications" OWNER TO "postgres";

-- Add foreign key constraints
ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_vehicle_id_fkey" FOREIGN KEY ("related_vehicle_id")
    REFERENCES "public"."vehicles"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_group_id_fkey" FOREIGN KEY ("related_group_id")
    REFERENCES "public"."groups"("id") ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX "idx_notifications_user_id" ON "public"."notifications"
    USING "btree" ("user_id");

CREATE INDEX "idx_notifications_created_at" ON "public"."notifications"
    USING "btree" ("created_at" DESC);

CREATE INDEX "idx_notifications_read" ON "public"."notifications"
    USING "btree" ("read");

CREATE INDEX "idx_notifications_type" ON "public"."notifications"
    USING "btree" ("notification_type");

-- Partial index for efficient unread count queries
CREATE INDEX "idx_notifications_user_unread" ON "public"."notifications"
    USING "btree" ("user_id")
    WHERE ("read" = false);

-- Composite index for user notification lists
CREATE INDEX "idx_notifications_user_created" ON "public"."notifications"
    USING "btree" ("user_id", "created_at" DESC);

-- Enable Row Level Security
ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON "public"."notifications"
    FOR SELECT
    USING (("auth"."uid"() = "user_id"));

-- RLS Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON "public"."notifications"
    FOR UPDATE
    USING (("auth"."uid"() = "user_id"));

-- RLS Policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON "public"."notifications"
    FOR DELETE
    USING (("auth"."uid"() = "user_id"));

-- RLS Policy: Service role can insert notifications (for webhooks)
CREATE POLICY "Service role can insert notifications" ON "public"."notifications"
    FOR INSERT
    TO "service_role"
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";
