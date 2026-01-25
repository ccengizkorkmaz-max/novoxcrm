-- Add tenant_id to units
ALTER TABLE units ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Backfill tenant_id from projects
UPDATE units u
SET tenant_id = p.tenant_id
FROM projects p
WHERE u.project_id = p.id
AND u.tenant_id IS NULL;

-- Enable RLS for insert based on tenant_id
CREATE POLICY "Enable insert for users based on tenant" ON units
FOR INSERT WITH CHECK (
    auth.uid() IN (
        SELECT id FROM profiles WHERE tenant_id = units.tenant_id
    )
);

-- Update Select policy to use tenant_id directly (optimization)
DROP POLICY IF EXISTS "View own tenant units" ON units;

CREATE POLICY "View own tenant units" ON units
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
);

-- Update Update/Delete policies similarly
CREATE POLICY "Enable update for users based on tenant" ON units
FOR UPDATE USING (
    tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Enable delete for users based on tenant" ON units
FOR DELETE USING (
    tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
);
