-- Add batch_size and batch_interval_seconds to outreach_workflows
ALTER TABLE outreach_workflows ADD COLUMN IF NOT EXISTS batch_size integer DEFAULT 100;
ALTER TABLE outreach_workflows ADD COLUMN IF NOT EXISTS batch_interval_seconds integer DEFAULT 60;

-- Set WhatsApp campaign to 500 batch, 60s interval
UPDATE outreach_workflows 
SET batch_size = 500, batch_interval_seconds = 60 
WHERE id = '5801512b-7b7d-419b-8a28-0bf78f414825';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON outreach_workflows TO authenticated, service_role;
