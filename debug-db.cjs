const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Manually parse .env.local
const envPath = path.join(__dirname, '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) env[key.trim()] = value.trim()
})

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debug() {
    console.log('--- Auth Users ---')
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) console.error(authError)
    else users.forEach(u => console.log(`${u.id} | ${u.email} | Confirmed: ${!!u.email_confirmed_at}`))

    console.log('\n--- Profiles ---')
    const { data: profiles, error: profError } = await supabase.from('profiles').select('*')
    if (profError) console.error(profError)
    else (profiles || []).forEach(p => console.log(`${p.id} | ${p.email} | Tenant: ${p.tenant_id} | Role: ${p.role}`))

    console.log('\n--- Tenants ---')
    const { data: tenants, error: tenError } = await supabase.from('tenants').select('*')
    if (tenError) console.error(tenError)
    else (tenants || []).forEach(t => console.log(`${t.id} | ${t.name}`))
}

debug()
