
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Manually parse .env.local
const envPath = path.resolve(__dirname, '.env.local')
const envConfig = fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .reduce((acc, line) => {
        const [key, value] = line.split('=')
        if (key && value) {
            acc[key.trim()] = value.trim().replace(/"/g, '') // Remove quotes
        }
        return acc
    }, {})

const supabaseUrl = envConfig['NEXT_PUBLIC_SUPABASE_URL']
const supabaseKey = envConfig['NEXT_PUBLIC_SUPABASE_ANON_KEY'] // Using anon key is fine for public profile read if policies allow, but better use service role if possible for admin check. 
// Actually, profiles table typically allows read for authenticated. The script is running locally.
// If I need service role, I should look for SUPABASE_SERVICE_ROLE_KEY or typically just proceed with anon if I can't find it, but for admin tasks service role is better.
// Let's check if there is a service role key in parsed env, if not use anon.
const supabaseServiceKey = envConfig['SUPABASE_SERVICE_ROLE_KEY'] || supabaseKey

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase credentials not found in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkRoles() {
    const emails = ['burak.kotaman@novosirketlergrubu.com', 'cengizk@btproses.com']

    console.log('Querying roles for:', emails)

    const { data, error } = await supabase
        .from('profiles')
        .select('email, role, full_name')
        .in('email', emails)

    if (error) {
        console.error('Error fetching profiles:', error)
    } else {
        console.log('Results:')
        data.forEach(profile => {
            console.log(`User: ${profile.full_name}, Email: ${profile.email}, Role: ${profile.role}`)
        })
    }
}

checkRoles()
