-- Add cost (daire maliyeti) column to units table
ALTER TABLE units ADD COLUMN IF NOT EXISTS cost NUMERIC;

-- Optional: Comment explaining the column
COMMENT ON COLUMN units.cost IS 'Ünite daire maliyeti bilgisi (Sadece yöneticilere/adminlere özel)';
