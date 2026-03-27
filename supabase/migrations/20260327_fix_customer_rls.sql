-- Fix RLS policy on Customers to allow Sales reps to see customers they just created

DROP POLICY IF EXISTS "View customers strict" ON customers;

CREATE POLICY "View customers strict" ON customers FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'owner')
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM sales WHERE sales.customer_id = customers.id AND sales.assigned_to = auth.uid())
    OR EXISTS (SELECT 1 FROM activities WHERE activities.customer_id = customers.id AND (activities.user_id = auth.uid() OR activities.owner_id = auth.uid()))
  )
);

NOTIFY pgrst, 'reload schema';
