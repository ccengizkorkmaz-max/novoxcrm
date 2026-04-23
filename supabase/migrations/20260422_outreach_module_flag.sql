-- Add has_outreach_module to tenants table for module-based feature toggling

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS has_outreach_module BOOLEAN DEFAULT false;
