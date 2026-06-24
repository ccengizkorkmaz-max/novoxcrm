ALTER TABLE leads ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_leads_project ON leads(project_id);

ALTER TABLE inbox_items ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES leads(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_inbox_items_lead ON inbox_items(lead_id) WHERE lead_id IS NOT NULL;
