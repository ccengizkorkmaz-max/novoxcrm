-- Add AI provider status fields to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS is_openai_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_gemini_enabled BOOLEAN DEFAULT true;
