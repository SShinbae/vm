-- Add fuel_price column to fuel_logs table
-- This allows users to track the price per liter when adding fuel logs

ALTER TABLE fuel_logs 
ADD COLUMN fuel_price DECIMAL(5,3) NULL;

-- Add comment to explain the column
COMMENT ON COLUMN fuel_logs.fuel_price IS 'Price per liter of fuel (e.g., 1.99 for RM1.99 per liter)';

-- Update existing records to have a default fuel_price if cost and liters_filled are available
-- This will calculate an approximate fuel price for existing records
UPDATE fuel_logs 
SET fuel_price = ROUND((cost / liters_filled)::decimal, 3)
WHERE cost IS NOT NULL 
  AND cost > 0 
  AND liters_filled > 0 
  AND fuel_price IS NULL;