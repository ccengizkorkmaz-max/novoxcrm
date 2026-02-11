-- Allow public access to units and projects for shared catalogs

-- 1. Units Policy
DROP POLICY IF EXISTS "Public can read units in active links" ON units;
CREATE POLICY "Public can read units in active links"
ON units FOR SELECT
USING (
  id IN (
    SELECT UNNEST(unit_ids) 
    FROM public_inventory_links 
    WHERE is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
  )
);

-- 2. Projects Policy
DROP POLICY IF EXISTS "Public can read projects in active links" ON projects;
CREATE POLICY "Public can read projects in active links"
ON projects FOR SELECT
USING (
  id IN (
    SELECT project_id FROM units 
    WHERE id IN (
      SELECT UNNEST(unit_ids) 
      FROM public_inventory_links 
      WHERE is_active = true 
      AND (expires_at IS NULL OR expires_at > now())
    )
  )
);
