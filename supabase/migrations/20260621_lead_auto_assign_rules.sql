-- Add columns for automatic lead assignment to tenants table
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS lead_assignment_mode text NOT NULL DEFAULT 'manual'
  CHECK (lead_assignment_mode IN ('manual', 'round_robin'));

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS lead_assignment_last_rep_index integer NOT NULL DEFAULT 0;
