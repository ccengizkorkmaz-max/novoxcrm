const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(
    'https://ncjamvghbzutohmtclwf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jamFtdmdoYnp1dG9obXRjbHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTgyMCwiZXhwIjoyMDg0NzA1ODIwfQ.QUULsxOisQopm3r5yHfbXjWCMmFDMBcpbgvqd2tHNZo'
)
async function fix() {
    // Get valid tenant
    const { data: tenants } = await supabase.from('tenants').select('id, name').limit(5)
    console.log('Available tenants:', tenants)

    // Get broker application tenant
    const { data: app } = await supabase.from('broker_applications').select('tenant_id').eq('email', 'domainregpro99@gmail.com').single()
    console.log('App tenant_id:', app?.tenant_id)

    // Fix profile with correct tenant
    if (tenants && tenants.length > 0) {
        const tenantId = app?.tenant_id || tenants[0].id
        const { error } = await supabase.from('profiles').update({
            role: 'broker',
            tenant_id: tenantId,
            full_name: 'Zeki Altın',
            is_active: true,
            is_external: true
        }).eq('id', '5b029c6c-da12-46e1-8dd1-f2f60e0dfea0')

        console.log('Profile update result:', error || 'SUCCESS')
    }
}
fix()
