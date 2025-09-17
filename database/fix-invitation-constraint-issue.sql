-- Fix Group Invitation Constraint Issue
-- This fixes the duplicate key constraint error when accepting invitations
-- Run this in Supabase SQL Editor

-- =============================================================================
-- PROBLEM ANALYSIS
-- =============================================================================
/*
The issue is with this constraint in group_invitations table:
UNIQUE(group_id, email, status)

This constraint prevents:
1. Multiple pending invitations (good ✓)
2. Status updates when accepting/declining invitations (bad ✗)

When accepting an invitation:
- Current: (group_id, email, 'pending')
- Trying to update to: (group_id, email, 'accepted')
- PostgreSQL sees this as a constraint violation

SOLUTION: Change the constraint to only prevent duplicate PENDING invitations
*/

-- =============================================================================
-- STEP 1: ANALYZE CURRENT CONSTRAINT
-- =============================================================================

SELECT 'STEP 1: Current Constraint Analysis' as step;

-- Show current constraint
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'group_invitations'::regclass
AND contype = 'u'; -- unique constraints

-- Show current invitations
SELECT
  'Current Invitations:' as info,
  COUNT(*) as total_invitations,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_invitations,
  COUNT(*) FILTER (WHERE status = 'accepted') as accepted_invitations,
  COUNT(*) FILTER (WHERE status = 'declined') as declined_invitations
FROM group_invitations;

-- =============================================================================
-- STEP 2: DROP THE PROBLEMATIC CONSTRAINT
-- =============================================================================

SELECT 'STEP 2: Removing Problematic Constraint' as step;

-- Drop the constraint that's causing issues
ALTER TABLE group_invitations
DROP CONSTRAINT IF EXISTS group_invitations_group_id_email_status_key;

-- =============================================================================
-- STEP 3: ADD CORRECT CONSTRAINT
-- =============================================================================

SELECT 'STEP 3: Adding Correct Constraint' as step;

-- Create a partial unique constraint that only prevents duplicate PENDING invitations
-- This allows multiple invitations with different statuses (accepted, declined, etc.)
CREATE UNIQUE INDEX group_invitations_unique_pending
ON group_invitations (group_id, email)
WHERE status = 'pending';

-- =============================================================================
-- STEP 4: ADD ADDITIONAL USEFUL CONSTRAINTS
-- =============================================================================

SELECT 'STEP 4: Adding Additional Constraints' as step;

-- Ensure email is properly formatted (basic validation)
DO $$
BEGIN
    BEGIN
        ALTER TABLE group_invitations
        ADD CONSTRAINT group_invitations_email_format
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
        RAISE NOTICE 'Added email format constraint';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Email format constraint already exists';
    END;
END $$;

-- Ensure expires_at is in the future when creating
DO $$
BEGIN
    BEGIN
        ALTER TABLE group_invitations
        ADD CONSTRAINT group_invitations_future_expiry
        CHECK (expires_at > created_at);
        RAISE NOTICE 'Added future expiry constraint';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Future expiry constraint already exists';
    END;
END $$;

-- =============================================================================
-- STEP 5: VERIFICATION
-- =============================================================================

SELECT 'STEP 5: Verification' as step;

-- Show new constraints
SELECT
  'Updated Constraints:' as info,
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'group_invitations'::regclass
AND contype IN ('u', 'c') -- unique and check constraints
ORDER BY contype, conname;

-- Show indexes (including the partial unique index)
SELECT
  'Indexes:' as info,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'group_invitations'
ORDER BY indexname;

-- =============================================================================
-- STEP 6: TEST THE FIX
-- =============================================================================

SELECT 'STEP 6: Testing the Fix' as step;

-- Test scenario (if you have test data)
DO $$
DECLARE
    test_group_id uuid;
    test_email text := 'test@example.com';
    test_invitation_id uuid;
BEGIN
    -- Get a test group ID (or skip if no groups exist)
    SELECT id INTO test_group_id FROM groups LIMIT 1;

    IF test_group_id IS NOT NULL THEN
        -- Clean up any existing test invitations
        DELETE FROM group_invitations WHERE email = test_email;

        -- Test 1: Create a pending invitation
        INSERT INTO group_invitations (group_id, email, invited_by, expires_at, status)
        VALUES (
            test_group_id,
            test_email,
            (SELECT id FROM auth.users LIMIT 1),
            NOW() + INTERVAL '7 days',
            'pending'
        )
        RETURNING id INTO test_invitation_id;

        RAISE NOTICE 'Test 1 PASSED: Created pending invitation %', test_invitation_id;

        -- Test 2: Try to create another pending invitation (should fail)
        BEGIN
            INSERT INTO group_invitations (group_id, email, invited_by, expires_at, status)
            VALUES (
                test_group_id,
                test_email,
                (SELECT id FROM auth.users LIMIT 1),
                NOW() + INTERVAL '7 days',
                'pending'
            );
            RAISE NOTICE 'Test 2 FAILED: Duplicate pending invitation was allowed';
        EXCEPTION WHEN unique_violation THEN
            RAISE NOTICE 'Test 2 PASSED: Duplicate pending invitation correctly prevented';
        END;

        -- Test 3: Update invitation status (should work now)
        BEGIN
            UPDATE group_invitations
            SET status = 'accepted'
            WHERE id = test_invitation_id;
            RAISE NOTICE 'Test 3 PASSED: Status update successful';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Test 3 FAILED: Status update failed - %', SQLERRM;
        END;

        -- Test 4: Create a new pending invitation for same email (should work after acceptance)
        BEGIN
            INSERT INTO group_invitations (group_id, email, invited_by, expires_at, status)
            VALUES (
                test_group_id,
                test_email,
                (SELECT id FROM auth.users LIMIT 1),
                NOW() + INTERVAL '7 days',
                'pending'
            );
            RAISE NOTICE 'Test 4 PASSED: New pending invitation after acceptance allowed';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Test 4 FAILED: New pending invitation after acceptance failed - %', SQLERRM;
        END;

        -- Clean up test data
        DELETE FROM group_invitations WHERE email = test_email;
        RAISE NOTICE 'Cleaned up test data';

    ELSE
        RAISE NOTICE 'No groups found for testing - skipping automated tests';
        RAISE NOTICE 'Manual testing: Try accepting an invitation through the app';
    END IF;
END $$;

-- =============================================================================
-- FINAL SUMMARY
-- =============================================================================

SELECT 'CONSTRAINT FIX COMPLETED' as status;

SELECT
  '✅ PROBLEMATIC CONSTRAINT REMOVED' as fix_1,
  '✅ CORRECT PARTIAL UNIQUE INDEX ADDED' as fix_2,
  '✅ EMAIL VALIDATION ADDED' as fix_3,
  '✅ EXPIRY VALIDATION ADDED' as fix_4;

-- Instructions for testing
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== INVITATION FIX COMPLETED ===';
    RAISE NOTICE '✓ Removed problematic UNIQUE(group_id, email, status) constraint';
    RAISE NOTICE '✓ Added partial unique index for pending invitations only';
    RAISE NOTICE '✓ Status updates (accept/decline) should now work';
    RAISE NOTICE '';
    RAISE NOTICE 'TESTING: Try accepting an invitation in your app';
    RAISE NOTICE 'The duplicate key constraint error should be resolved';
    RAISE NOTICE '';
    RAISE NOTICE 'BEHAVIOR: ';
    RAISE NOTICE '- Only ONE pending invitation per email per group allowed';
    RAISE NOTICE '- Multiple accepted/declined invitations per email allowed';
    RAISE NOTICE '- Status updates work without constraint violations';
END $$;

SELECT '🎉 Group invitation constraint issue fixed!' as result;