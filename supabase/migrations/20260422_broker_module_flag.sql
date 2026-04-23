-- Add has_broker_module to tenants table for module-based feature toggling

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS has_broker_module BOOLEAN DEFAULT false;
