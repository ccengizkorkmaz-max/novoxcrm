const { createClient } = require('@supabase/supabase-js')
const s = createClient(
    'https://ncjamvghbzutohmtclwf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jamFtdmdoYnp1dG9obXRjbHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTgyMCwiZXhwIjoyMDg0NzA1ODIwfQ.QUULsxOisQopm3r5yHfbXjWCMmFDMBcpbgvqd2tHNZo'
)

async function setup() {
    // Use management API for DDL
    const projectRef = 'ncjamvghbzutohmtclwf'
    const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jamFtdmdoYnp1dG9obXRjbHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTgyMCwiZXhwIjoyMDg0NzA1ODIwfQ.QUULsxOisQopm3r5yHfbXjWCMmFDMBcpbgvqd2tHNZo'
    
    const sql = `
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
            CREATE POLICY "Service role can do anything on broker_contact" ON broker_contact_messages
                FOR ALL USING (true) WITH CHECK (true);
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    `

    const res = await fetch(`https://${projectRef}.supabase.co/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sql })
    })

    // Alternative: Use postgres directly via REST SQL endpoint
    const res2 = await fetch(`https://${projectRef}.supabase.co/pg/query`, {
        method: 'POST',
        headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sql })
    })
    
    console.log('REST result:', res.status, await res.text().catch(() => ''))
    console.log('PG result:', res2.status, await res2.text().catch(() => ''))

    // Check profile columns
    const { data, error } = await s.from('profiles').select('full_name, email, role, broker_slug').eq('role', 'owner').limit(2)
    console.log('\nOwner profiles:', JSON.stringify(data, null, 2), error?.message)
}
setup()
