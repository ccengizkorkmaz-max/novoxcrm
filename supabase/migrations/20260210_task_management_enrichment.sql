-- Migration: Task Management Enrichment
-- Created: 2026-02-10
-- Purpose: Add priority, reminders, and improve activities table for full task management

-- 1. Add fields to activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent'));
ALTER TABLE activities ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMPTZ;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS assigned_by_id UUID REFERENCES profiles(id);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id);

-- 2. Create index for reminder processing
CREATE INDEX IF NOT EXISTS idx_activities_reminder_at ON activities(reminder_at) WHERE status = 'Planned' AND reminder_sent = FALSE;

-- 3. Update existing activities to have an owner if missing (default to user_id)
UPDATE activities SET owner_id = user_id WHERE owner_id IS NULL;

-- 4. Add comment
COMMENT ON COLUMN activities.priority IS 'Task priority: Low, Medium, High, Urgent';
COMMENT ON COLUMN activities.reminder_at IS 'Specific time to send a notification reminder';
COMMENT ON COLUMN activities.owner_id IS 'The user assigned to this task/activity';
