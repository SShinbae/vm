-- Simpler, safer RLS policies for viewing group and inviter details

-- Allow users to view any group (public information)
-- Groups don't contain sensitive data, just names and descriptions
CREATE POLICY "Anyone can view groups" ON "public"."groups"
    FOR SELECT
    USING (true);

-- Allow users to view basic profile info (name, email) of any user
-- This is needed for notifications to show who invited them
CREATE POLICY "Users can view basic profile info" ON "public"."profiles"
    FOR SELECT
    USING (true);
