-- Add new columns to projects table
DO $$
BEGIN
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_code text;
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS description text;
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS manager_name text;
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS phase_count integer default 1;
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS address text;
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS district text;
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS website_url text;
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date date;
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS delivery_date_planned date;
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS delivery_date_actual date;
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url text;
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS amenities jsonb default '[]'::jsonb;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column already exists';
END $$;
