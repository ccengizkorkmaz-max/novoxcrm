-- ============================================================
-- ADD CATEGORY AND PERMISSIONS TO PROJECT_DOCUMENTS
-- ============================================================

-- 1. Add category to project_documents
ALTER TABLE project_documents ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'brochure';

-- 2. Add permissions to project_documents
ALTER TABLE project_documents ADD COLUMN IF NOT EXISTS permissions TEXT DEFAULT 'public';
