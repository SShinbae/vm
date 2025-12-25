-- Rollback the problematic RLS policies that are causing 500 errors

-- Drop the policies I just added
DROP POLICY IF EXISTS "Users can view groups they're invited to" ON "public"."groups";
DROP POLICY IF EXISTS "Users can view profiles of inviters" ON "public"."profiles";
