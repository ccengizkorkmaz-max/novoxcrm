-- Add start_date and end_date to outreach_workflows to support scheduling active calendar periods
ALTER TABLE outreach_workflows 
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Regrant permissions to authenticated and service role users
GRANT SELECT, INSERT, UPDATE, DELETE ON outreach_workflows TO authenticated, service_role;
