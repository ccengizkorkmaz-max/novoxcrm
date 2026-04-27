-- Add is_open_to_all_brokers column to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_open_to_all_brokers BOOLEAN DEFAULT FALSE;
