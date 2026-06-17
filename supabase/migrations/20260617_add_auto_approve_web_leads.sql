-- Add auto_approve_web_leads column to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS auto_approve_web_leads BOOLEAN DEFAULT true;
