-- Add selective vehicle sharing capability
-- Run this in Supabase SQL Editor

-- 1. Add shared_with_groups column to vehicles table
ALTER TABLE vehicles
ADD COLUMN shared_with_groups boolean DEFAULT false NOT NULL;

-- 2. Create index for better performance when filtering shared vehicles
CREATE INDEX idx_vehicles_shared_with_groups ON vehicles(shared_with_groups);

-- 3. Update existing vehicle policies to respect sharing preference
-- Drop all existing vehicle policies
DROP POLICY IF EXISTS "Users can view their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can insert their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can create own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Selective vehicle sharing" ON vehicles;

-- Create new vehicle policies with selective sharing
-- Users can see their own vehicles + shared vehicles from group members
CREATE POLICY "Selective vehicle sharing" ON vehicles FOR SELECT
  USING (
    -- Users can see their own vehicles
    user_id = auth.uid()
    OR
    -- Users can see shared vehicles from users in their groups
    (shared_with_groups = true AND user_id IN (
      SELECT DISTINCT gm2.user_id
      FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
      AND gm2.user_id != auth.uid()
    ))
  );

-- Users can only create their own vehicles
CREATE POLICY "Users can create own vehicles" ON vehicles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can only update their own vehicles
CREATE POLICY "Users can update own vehicles" ON vehicles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can only delete their own vehicles
CREATE POLICY "Users can delete own vehicles" ON vehicles FOR DELETE
  USING (user_id = auth.uid());

-- 4. Update log table policies to respect vehicle sharing
-- Mileage logs
DROP POLICY IF EXISTS "Users can manage logs for their vehicles" ON mileage_logs;
DROP POLICY IF EXISTS "Users can view shared mileage logs" ON mileage_logs;
DROP POLICY IF EXISTS "Users can insert own mileage logs" ON mileage_logs;
DROP POLICY IF EXISTS "Users can update own mileage logs" ON mileage_logs;
DROP POLICY IF EXISTS "Users can delete own mileage logs" ON mileage_logs;

CREATE POLICY "Users can view shared mileage logs" ON mileage_logs FOR SELECT
  USING (
    -- Can see logs for own vehicles
    user_id = auth.uid()
    OR
    -- Can see logs for shared vehicles from group members
    vehicle_id IN (
      SELECT id FROM vehicles
      WHERE shared_with_groups = true
      AND user_id IN (
        SELECT DISTINCT gm2.user_id
        FROM group_members gm1
        JOIN group_members gm2 ON gm1.group_id = gm2.group_id
        WHERE gm1.user_id = auth.uid()
        AND gm2.user_id != auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own mileage logs" ON mileage_logs FOR INSERT
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid()));

CREATE POLICY "Users can update own mileage logs" ON mileage_logs FOR UPDATE
  USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid()))
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid()));

CREATE POLICY "Users can delete own mileage logs" ON mileage_logs FOR DELETE
  USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid()));

-- Fuel logs
DROP POLICY IF EXISTS "Users can manage logs for their vehicles" ON fuel_logs;
DROP POLICY IF EXISTS "Users can view shared fuel logs" ON fuel_logs;
DROP POLICY IF EXISTS "Users can insert own fuel logs" ON fuel_logs;
DROP POLICY IF EXISTS "Users can update own fuel logs" ON fuel_logs;
DROP POLICY IF EXISTS "Users can delete own fuel logs" ON fuel_logs;

CREATE POLICY "Users can view shared fuel logs" ON fuel_logs FOR SELECT
  USING (
    -- Can see logs for own vehicles
    user_id = auth.uid()
    OR
    -- Can see logs for shared vehicles from group members
    vehicle_id IN (
      SELECT id FROM vehicles
      WHERE shared_with_groups = true
      AND user_id IN (
        SELECT DISTINCT gm2.user_id
        FROM group_members gm1
        JOIN group_members gm2 ON gm1.group_id = gm2.group_id
        WHERE gm1.user_id = auth.uid()
        AND gm2.user_id != auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own fuel logs" ON fuel_logs FOR INSERT
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid()));

CREATE POLICY "Users can update own fuel logs" ON fuel_logs FOR UPDATE
  USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid()))
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid()));

CREATE POLICY "Users can delete own fuel logs" ON fuel_logs FOR DELETE
  USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid()));

-- Service logs
DROP POLICY IF EXISTS "Users can manage logs for their vehicles" ON service_logs;
DROP POLICY IF EXISTS "Users can view shared service logs" ON service_logs;
DROP POLICY IF EXISTS "Users can insert own service logs" ON service_logs;
DROP POLICY IF EXISTS "Users can update own service logs" ON service_logs;
DROP POLICY IF EXISTS "Users can delete own service logs" ON service_logs;

CREATE POLICY "Users can view shared service logs" ON service_logs FOR SELECT
  USING (
    -- Can see logs for own vehicles
    user_id = auth.uid()
    OR
    -- Can see logs for shared vehicles from group members
    vehicle_id IN (
      SELECT id FROM vehicles
      WHERE shared_with_groups = true
      AND user_id IN (
        SELECT DISTINCT gm2.user_id
        FROM group_members gm1
        JOIN group_members gm2 ON gm1.group_id = gm2.group_id
        WHERE gm1.user_id = auth.uid()
        AND gm2.user_id != auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own service logs" ON service_logs FOR INSERT
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid()));

CREATE POLICY "Users can update own service logs" ON service_logs FOR UPDATE
  USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid()))
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid()));

CREATE POLICY "Users can delete own service logs" ON service_logs FOR DELETE
  USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid()));

-- 5. Optional: Update existing vehicles to be shared by default (remove this if you want them private by default)
-- UPDATE vehicles SET shared_with_groups = true;

SELECT 'Selective vehicle sharing migration completed successfully' as result;