-- ==========================================================
-- ADD COMPANY PHONE COLUMN TO LEADS TABLE
-- ==========================================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_phone TEXT;
