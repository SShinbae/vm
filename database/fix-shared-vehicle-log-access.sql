-- Fix RLS policies for log tables to allow shared vehicle access
-- This script updates the Row Level Security policies to allow users to view logs
-- for vehicles that have been shared with groups they are members of.

-- First, let's check existing policies and remove old ones if needed
DO $$
DECLARE
    policy_exists boolean;
BEGIN
    -- Check if policies exist before dropping
    SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'fuel_logs'
        AND policyname = 'Users can view shared vehicle fuel logs'
    ) INTO policy_exists;

    IF policy_exists THEN
        DROP POLICY "Users can view shared vehicle fuel logs" ON fuel_logs;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'service_logs'
        AND policyname = 'Users can view shared vehicle service logs'
    ) INTO policy_exists;

    IF policy_exists THEN
        DROP POLICY "Users can view shared vehicle service logs" ON service_logs;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'mileage_logs'
        AND policyname = 'Users can view shared vehicle mileage logs'
    ) INTO policy_exists;

    IF policy_exists THEN
        DROP POLICY "Users can view shared vehicle mileage logs" ON mileage_logs;
    END IF;
END $$;

-- Create new policies that allow access to logs for shared vehicles

-- 1. Fuel Logs - Allow access for vehicle owners AND group members of shared vehicles
CREATE POLICY "Users can view shared vehicle fuel logs" ON fuel_logs
FOR SELECT USING (
    -- User owns the vehicle
    vehicle_id IN (
        SELECT id FROM vehicles WHERE user_id = auth.uid()
    )
    OR
    -- Vehicle is shared with a group the user is a member of
    vehicle_id IN (
        SELECT vgs.vehicle_id
        FROM vehicle_group_shares vgs
        JOIN group_members gm ON vgs.group_id = gm.group_id
        WHERE gm.user_id = auth.uid()
    )
);

-- 2. Service Logs - Allow access for vehicle owners AND group members of shared vehicles
CREATE POLICY "Users can view shared vehicle service logs" ON service_logs
FOR SELECT USING (
    -- User owns the vehicle
    vehicle_id IN (
        SELECT id FROM vehicles WHERE user_id = auth.uid()
    )
    OR
    -- Vehicle is shared with a group the user is a member of
    vehicle_id IN (
        SELECT vgs.vehicle_id
        FROM vehicle_group_shares vgs
        JOIN group_members gm ON vgs.group_id = gm.group_id
        WHERE gm.user_id = auth.uid()
    )
);

-- 3. Mileage Logs - Allow access for vehicle owners AND group members of shared vehicles
CREATE POLICY "Users can view shared vehicle mileage logs" ON mileage_logs
FOR SELECT USING (
    -- User owns the vehicle
    vehicle_id IN (
        SELECT id FROM vehicles WHERE user_id = auth.uid()
    )
    OR
    -- Vehicle is shared with a group the user is a member of
    vehicle_id IN (
        SELECT vgs.vehicle_id
        FROM vehicle_group_shares vgs
        JOIN group_members gm ON vgs.group_id = gm.group_id
        WHERE gm.user_id = auth.uid()
    )
);

-- Verify the policies were created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('fuel_logs', 'service_logs', 'mileage_logs')
  AND policyname LIKE '%shared vehicle%'
ORDER BY tablename, policyname;

-- Test query to verify access (replace with actual user ID and vehicle ID for testing)
-- This is just a template - uncomment and modify for testing
/*
-- Test fuel logs access
SELECT
    'fuel_logs' as table_name,
    vehicle_id,
    COUNT(*) as record_count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM fuel_logs
WHERE vehicle_id = 'YOUR_SHARED_VEHICLE_ID'
GROUP BY vehicle_id;

-- Test service logs access
SELECT
    'service_logs' as table_name,
    vehicle_id,
    COUNT(*) as record_count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM service_logs
WHERE vehicle_id = 'YOUR_SHARED_VEHICLE_ID'
GROUP BY vehicle_id;

-- Test mileage logs access
SELECT
    'mileage_logs' as table_name,
    vehicle_id,
    COUNT(*) as record_count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM mileage_logs
WHERE vehicle_id = 'YOUR_SHARED_VEHICLE_ID'
GROUP BY vehicle_id;
*/

-- Success message
SELECT 'RLS policies updated successfully for shared vehicle log access!' as result;