const { createClient } = require('@supabase/supabase-js')
const { Resend } = require('resend')

const supabase = createClient(
    'https://ncjamvghbzutohmtclwf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jamFtdmdoYnp1dG9obXRjbHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTgyMCwiZXhwIjoyMDg0NzA1ODIwfQ.QUULsxOisQopm3r5yHfbXjWCMmFDMBcpbgvqd2tHNZo'
)

async function createBrokerAccount() {
    const email = 'domainregpro99@gmail.com'
    const fullName = 'Zeki Altın'
    const tempPassword = 'Broker2026!'

    // 1. Create auth user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
            full_name: fullName,
            is_external: true
        }
    })

    if (createError) {
        console.error('Create Error:', createError)
        return
    }

    console.log('User created:', newUser.user.id)

    // 2. Get tenant_id from application
    const { data: app } = await supabase
        .from('broker_applications')
        .select('tenant_id')
        .eq('email', email)
        .single()

    // 3. Update profile
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            role: 'broker',
            tenant_id: app?.tenant_id || '39e06b30-2906-4685-be11-70dd7d395a22',
            full_name: fullName,
            is_active: true,
            is_external: true
        })
        .eq('id', newUser.user.id)

    if (profileError) {
        console.error('Profile Error:', profileError)
        // Try upsert
        await supabase.from('profiles').upsert({
            id: newUser.user.id,
            email,
            role: 'broker',
            tenant_id: app?.tenant_id || '39e06b30-2906-4685-be11-70dd7d395a22',
            full_name: fullName,
            is_active: true,
            is_external: true
        })
    }

    console.log('Profile updated')
    console.log(`\nCredentials:`)
    console.log(`  Email: ${email}`)
    console.log(`  Password: ${tempPassword}`)
}

createBrokerAccount()
