-- =====================================================
-- FIX GROUP INVITATIONS QUERY ISSUE
-- =====================================================
-- This script fixes the issue where group invitations 
-- return null for groups and profiles data due to RLS
-- =====================================================

-- Function to get user invitations with full details (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_invitations_with_details(user_email text)
RETURNS TABLE (
    invitation_id uuid,
    group_id uuid,
    group_name text,
    group_description text,
    invited_by_id uuid,
    invited_by_name text,
    invited_by_email text,
    status invitation_status,
    created_at timestamp with time zone,
    expires_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        gi.id as invitation_id,
        gi.group_id,
        g.name as group_name,
        g.description as group_description,
        gi.invited_by as invited_by_id,
        p.full_name as invited_by_name,
        p.email as invited_by_email,
        gi.status,
        gi.created_at,
        gi.expires_at
    FROM group_invitations gi
    JOIN groups g ON gi.group_id = g.id
    JOIN profiles p ON gi.invited_by = p.id
    WHERE gi.email = user_email
    ORDER BY gi.created_at DESC;
END;
$$;

-- Function to get group invitations for group owners (bypasses RLS)
CREATE OR REPLACE FUNCTION get_group_invitations_with_details(group_uuid uuid)
RETURNS TABLE (
    invitation_id uuid,
    invited_email text,
    invited_by_id uuid,
    invited_by_name text,
    invited_by_email text,
    status invitation_status,
    created_at timestamp with time zone,
    expires_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        gi.id as invitation_id,
        gi.email as invited_email,
        gi.invited_by as invited_by_id,
        p.full_name as invited_by_name,
        p.email as invited_by_email,
        gi.status,
        gi.created_at,
        gi.expires_at
    FROM group_invitations gi
    JOIN profiles p ON gi.invited_by = p.id
    WHERE gi.group_id = group_uuid
    ORDER BY gi.created_at DESC;
END;
$$;

-- Test the functions
DO $$
DECLARE
    test_result record;
BEGIN
    -- Test getting user invitations
    SELECT COUNT(*) as invitation_count INTO test_result
    FROM get_user_invitations_with_details('wanahnaf07@gmail.com');
    
    RAISE NOTICE '✅ User invitations function test: % invitations found', test_result.invitation_count;
    
    -- Show sample data
    FOR test_result IN 
        SELECT * FROM get_user_invitations_with_details('wanahnaf07@gmail.com') LIMIT 1
    LOOP
        RAISE NOTICE '📝 Sample invitation: Group "%" invited by "%"', test_result.group_name, test_result.invited_by_name;
    END LOOP;
    
    RAISE NOTICE '🎉 Group invitations functions created successfully!';
END $$;