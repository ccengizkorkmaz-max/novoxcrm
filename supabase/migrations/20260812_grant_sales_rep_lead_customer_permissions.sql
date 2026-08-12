-- ==========================================================
-- GRANT FULL PERMISSIONS TO SALES REPS FOR LEADS, CUSTOMERS, & SALES
-- ==========================================================

-- 1. CUSTOMERS TABLE POLICIES
DROP POLICY IF EXISTS "View customers strict" ON customers;
DROP POLICY IF EXISTS "Insert customers strict" ON customers;
DROP POLICY IF EXISTS "Update customers strict" ON customers;

CREATE POLICY "View customers strict" ON customers FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'owner', 'sales')
    OR created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR EXISTS (SELECT 1 FROM sales WHERE sales.customer_id = customers.id AND (sales.assigned_to = auth.uid() OR sales.created_by = auth.uid()))
    OR EXISTS (SELECT 1 FROM activities WHERE activities.customer_id = customers.id AND (activities.user_id = auth.uid() OR activities.owner_id = auth.uid()))
  )
);

CREATE POLICY "Insert customers strict" ON customers FOR INSERT WITH CHECK (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Update customers strict" ON customers FOR UPDATE USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'owner', 'sales')
    OR created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR EXISTS (SELECT 1 FROM sales WHERE sales.customer_id = customers.id AND sales.assigned_to = auth.uid())
  )
);


-- 2. SALES TABLE POLICIES
DROP POLICY IF EXISTS "View sales strict" ON sales;
DROP POLICY IF EXISTS "Insert sales strict" ON sales;
DROP POLICY IF EXISTS "Update sales strict" ON sales;

CREATE POLICY "View sales strict" ON sales FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'owner', 'sales')
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
  )
);

CREATE POLICY "Insert sales strict" ON sales FOR INSERT WITH CHECK (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Update sales strict" ON sales FOR UPDATE USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'owner', 'sales')
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
  )
);


-- 3. LEADS TABLE POLICIES
DROP POLICY IF EXISTS "leads_tenant_isolation" ON leads;

CREATE POLICY "leads_tenant_isolation" ON leads
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  ) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );


-- 4. OPPORTUNITIES TABLE POLICIES
DROP POLICY IF EXISTS "opportunities_tenant_isolation" ON opportunities;

CREATE POLICY "opportunities_tenant_isolation" ON opportunities
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  ) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

NOTIFY pgrst, 'reload schema';
