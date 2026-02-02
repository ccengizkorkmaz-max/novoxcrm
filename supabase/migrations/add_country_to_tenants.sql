-- Add country column to tenants table to support localized formatting
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS country text DEFAULT 'Türkiye';
