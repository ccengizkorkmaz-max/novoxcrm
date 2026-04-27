const { createClient } = require('@supabase/supabase-js')
const s = createClient(
    'https://ncjamvghbzutohmtclwf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jamFtdmdoYnp1dG9obXRjbHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTgyMCwiZXhwIjoyMDg0NzA1ODIwfQ.QUULsxOisQopm3r5yHfbXjWCMmFDMBcpbgvqd2tHNZo'
)

async function check() {
    // Get profiles with slugs
    const { data, error } = await s
        .from('profiles')
        .select('id, full_name, email, phone, broker_slug, agent_slug, agent_cover_url, agent_title, agent_bio, role, tenant_id')
        .eq('full_name', 'Cengiz Korkmaz')
        .limit(3)
    
    console.log('Error:', error)
    console.log('Data:', JSON.stringify(data, null, 2))

    // Check broker_contact_messages table exists
    const { data: d2, error: e2 } = await s
        .from('broker_contact_messages')
        .select('id')
        .limit(1)
    console.log('\nbroker_contact_messages table:', e2 ? `ERROR: ${e2.message}` : 'EXISTS')

    // Check storage buckets
    const { data: buckets } = await s.storage.listBuckets()
    console.log('\nStorage buckets:', buckets?.map(b => b.name))
}
check()
