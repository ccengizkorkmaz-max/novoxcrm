-- ============================================================
-- ADD is_customer_shareable TO PROJECT_DOCUMENTS
-- ============================================================

-- 1. Add is_customer_shareable column with default true
ALTER TABLE project_documents ADD COLUMN IF NOT EXISTS is_customer_shareable BOOLEAN DEFAULT true;

-- 2. Backfill existing records based on existing permissions column
UPDATE project_documents 
SET is_customer_shareable = CASE 
    WHEN permissions = 'internal' THEN false 
    ELSE true 
END
WHERE is_customer_shareable IS NULL;
