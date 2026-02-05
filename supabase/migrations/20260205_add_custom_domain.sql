
-- Add custom_domain column to tenants
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;

-- Add index for performance in middleware lookups
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON public.tenants (custom_domain);
