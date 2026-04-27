const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(
    'https://ncjamvghbzutohmtclwf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jamFtdmdoYnp1dG9obXRjbHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTgyMCwiZXhwIjoyMDg0NzA1ODIwfQ.QUULsxOisQopm3r5yHfbXjWCMmFDMBcpbgvqd2tHNZo'
)
async function check() {
    // Find brokers with leads
    const { data: leads } = await supabase
        .from('broker_leads')
        .select('broker_id')
    
    const brokerIds = [...new Set(leads?.map(l => l.broker_id))]
    console.log('Broker IDs with leads:', brokerIds)
    
    for (const id of brokerIds) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, email, role, is_active')
            .eq('id', id)
            .single()
        
        const leadCount = leads?.filter(l => l.broker_id === id).length
        console.log(`  ${profile?.full_name} | ${profile?.email} | role=${profile?.role} | active=${profile?.is_active} | leads=${leadCount}`)
    }

    // Get auth user info for the first broker
    if (brokerIds.length > 0) {
        const { data: { users } } = await supabase.auth.admin.listUsers()
        for (const id of brokerIds) {
            const u = users?.find(u => u.id === id)
            if (u) console.log(`\nAuth: ${u.email} | created: ${u.created_at}`)
        }
    }
}
check()
