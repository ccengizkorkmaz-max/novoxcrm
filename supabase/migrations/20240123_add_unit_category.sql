-- Add unit_category column to units table
ALTER TABLE units ADD COLUMN IF NOT EXISTS unit_category text;

-- Comment on column
COMMENT ON COLUMN units.unit_category IS 'Type of the property e.g. Daire, Villa, Ofis, etc.';
