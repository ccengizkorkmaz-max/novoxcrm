-- Add sale_id reference to offers table
ALTER TABLE offers ADD COLUMN IF NOT EXISTS sale_id UUID REFERENCES sales(id) ON DELETE SET NULL;
