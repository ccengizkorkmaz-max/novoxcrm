const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(
    'https://ncjamvghbzutohmtclwf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jamFtdmdoYnp1dG9obXRjbHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTgyMCwiZXhwIjoyMDg0NzA1ODIwfQ.QUULsxOisQopm3r5yHfbXjWCMmFDMBcpbgvqd2tHNZo'
)
async function check() {
    // 1. Check if user exists in auth
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const user = users?.find(u => u.email === 'domainregpro99@gmail.com')
    
    if (user) {
        console.log('User FOUND in auth:')
        console.log(`  ID: ${user.id}`)
        console.log(`  Email: ${user.email}`)
        console.log(`  Created: ${user.created_at}`)
        console.log(`  Confirmed: ${user.email_confirmed_at}`)
    } else {
        console.log('User NOT FOUND in auth - Supabase cannot send reset email to non-existent user')
    }

    // 2. Check broker application
    const { data: app } = await supabase
        .from('broker_applications')
        .select('*')
        .eq('email', 'domainregpro99@gmail.com')
        .single()
    
    if (app) {
        console.log('\nBroker Application:')
        console.log(`  Name: ${app.full_name}`)
        console.log(`  Status: ${app.status}`)
        console.log(`  Processed: ${app.processed_at}`)
    }
}
check()
