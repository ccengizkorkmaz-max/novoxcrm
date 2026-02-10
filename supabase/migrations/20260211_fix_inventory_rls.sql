-- =====================================================
-- FIX INVENTORY RLS POLICIES
-- Replaces JWT-based checks with Profile-based checks for reliability
-- =====================================================

-- 1. Fix RLS for project_floor_plans
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

-- 2. Fix RLS for unit_floor_positions
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

-- 3. Fix RLS for unit_documents
DROP POLICY IF EXISTS "Tenant isolation for unit_documents" ON unit_documents;

CREATE POLICY "Tenant isolation for unit_documents"
ON unit_documents FOR ALL
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

-- 4. Fix RLS for unit_notes
DROP POLICY IF EXISTS "Tenant isolation for unit_notes" ON unit_notes;

CREATE POLICY "Tenant isolation for unit_notes"
ON unit_notes FOR ALL
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
