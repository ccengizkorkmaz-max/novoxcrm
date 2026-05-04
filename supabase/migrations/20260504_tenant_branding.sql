-- White-Label Branding: Add brand_config JSON column to tenants
-- This allows each tenant to have custom branding (logo, colors, app name, fonts)

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS brand_config jsonb DEFAULT '{}'::jsonb;

-- Example brand_config structure:
-- {
--   "appName": "PartnerCRM",
--   "logoUrl": "/brands/partner/logo.svg",
--   "faviconUrl": "/brands/partner/favicon.ico",
--   "sidebarBg": "#0f172a",        -- Sidebar background
--   "sidebarBorder": "#1e293b",     -- Sidebar border  
--   "primaryColor": "#3b82f6",      -- Primary accent color
--   "primaryHover": "#2563eb",      -- Primary hover
--   "accentColor": "#6366f1",       -- Secondary accent
--   "badgeBg": "rgba(59,130,246,0.2)",
--   "badgeText": "#60a5fa",
--   "badgeLabel": ".dev",           -- Badge label next to app name
--   "loginBg": "from-slate-950 via-blue-950 to-slate-900",
--   "loginAccent": "#3b82f6",
--   "fontFamily": "Inter"
-- }

COMMENT ON COLUMN tenants.brand_config IS 'White-label branding configuration (JSON). Controls logo, colors, app name, and UI theme per tenant.';
