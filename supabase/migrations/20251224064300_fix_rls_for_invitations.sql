-- Fix RLS policies to allow invited users to see group and inviter details

-- Allow users to view groups they're invited to
CREATE POLICY "Users can view groups they're invited to" ON "public"."groups"
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT invited_by FROM group_invitations
            WHERE group_id = groups.id AND status = 'pending'
        )
        OR
        id IN (
            SELECT gi.group_id FROM group_invitations gi
            JOIN profiles p ON p.email = gi.email
            WHERE p.id = auth.uid() AND gi.status = 'pending'
        )
    );

-- Allow users to view profiles of people who invited them
CREATE POLICY "Users can view profiles of inviters" ON "public"."profiles"
    FOR SELECT
    USING (
        auth.uid() = id
        OR
        id IN (
            SELECT gi.invited_by FROM group_invitations gi
            JOIN profiles p ON p.email = gi.email
            WHERE p.id = auth.uid()
        )
    );
