-- Comprehensive fix for missing columns
ALTER TABLE units ADD COLUMN IF NOT EXISTS unit_category TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS block TEXT;

-- Reload Supabase Schema Cache
NOTIFY pgrst, 'reload schema';
