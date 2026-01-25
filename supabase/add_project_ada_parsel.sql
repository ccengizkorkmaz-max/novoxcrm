-- Add Ada and Parsel columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ada_no TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS parsel_no TEXT;

-- Reload schema
NOTIFY pgrst, 'reload schema';
