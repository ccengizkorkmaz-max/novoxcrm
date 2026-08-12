-- ==========================================================
-- ALLOW SALES REPS TO VIEW ALL ACTIVITIES FOR THEIR CUSTOMERS
-- ==========================================================
-- Sales representatives should see the full activity timeline
-- (all activities by any team member) for customers they have access to.
-- Previously, they could only see activities where user_id or owner_id matched.

DROP POLICY IF EXISTS "View activities strict" ON activities;

CREATE POLICY "View activities strict" ON activities FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'owner')
    -- Own activities
    OR user_id = auth.uid()
    OR owner_id = auth.uid()
    -- All activities for customers the sales rep has access to (via assigned sale)
    OR (
      customer_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM sales
        WHERE sales.customer_id = activities.customer_id
        AND sales.assigned_to = auth.uid()
      )
    )
  )
);

NOTIFY pgrst, 'reload schema';
