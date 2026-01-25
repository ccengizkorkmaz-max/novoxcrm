-- Add max_discount_rate column to units table
ALTER TABLE units 
ADD COLUMN IF NOT EXISTS max_discount_rate NUMERIC DEFAULT 0;

-- Comment: Stores the maximum discount percentage allowed for the unit.
