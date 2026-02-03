-- Add project_id to sales table
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);

-- Backfill project_id from units
UPDATE sales 
SET project_id = units.project_id 
FROM units 
WHERE sales.unit_id = units.id AND sales.project_id IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_sales_project_id ON sales(project_id);
