-- Enable Realtime for group_invitations table
-- This allows clients to subscribe to INSERT, UPDATE, DELETE events

-- Enable replica identity (required for Realtime to track changes)
ALTER TABLE group_invitations REPLICA IDENTITY FULL;

-- Add table to the realtime publication
-- This makes the table available for realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE group_invitations;

-- Note: After running this migration, clients can subscribe to changes on group_invitations
-- Example: supabase.channel('group-invitations-changes').on('postgres_changes', ...)
