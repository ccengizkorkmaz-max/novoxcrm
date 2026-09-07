-- ============================================================
-- ADD FOLDER & PROGRESS FIELDS TO PROJECT_DOCUMENTS FOR CONSTRUCTION GALLERY
-- ============================================================

-- 1. Add folder_name column to group construction media into folders / phases
ALTER TABLE project_documents ADD COLUMN IF NOT EXISTS folder_name TEXT DEFAULT 'Genel İlerlemeler';

-- 2. Add progress_date column to track milestone date of construction phase
ALTER TABLE project_documents ADD COLUMN IF NOT EXISTS progress_date DATE;

-- 3. Add progress_percentage column (0-100) for construction stage completion
ALTER TABLE project_documents ADD COLUMN IF NOT EXISTS progress_percentage INTEGER;

-- 4. Create an index on project_id and folder_name for fast segmentation
CREATE INDEX IF NOT EXISTS idx_project_docs_folder ON project_documents(project_id, folder_name);
