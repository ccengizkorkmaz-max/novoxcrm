-- Add missing DELETE RLS policy for deposits table
-- Without this, admin delete operations silently fail due to RLS blocking

-- Add DELETE policy
CREATE POLICY "Users can delete own tenant deposits" ON deposits
    FOR DELETE USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
