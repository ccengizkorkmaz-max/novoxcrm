const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(
    'https://ncjamvghbzutohmtclwf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jamFtdmdoYnp1dG9obXRjbHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTgyMCwiZXhwIjoyMDg0NzA1ODIwfQ.QUULsxOisQopm3r5yHfbXjWCMmFDMBcpbgvqd2tHNZo'
)
async function check() {
    // Test the exact query from the page
    console.log('=== Testing activities query ===')
    const { data, error, count } = await supabase
        .from('activities')
        .select('id, type, topic, summary, description, due_date, status, priority, customer_id, owner_id, user_id, assigned_to, created_at, customers(full_name, sales(status)), owner:profiles!activities_owner_id_fkey(full_name)', { count: 'exact' })
        .order('due_date', { ascending: true })
        .limit(5)
    
    console.log('Error:', error?.message, error?.code, error?.details)
    console.log('Count:', count)
    console.log('First result:', data?.[0] ? JSON.stringify(data[0], null, 2).substring(0, 300) : 'NO DATA')

    // Test simpler query
    console.log('\n=== Testing simple activities query ===')
    const { data: d2, error: e2, count: c2 } = await supabase
        .from('activities')
        .select('*', { count: 'exact' })
        .limit(1)
    console.log('Simple Error:', e2?.message)
    console.log('Simple Count:', c2)

    // Test the old working query
    console.log('\n=== Testing old query with wildcard ===')
    const { data: d3, error: e3 } = await supabase
        .from('activities')
        .select('*, customers(full_name, sales(status)), owner:profiles!activities_owner_id_fkey(full_name)')
        .order('due_date', { ascending: true })
        .limit(3)
    console.log('Old Error:', e3?.message)
    console.log('Old Count:', d3?.length)
}
check()
