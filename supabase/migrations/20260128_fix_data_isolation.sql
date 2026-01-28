-- ==========================================
-- 🛡️ DATA ISOLATION FIX (GLOBAL)
-- ==========================================

-- 1. FIX Profiles Trigger (Stop assigning random tenant!)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_tid uuid;
  v_role text;
BEGIN
  -- Get tenant_id from metadata
  v_tid := (new.raw_user_meta_data->>'tenant_id')::uuid;
  
  -- Get role from metadata
  v_role := new.raw_user_meta_data->>'role';
  IF v_role IS NULL THEN v_role := 'user'; END IF;

  -- Profile creation (DO NOT FALLBACK TO RANDOM TENANT)
  INSERT INTO public.profiles (id, tenant_id, full_name, role, email)
  VALUES (
    new.id, 
    v_tid, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email), 
    v_role, 
    new.email
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. BROKER APPLICATIONS RLS
DROP POLICY IF EXISTS "Staff can view applications" ON broker_applications;
CREATE POLICY "Staff can view applications" ON broker_applications
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('management', 'sales', 'owner', 'admin')
  );

DROP POLICY IF EXISTS "Staff can update applications" ON broker_applications;
CREATE POLICY "Staff can update applications" ON broker_applications
  FOR UPDATE USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('management', 'sales', 'owner', 'admin')
  );

-- 3. BROKER LEADS RLS
DROP POLICY IF EXISTS "Users can view broker leads" ON broker_leads;
CREATE POLICY "Users can view broker leads" ON broker_leads
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND (
      broker_id = auth.uid() OR
      (SELECT role FROM profiles WHERE id = auth.uid()) IN ('management', 'sales', 'owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Staff can update leads" ON broker_leads;
CREATE POLICY "Staff can update leads" ON broker_leads
  FOR UPDATE USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('management', 'sales', 'owner', 'admin')
  );

-- 4. COMMISSIONS RLS
DROP POLICY IF EXISTS "Staff can view all commissions" ON commissions;
CREATE POLICY "Staff can view all commissions" ON commissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM broker_leads bl 
      WHERE bl.id = commissions.lead_id 
      AND bl.tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    )
  );

-- 5. CONTRACTS RLS (Triple check)
DROP POLICY IF EXISTS "View own tenant contracts" ON contracts;
CREATE POLICY "View own tenant contracts" ON contracts
  FOR SELECT USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Manage own tenant contracts" ON contracts;
CREATE POLICY "Manage own tenant contracts" ON contracts
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 6. SALES RLS (Triple check)
DROP POLICY IF EXISTS "Manage own tenant sales" ON sales;
CREATE POLICY "Manage own tenant sales" ON sales
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 7. PROJECTS/UNITS RLS
DROP POLICY IF EXISTS "View own tenant projects" ON projects;
CREATE POLICY "View own tenant projects" ON projects
  FOR SELECT USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "View own tenant units" ON units;
CREATE POLICY "View own tenant units" ON units
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = units.project_id AND p.tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  );

-- 8. COMMISSION MODELS
ALTER TABLE commission_models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Manage own tenant commission models" ON commission_models;
CREATE POLICY "Manage own tenant commission models" ON commission_models
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 9. INCENTIVE CAMPAIGNS
ALTER TABLE incentive_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Manage own tenant incentive campaigns" ON incentive_campaigns;
CREATE POLICY "Manage own tenant incentive campaigns" ON incentive_campaigns
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
