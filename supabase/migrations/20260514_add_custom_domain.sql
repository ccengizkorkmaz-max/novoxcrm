-- Custom Domain Support for Multi-Tenant White Label
-- Adds custom_domain and domain_verified columns to tenants table

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS domain_verification_record JSONB DEFAULT '{}'::jsonb;

-- Index for fast domain lookups in middleware
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON tenants(custom_domain) WHERE custom_domain IS NOT NULL;

COMMENT ON COLUMN tenants.custom_domain IS 'Custom domain assigned to tenant (e.g., crm.firmname.com). Must be unique.';
COMMENT ON COLUMN tenants.domain_verified IS 'Whether the custom domain DNS has been verified via Vercel API.';
COMMENT ON COLUMN tenants.domain_verification_record IS 'DNS verification details returned from Vercel Domains API.';
