-- Add lost_reason to sales table for keeping track of why sales were lost
ALTER TABLE sales ADD COLUMN IF NOT EXISTS lost_reason TEXT;
