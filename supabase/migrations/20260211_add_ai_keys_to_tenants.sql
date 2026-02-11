-- Add AI API Key fields to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS openai_api_key TEXT,
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;

-- Update RLS policies if necessary to ensure only owners can see/edit these keys
-- Assuming standard RLS for tenants already exists
