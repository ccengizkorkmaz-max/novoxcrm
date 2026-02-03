-- Add description column to sales table to store lead details or notes
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS description TEXT;
