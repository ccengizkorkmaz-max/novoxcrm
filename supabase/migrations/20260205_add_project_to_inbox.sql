-- Migration: Add project_id to inbox_items
-- Created: 2026-02-05

ALTER TABLE inbox_items ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_inbox_items_project ON inbox_items(project_id);
