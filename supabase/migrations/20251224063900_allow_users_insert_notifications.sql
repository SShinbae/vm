-- Allow authenticated users to insert their own notifications
-- This is needed for the notification service to save notifications from realtime events

CREATE POLICY "Users can insert own notifications" ON "public"."notifications"
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
