-- Backfill tenant_id for employees who have it as NULL
-- This is critical for RLS policies to work correctly

DO $$
DECLARE
    target_tenant_id uuid;
BEGIN
    -- 1. Find a valid tenant_id from an Owner/Admin profile
    SELECT tenant_id INTO target_tenant_id
    FROM profiles
    WHERE role IN ('owner', 'admin')
    AND tenant_id IS NOT NULL
    LIMIT 1;

    IF target_tenant_id IS NOT NULL THEN
        -- 2. Update Employees
        UPDATE employees
        SET tenant_id = target_tenant_id
        WHERE tenant_id IS NULL;
        
        RAISE NOTICE 'Updated employees with tenant_id: %', target_tenant_id;
        
        -- 3. Update Employee Documents (sync with employee)
        UPDATE employee_documents ed
        SET tenant_id = e.tenant_id
        FROM employees e
        WHERE ed.employee_id = e.id
        AND ed.tenant_id IS NULL;
        
        RAISE NOTICE 'Updated employee_documents with tenant_id from employees';
    ELSE
        RAISE NOTICE 'No valid tenant_id found in profiles. Skipping update.';
    END IF;
END $$;
