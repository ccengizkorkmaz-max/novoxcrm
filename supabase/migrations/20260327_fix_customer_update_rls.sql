-- Allow sales reps to update customers they have created

DROP POLICY IF EXISTS "Update customers strict" ON customers;

CREATE POLICY "Update customers strict" ON customers FOR UPDATE USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'owner')
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM sales WHERE sales.customer_id = customers.id AND sales.assigned_to = auth.uid())
  )
);

NOTIFY pgrst, 'reload schema';
