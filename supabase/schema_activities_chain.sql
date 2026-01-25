-- Add previous_activity_id for chaining
ALTER TABLE activities 
    ADD COLUMN IF NOT EXISTS previous_activity_id UUID REFERENCES activities(id);

CREATE INDEX IF NOT EXISTS idx_activities_previous ON activities(previous_activity_id);
