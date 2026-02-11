import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read .env.local for Supabase credentials
const envPath = path.resolve(__dirname, '../.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) envVars[key.trim()] = value.trim()
})

const supabase = createClient(
    envVars['NEXT_PUBLIC_SUPABASE_URL'],
    envVars['SUPABASE_SERVICE_ROLE_KEY'] // Use service role to bypass RLS
)

async function checkTenants() {
    const { data, error } = await supabase
        .from('tenants')
        .select('id, name, gemini_api_key, is_gemini_enabled')

    if (error) {
        console.error('Error fetching tenants:', error)
        return
    }

    console.log('--- Tenants AI Config ---')
    data.forEach(t => {
        const masked = t.gemini_api_key
            ? t.gemini_api_key.substring(0, 10) + '...'
            : 'NULL'
        console.log(`Tenant: ${t.name || t.id}`)
        console.log(`  Gemini Key: ${masked}`)
        console.log(`  Enabled: ${t.is_gemini_enabled}`)
    })
}

checkTenants()
