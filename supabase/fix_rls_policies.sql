-- FIX RLS POLICIES (Comprehensive & Idempotent)

-- 1. PROFILES
DROP POLICY IF EXISTS "View own profile" ON profiles;
DROP POLICY IF EXISTS "Manage own profile" ON profiles;

CREATE POLICY "Manage own profile" ON profiles
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 2. TENANTS (Missing Piece!)
DROP POLICY IF EXISTS "View own tenant" ON tenants;
CREATE POLICY "View own tenant" ON tenants
  FOR SELECT
  USING (id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 3. PROJECTS
DROP POLICY IF EXISTS "View own tenant projects" ON projects;
DROP POLICY IF EXISTS "Manage own tenant projects" ON projects;

CREATE POLICY "Manage own tenant projects" ON projects
  FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 4. UNITS
DROP POLICY IF EXISTS "View own tenant units" ON units;
DROP POLICY IF EXISTS "Manage own tenant units" ON units;

CREATE POLICY "Manage own tenant units" ON units
  FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())));

-- 5. CRM & Sales
DROP POLICY IF EXISTS "Manage own tenant customers" ON customers;
CREATE POLICY "Manage own tenant customers" ON customers
  FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Manage own tenant sales" ON sales;
CREATE POLICY "Manage own tenant sales" ON sales
  FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 6. Finance
DROP POLICY IF EXISTS "View own tenant contracts" ON contracts;
DROP POLICY IF EXISTS "Manage own tenant contracts" ON contracts;

CREATE POLICY "Manage own tenant contracts" ON contracts
  FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Manage own tenant payment_items" ON payment_items;
CREATE POLICY "Manage own tenant payment_items" ON payment_items
  FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Manage own tenant payment_plans" ON payment_plans;
CREATE POLICY "Manage own tenant payment_plans" ON payment_plans
  FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
