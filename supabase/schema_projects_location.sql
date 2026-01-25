-- Add location coordinates to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS latitude numeric(10, 8);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS longitude numeric(11, 8);
