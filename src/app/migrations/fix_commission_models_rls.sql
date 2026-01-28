-- Enable RLS (already enabled on line 110 of previous migration, but safe to repeat)
ALTER TABLE commission_models ENABLE ROW LEVEL SECURITY;

-- Drop existing select policy if any (to avoid duplicates)
DROP POLICY IF EXISTS "Users can view commission models in their tenant" ON commission_models;

-- Create policy for viewing commission models
CREATE POLICY "Users can view commission models in their tenant" ON commission_models
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Create policy for management to manage commission models
DROP POLICY IF EXISTS "Management can manage commission models" ON commission_models;
CREATE POLICY "Management can manage commission models" ON commission_models
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'admin', 'management')
  );
