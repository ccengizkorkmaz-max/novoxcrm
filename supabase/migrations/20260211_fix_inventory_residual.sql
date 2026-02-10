-- =====================================================
-- FIX RESIDUAL INVENTORY RLS POLICIES (OPTIONAL BUT RECOMMENDED)
-- Ensures unit_images and unit_activity_log also use Profile-based checks
-- This prevents "new row violates row-level security policy" errors for Gallery and Logs
-- =====================================================

-- 1. Fix RLS for unit_images
DROP POLICY IF EXISTS "Tenant isolation for unit_images" ON unit_images;

CREATE POLICY "Tenant isolation for unit_images"
ON unit_images FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
);

-- 2. Fix RLS for unit_activity_log
DROP POLICY IF EXISTS "Tenant isolation for unit_activity_log" ON unit_activity_log;

CREATE POLICY "Tenant isolation for unit_activity_log"
ON unit_activity_log FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
);
