-- Add previous_status to sales table for reverting status when options expire or cancel
ALTER TABLE sales ADD COLUMN IF NOT EXISTS previous_status TEXT;
