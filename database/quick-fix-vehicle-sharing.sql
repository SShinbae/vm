-- Quick fix for vehicle sharing - run this if the full migration failed
-- This is a simpler approach that will definitely work

-- Step 1: Add the column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vehicles' AND column_name = 'shared_with_groups'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN shared_with_groups boolean DEFAULT false NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_vehicles_shared_with_groups ON vehicles(shared_with_groups);
    END IF;
END $$;

-- Step 2: Simple approach - just modify the existing SELECT policy
-- This is less disruptive than dropping all policies
DROP POLICY IF EXISTS "Users can view their own vehicles" ON vehicles;

-- Create a new SELECT policy that includes group sharing
CREATE POLICY "Users can view own and shared vehicles" ON vehicles FOR SELECT
USING (
  -- Own vehicles
  user_id = auth.uid()
  OR
  -- Shared vehicles from group members (only if shared_with_groups is true)
  (
    shared_with_groups = true
    AND user_id IN (
      SELECT DISTINCT gm2.user_id
      FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
      AND gm2.user_id != auth.uid()
    )
  )
);

-- Step 3: Update some existing vehicles to be shared for testing
-- Uncomment the next line if you want to make some vehicles shared for testing
-- UPDATE vehicles SET shared_with_groups = true WHERE user_id != auth.uid() LIMIT 2;

SELECT 'Quick fix applied successfully' as result;