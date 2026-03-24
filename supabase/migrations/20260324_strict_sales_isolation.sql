-- ==========================================================
-- STRICT RLS FOR SALES REPS (Isolating visibility to own records)
-- ==========================================================

-- 1. SALES TABLE
-- Drop overly broad policies
DROP POLICY IF EXISTS "Manage own tenant sales" ON sales;
DROP POLICY IF EXISTS "Owner and Manager can view all sales" ON sales;
DROP POLICY IF EXISTS "Sales can view own sales" ON sales;
DROP POLICY IF EXISTS "Sales can insert own sales" ON sales;
DROP POLICY IF EXISTS "Sales can update own sales" ON sales;
DROP POLICY IF EXISTS "Users can view sales" ON sales;

-- Create strict policies
CREATE POLICY "View sales strict" ON sales FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'owner')
    OR assigned_to = auth.uid()
  )
);

CREATE POLICY "Insert sales strict" ON sales FOR INSERT WITH CHECK (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Update sales strict" ON sales FOR UPDATE USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'owner')
    OR assigned_to = auth.uid()
  )
);

CREATE POLICY "Delete sales strict" ON sales FOR DELETE USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'owner')
);


-- 2. CUSTOMERS TABLE
-- Drop overly broad policies
DROP POLICY IF EXISTS "Manage own tenant customers" ON customers;
DROP POLICY IF EXISTS "View own tenant customers" ON customers;
DROP POLICY IF EXISTS "Sales can view all customers" ON customers;
DROP POLICY IF EXISTS "Owner and Manager can manage all customers" ON customers;
DROP POLICY IF EXISTS "Sales can insert customers" ON customers;
DROP POLICY IF EXISTS "Sales can update customers" ON customers;

CREATE POLICY "View customers strict" ON customers FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'owner')
    -- If they have an assigned sale for this customer
    OR EXISTS (SELECT 1 FROM sales WHERE sales.customer_id = customers.id AND sales.assigned_to = auth.uid())
    -- Or if they have an activity for this customer
    OR EXISTS (SELECT 1 FROM activities WHERE activities.customer_id = customers.id AND (activities.user_id = auth.uid() OR activities.owner_id = auth.uid()))
  )
);

CREATE POLICY "Insert customers strict" ON customers FOR INSERT WITH CHECK (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Update customers strict" ON customers FOR UPDATE USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'owner')
    OR EXISTS (SELECT 1 FROM sales WHERE sales.customer_id = customers.id AND sales.assigned_to = auth.uid())
  )
);

CREATE POLICY "Delete customers strict" ON customers FOR DELETE USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'owner')
);


-- 3. ACTIVITIES TABLE
-- Drop overly broad policies
DROP POLICY IF EXISTS "Manage own tenant activities" ON activities;
DROP POLICY IF EXISTS "View own tenant activities" ON activities;
DROP POLICY IF EXISTS "Owner and Manager can view all activities" ON activities;
DROP POLICY IF EXISTS "Sales can view own activities" ON activities;

CREATE POLICY "View activities strict" ON activities FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'owner')
    OR user_id = auth.uid()
    OR owner_id = auth.uid()
  )
);

CREATE POLICY "Insert activities strict" ON activities FOR INSERT WITH CHECK (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Update activities strict" ON activities FOR UPDATE USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'owner')
    OR user_id = auth.uid()
    OR owner_id = auth.uid()
  )
);

CREATE POLICY "Delete activities strict" ON activities FOR DELETE USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'owner')
    OR user_id = auth.uid()
  )
);


-- 4. CUSTOMER DEMANDS TABLE
-- Drop overly broad policies
DROP POLICY IF EXISTS "Manage own tenant customer demands" ON customer_demands;
DROP POLICY IF EXISTS "View own tenant customer demands" ON customer_demands;

CREATE POLICY "View customer demands strict" ON customer_demands FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'owner')
    OR EXISTS (SELECT 1 FROM sales WHERE sales.customer_id = customer_demands.customer_id AND sales.assigned_to = auth.uid())
  )
);

CREATE POLICY "Insert customer demands strict" ON customer_demands FOR INSERT WITH CHECK (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Update customer demands strict" ON customer_demands FOR UPDATE USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'owner')
    OR EXISTS (SELECT 1 FROM sales WHERE sales.customer_id = customer_demands.customer_id AND sales.assigned_to = auth.uid())
  )
);

CREATE POLICY "Delete customer demands strict" ON customer_demands FOR DELETE USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'owner')
);


-- 5. CONTRACTS
DROP POLICY IF EXISTS "Manage own tenant contracts" ON contracts;
DROP POLICY IF EXISTS "View own tenant contracts" ON contracts;

CREATE POLICY "View contracts strict" ON contracts FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'owner')
    OR sales_rep_id = auth.uid()
  )
);

CREATE POLICY "Manage contracts strict" ON contracts FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'owner')
    OR sales_rep_id = auth.uid()
  )
);

-- Note: We also need to refresh the postgrest schema cache just in case.
NOTIFY pgrst, 'reload schema';
