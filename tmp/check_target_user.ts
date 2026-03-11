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

async function checkUser() {
    // Search auth users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
        console.error(authError)
        return
    }

    const targetUser = users.find(u => u.email === 'bunyamin.sarac@novosirketlergrubu.com')

    if (!targetUser) {
        console.log("User not found in Auth")
        return
    }

    console.log("Auth User Info:")
    console.log(JSON.stringify(targetUser, null, 2))

    // Check profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUser.id)
        .single()

    console.log("\nProfile Info:")
    console.log(JSON.stringify(profile, null, 2))
}

checkUser()
