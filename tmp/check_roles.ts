import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf-8')
const env: Record<string, string> = {}
envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=')
    if (key && val.length > 0) {
        env[key.trim()] = val.join('=').trim()
    }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function checkRoles() {
    const { data: profiles } = await supabase.from('profiles').select('role')
    const roles = Array.from(new Set(profiles?.map(p => p.role)))
    console.log("Unique Roles in Profiles table:")
    console.log(roles)
}

checkRoles()
