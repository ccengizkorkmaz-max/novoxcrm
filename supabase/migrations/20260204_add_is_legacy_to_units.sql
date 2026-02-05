-- Add is_legacy column to units table
ALTER TABLE units ADD COLUMN IF NOT EXISTS is_legacy BOOLEAN DEFAULT false;

-- Mark units from specific projects as legacy
UPDATE units 
SET is_legacy = true 
WHERE project_id IN (
    SELECT id FROM projects 
    WHERE name IN ('NOVO PARK 4 KOCAELİ', 'NOVO PARK 1 ETİLİ', 'NOVO PARK 2 YALOVA')
);

-- Add index for performance optimization on stats queries
CREATE INDEX IF NOT EXISTS idx_units_is_legacy ON units(is_legacy);
