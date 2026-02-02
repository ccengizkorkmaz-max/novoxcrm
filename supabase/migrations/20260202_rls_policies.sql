-- RLS Policies for Role-Based Access Control
-- Roles: owner, manager, sales

-- 1. Sales Table
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner and Manager can view all sales" ON sales;
CREATE POLICY "Owner and Manager can view all sales" ON sales
FOR ALL
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'manager', 'admin')
);

DROP POLICY IF EXISTS "Sales can view own sales" ON sales;
CREATE POLICY "Sales can view own sales" ON sales
FOR SELECT
USING (
  auth.uid() = assigned_to
);

DROP POLICY IF EXISTS "Sales can insert own sales" ON sales;
CREATE POLICY "Sales can insert own sales" ON sales
FOR INSERT
WITH CHECK (
  auth.uid() = assigned_to
);

DROP POLICY IF EXISTS "Sales can update own sales" ON sales;
CREATE POLICY "Sales can update own sales" ON sales
FOR UPDATE
USING (
  auth.uid() = assigned_to
);

-- Note: Sales cannot DELETE, only Owner/Manager (via ALL policy above)

-- 2. Customers Table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Everyone can view customers (for now, to check duplicates), or restrict?
-- Strict mode: Sales see only customers they added or are assigned to (via sales).
-- Simple mode for now: Everyone sees customers to prevent duplicates, but maybe mask data?
-- Let's go with: Everyone sees basic customer list, but maybe we restrict edits?

DROP POLICY IF EXISTS "Owner and Manager can manage all customers" ON customers;
CREATE POLICY "Owner and Manager can manage all customers" ON customers
FOR ALL
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'manager', 'admin')
);

DROP POLICY IF EXISTS "Sales can view all customers" ON customers;
CREATE POLICY "Sales can view all customers" ON customers
FOR SELECT
USING (true); -- Shared pool for now to find existing customers

DROP POLICY IF EXISTS "Sales can insert customers" ON customers;
CREATE POLICY "Sales can insert customers" ON customers
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Sales can update customers" ON customers;
CREATE POLICY "Sales can update customers" ON customers
FOR UPDATE
USING (true); 
-- We might want to restrict this later, but for collaboration usually customers are shared.

-- 3. Profiles (Users)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view profiles" ON profiles;
CREATE POLICY "Everyone can view profiles" ON profiles
FOR SELECT
USING (true); -- Needed to see who assigned_to is

DROP POLICY IF EXISTS "Only Owner can update profiles" ON profiles;
CREATE POLICY "Only Owner can update profiles" ON profiles
FOR UPDATE
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'admin')
);

-- 4. Projects/Units/Blocks (Read Only for Sales, Manage for Owner)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone read projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Everyone read blocks" ON blocks FOR SELECT USING (true);
CREATE POLICY "Everyone read units" ON units FOR SELECT USING (true);

CREATE POLICY "Owner manage projects" ON projects FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'admin'));
CREATE POLICY "Owner manage blocks" ON blocks FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'admin'));
CREATE POLICY "Owner manage units" ON units FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'admin'));

-- Manager might need to manage units (status change)?
CREATE POLICY "Manager update units" ON units FOR UPDATE USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'manager');

