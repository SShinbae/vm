-- Enable vehicle sharing within groups
-- Run this in Supabase SQL Editor

-- Drop existing vehicle policies
DROP POLICY IF EXISTS "Users can view own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can manage own vehicles" ON vehicles;

-- Create new vehicle policies that allow group sharing

-- 1. Vehicle SELECT policy: Users can see their own vehicles + vehicles from group members
CREATE POLICY "Vehicle group sharing" ON vehicles FOR SELECT
  USING (
    -- Users can see their own vehicles
    user_id = auth.uid()
    OR
    -- Users can see vehicles from users in their groups
    user_id IN (
      SELECT DISTINCT gm2.user_id
      FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
      AND gm2.user_id != auth.uid()
    )
  );

-- 2. Vehicle INSERT policy: Users can only create their own vehicles
CREATE POLICY "Users can create own vehicles" ON vehicles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 3. Vehicle UPDATE policy: Users can only update their own vehicles
CREATE POLICY "Users can update own vehicles" ON vehicles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Vehicle DELETE policy: Users can only delete their own vehicles
CREATE POLICY "Users can delete own vehicles" ON vehicles FOR DELETE
  USING (user_id = auth.uid());

-- Also update related log tables to allow group access

-- Mileage logs
DROP POLICY IF EXISTS "Users can manage own mileage logs" ON mileage_logs;
CREATE POLICY "Users can view group mileage logs" ON mileage_logs FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    vehicle_id IN (
      SELECT id FROM vehicles
      WHERE user_id IN (
        SELECT DISTINCT gm2.user_id
        FROM group_members gm1
        JOIN group_members gm2 ON gm1.group_id = gm2.group_id
        WHERE gm1.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage own mileage logs" ON mileage_logs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Fuel logs
DROP POLICY IF EXISTS "Users can manage own fuel logs" ON fuel_logs;
CREATE POLICY "Users can view group fuel logs" ON fuel_logs FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    vehicle_id IN (
      SELECT id FROM vehicles
      WHERE user_id IN (
        SELECT DISTINCT gm2.user_id
        FROM group_members gm1
        JOIN group_members gm2 ON gm1.group_id = gm2.group_id
        WHERE gm1.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage own fuel logs" ON fuel_logs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service logs
DROP POLICY IF EXISTS "Users can manage own service logs" ON service_logs;
CREATE POLICY "Users can view group service logs" ON service_logs FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    vehicle_id IN (
      SELECT id FROM vehicles
      WHERE user_id IN (
        SELECT DISTINCT gm2.user_id
        FROM group_members gm1
        JOIN group_members gm2 ON gm1.group_id = gm2.group_id
        WHERE gm1.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage own service logs" ON service_logs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

SELECT 'Vehicle sharing enabled successfully' as result;