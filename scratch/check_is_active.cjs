const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(
    'https://ncjamvghbzutohmtclwf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jamFtdmdoYnp1dG9obXRjbHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTgyMCwiZXhwIjoyMDg0NzA1ODIwfQ.QUULsxOisQopm3r5yHfbXjWCMmFDMBcpbgvqd2tHNZo'
)
async function check() {
    // Check is_active values
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, is_active')
        .limit(20)
    console.log('Error:', error?.message)
    console.log('Profiles is_active values:')
    data?.forEach(p => console.log(`  ${p.full_name} | role=${p.role} | is_active=${p.is_active}`))
    
    // Count with filter
    const { count: withActive } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
    console.log(`\nProfiles with is_active=true: ${withActive}`)

    const { count: total } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
    console.log(`Total profiles: ${total}`)
}
check()
