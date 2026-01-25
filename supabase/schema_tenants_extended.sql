-- Extend tenants table to support logo
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url text;
