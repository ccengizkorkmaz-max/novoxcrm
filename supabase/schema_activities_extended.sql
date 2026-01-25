-- Extended Activities Schema

-- 1. Create Enums if they don't exist
DO $$ BEGIN
    CREATE TYPE activity_status AS ENUM ('Planned', 'In Progress', 'Completed', 'Cancelled', 'Overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE activity_outcome AS ENUM ('Reached Interested', 'Reached Not Interested', 'Reached Price Issue', 'Reached Time Issue', 'No Answer', 'Busy', 'Follow Up Required', 'Rejected', 'Success', 'Failed', 'Unknown');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 'next_action_type' can reuse 'activity_type' or be a subset. Let's create a specific one if needed, or use text.
-- Using text for flexibility as requested in plan, but let's constrain via check constraint or just text.
-- User requested Enums in prompt.
DO $$ BEGIN
    CREATE TYPE activity_type_enum AS ENUM ('Call', 'Whatsapp', 'Meeting', 'Site Visit', 'Showroom Visit', 'Email', 'Offer Sent', 'Document Sent', 'Follow Up', 'Reservation', 'Deposit', 'Contract', 'Other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- 2. Alter Table to add new columns
ALTER TABLE activities 
    ADD COLUMN IF NOT EXISTS description TEXT, -- distinct from summary/notes?
    ADD COLUMN IF NOT EXISTS outcome activity_outcome,
    ADD COLUMN IF NOT EXISTS done_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id),
    ADD COLUMN IF NOT EXISTS assigned_by_id UUID REFERENCES profiles(id),
    ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id),
    ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES units(id),
    ADD COLUMN IF NOT EXISTS next_action_type text, -- or activity_type_enum
    ADD COLUMN IF NOT EXISTS next_action_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS reminder BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS reminder_offset INT DEFAULT 15; -- minutes

-- 3. Update existing 'type' column to be consistent if it was text (it was text).
-- We can add a check constraint or cast it.
-- ALTER TABLE activities ALTER COLUMN type TYPE activity_type_enum USING type::activity_type_enum;
-- For safety, keeping text but adding check constraint could be safer for migrations, but let's try to align.
-- Actually the existing schema used text. Let's keep it text but recommended values.

-- 4. Update 'status' column to use enum or text check
-- The existing schema has default 'Planned'.
-- Let's just create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_owner ON activities(owner_id);
CREATE INDEX IF NOT EXISTS idx_activities_project ON activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_due_date ON activities(due_date);

-- 5. Add trigger for Overdue (optional, usually handled by cron or query time, DB trigger is hard for time-based)
-- Instead, we just query "where due_date < now() and status = 'Planned'" as Overdue in the UI/API.
