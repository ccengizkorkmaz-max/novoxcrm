-- 1. Restrict Employees Table to Owner/Admin only
-- First drop existing policies
DROP POLICY IF EXISTS "View own tenant employees" ON employees;
DROP POLICY IF EXISTS "Manage own tenant employees" ON employees;
DROP POLICY IF EXISTS "Owner/Admin view tenant employees" ON employees; -- Clean up potential previous attempts
DROP POLICY IF EXISTS "Owner/Admin manage tenant employees" ON employees;

-- Create strict policies
CREATE POLICY "Owner/Admin view tenant employees" ON employees 
FOR SELECT 
USING (
  tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);

CREATE POLICY "Owner/Admin manage tenant employees" ON employees 
FOR ALL 
USING (
  tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
)
WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);


-- 2. Restrict Employee Documents Table to Owner/Admin only
DROP POLICY IF EXISTS "View own employee documents" ON employee_documents;
DROP POLICY IF EXISTS "Manage own employee documents" ON employee_documents;
DROP POLICY IF EXISTS "View own tenant employee documents" ON employee_documents;
DROP POLICY IF EXISTS "Manage own tenant employee documents" ON employee_documents;
DROP POLICY IF EXISTS "Insert own tenant employee documents" ON employee_documents;
DROP POLICY IF EXISTS "Update own tenant employee documents" ON employee_documents;
DROP POLICY IF EXISTS "Delete own tenant employee documents" ON employee_documents;

-- Create strict policies for documents
CREATE POLICY "Owner/Admin manage employee documents" ON employee_documents 
FOR ALL
USING (
  tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
)
WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);

CREATE POLICY "Owner/Admin view employee documents" ON employee_documents 
FOR SELECT
USING (
  tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);
