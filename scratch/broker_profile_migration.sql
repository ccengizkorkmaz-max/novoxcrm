ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

CREATE TABLE IF NOT EXISTS broker_contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    broker_id UUID NOT NULL REFERENCES profiles(id),
    tenant_id UUID REFERENCES tenants(id),
    sender_name TEXT NOT NULL,
    sender_email TEXT,
    sender_phone TEXT,
    message TEXT NOT NULL,
    subject TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_broker_contact_broker ON broker_contact_messages(broker_id);
CREATE INDEX IF NOT EXISTS idx_broker_contact_created ON broker_contact_messages(created_at DESC);

ALTER TABLE broker_contact_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Brokers can read own messages" ON broker_contact_messages
        FOR SELECT USING (broker_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Service role full access on broker_contact" ON broker_contact_messages
        FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
