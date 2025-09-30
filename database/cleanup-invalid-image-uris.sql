-- Cleanup script for invalid file:// URIs in vehicle images
-- These URIs were incorrectly saved to the database instead of Supabase Storage URLs
-- Run this in your Supabase SQL Editor

-- First, let's see which vehicles have invalid URIs
SELECT
  id,
  make,
  model,
  year,
  license_plate,
  main_image_url,
  created_at
FROM vehicles
WHERE main_image_url LIKE 'file://%'
ORDER BY created_at DESC;

-- Update vehicles to remove invalid file:// URIs
-- This will set the image URL to NULL for affected vehicles
UPDATE vehicles
SET
  main_image_url = NULL,
  updated_at = NOW()
WHERE main_image_url LIKE 'file://%';

-- Verify the cleanup
SELECT
  COUNT(*) as fixed_count
FROM vehicles
WHERE main_image_url LIKE 'file://%';

-- This should return 0 if successful

-- Optional: Check all vehicles with NULL images now
SELECT
  id,
  make,
  model,
  year,
  license_plate,
  main_image_url
FROM vehicles
WHERE main_image_url IS NULL
ORDER BY created_at DESC;