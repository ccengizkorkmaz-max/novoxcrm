-- =====================================================
-- FIX RLS FOR FLOOR PLANS & POSITIONS (PROFILE BASED)
-- Replaces unreliable JWT metadata check with Profile check
-- =====================================================

-- 1. Project Floor Plans
DROP POLICY IF EXISTS "Tenant isolation for floor_plans" ON project_floor_plans;

CREATE POLICY "Tenant isolation for floor_plans"
ON project_floor_plans FOR ALL
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

-- 2. Unit Floor Positions
DROP POLICY IF EXISTS "Tenant isolation for unit_positions" ON unit_floor_positions;

CREATE POLICY "Tenant isolation for unit_positions"
ON unit_floor_positions FOR ALL
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
