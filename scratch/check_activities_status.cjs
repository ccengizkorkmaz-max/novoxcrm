const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(
    'https://ncjamvghbzutohmtclwf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jamFtdmdoYnp1dG9obXRjbHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTgyMCwiZXhwIjoyMDg0NzA1ODIwfQ.QUULsxOisQopm3r5yHfbXjWCMmFDMBcpbgvqd2tHNZo'
)
async function check() {
    // Count activities by status
    const { data, error } = await supabase
        .from('activities')
        .select('status')
    
    if (error) { console.log('Error:', error.message); return }
    
    const counts = {}
    data.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1 })
    console.log('Activity counts by status:', counts)
    console.log('Total:', data.length)
    
    // Check with the new query
    const { data: d2, error: e2 } = await supabase
        .from('activities')
        .select('*, customers(full_name, sales(status)), owner:profiles!activities_owner_id_fkey(full_name)')
        .order('due_date', { ascending: true })
        .limit(5000)
    
    console.log('\nNew query error:', e2?.message || 'none')
    console.log('New query count:', d2?.length)
    
    // Check status distribution of returned data
    if (d2) {
        const c2 = {}
        d2.forEach(a => { c2[a.status] = (c2[a.status] || 0) + 1 })
        console.log('Returned status distribution:', c2)
    }
}
check()
