-- Add new columns to units table
DO $$
BEGIN
    ALTER TABLE units ADD COLUMN IF NOT EXISTS image_url text;
    ALTER TABLE units ADD COLUMN IF NOT EXISTS description text;
    ALTER TABLE units ADD COLUMN IF NOT EXISTS features jsonb default '[]'::jsonb; -- e.g. Balcony, Terrace, Garden
    ALTER TABLE units ADD COLUMN IF NOT EXISTS view text; -- e.g. Sea, City, Forest
    ALTER TABLE units ADD COLUMN IF NOT EXISTS ada_no text;
    ALTER TABLE units ADD COLUMN IF NOT EXISTS parsel_no text;
    ALTER TABLE units ADD COLUMN IF NOT EXISTS kdv_rate numeric default 1; -- 1, 10, 20
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column already exists';
END $$;
