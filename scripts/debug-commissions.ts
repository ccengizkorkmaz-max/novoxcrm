import { createAdminClient } from '../src/lib/supabase/admin'
import * as fs from 'fs'
import * as path from 'path'

try {
    const envPath = path.resolve(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8')
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=')
            if (key && valueParts.length > 0) {
                process.env[key.trim()] = valueParts.join('=').trim().replace(/^"|"$/g, '')
            }
        })
    }
} catch (e) { }

async function debugCommissions() {
    const supabase = createAdminClient()
    let log = ''

    log += '--- ALL COMMISSION MODELS ---\n'
    const { data: models } = await supabase.from('commission_models').select('*')
    log += `Found ${models?.length || 0} models.\n`
    models?.forEach(m => {
        log += `Model: ${m.name} | TenantID: ${m.tenant_id} | Status: ${m.status}\n`
    })

    log += '\n--- ALL PROFILES ---\n'
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, tenant_id, role')
    profiles?.forEach(p => {
        log += `Profile: ${p.full_name || p.id} | TenantID: ${p.tenant_id} | Role: ${p.role}\n`
    })

    fs.writeFileSync(path.resolve(process.cwd(), 'debug-commissions.log'), log)
    console.log('Log written to debug-commissions.log')
}

debugCommissions()
