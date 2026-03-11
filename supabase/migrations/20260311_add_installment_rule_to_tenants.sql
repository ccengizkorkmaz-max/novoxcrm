-- Add installment start rule to tenants
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS installment_start_rule TEXT DEFAULT 'NextMonth15th';
