-- Add unit_id to broker_leads
ALTER TABLE broker_leads ADD COLUMN unit_id UUID REFERENCES units(id) ON DELETE SET NULL;
