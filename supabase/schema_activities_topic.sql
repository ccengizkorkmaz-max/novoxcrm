-- Create ENUM for Activity Topics
DO $$ BEGIN
    CREATE TYPE activity_topic_enum AS ENUM ('General', 'Sales', 'Negotiation', 'Contract', 'Support', 'After Sales', 'Collection');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE activities 
    ADD COLUMN IF NOT EXISTS topic activity_topic_enum DEFAULT 'General';
