-- Add counts for balconies and bathrooms
ALTER TABLE units ADD COLUMN IF NOT EXISTS balcony_count INTEGER DEFAULT 0;
ALTER TABLE units ADD COLUMN IF NOT EXISTS bathroom_count INTEGER DEFAULT 1;

-- Reload schema
NOTIFY pgrst, 'reload schema';
