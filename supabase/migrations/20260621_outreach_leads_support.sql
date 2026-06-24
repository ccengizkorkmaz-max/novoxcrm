-- Outreach leads support migration
-- 1. Add lead_id to outreach_executions
ALTER TABLE outreach_executions 
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE CASCADE;

-- 2. Add lead_id to activities
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE CASCADE;

-- 3. Add lead_id to outreach_optout_logs
ALTER TABLE outreach_optout_logs 
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_outreach_exec_lead ON outreach_executions(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activities_lead ON activities(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_optout_logs_lead ON outreach_optout_logs(lead_id) WHERE lead_id IS NOT NULL;
