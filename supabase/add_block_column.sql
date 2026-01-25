-- Add 'block' column to 'units' table
ALTER TABLE units 
ADD COLUMN IF NOT EXISTS block TEXT;

-- Refresh schema cache (optional but good practice)
NOTIFY pgrst, 'reload schema';
