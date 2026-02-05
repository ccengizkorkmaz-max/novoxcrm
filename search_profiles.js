const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(
    envFile.split('\n')
        .filter(line => line && !line.startsWith('#'))
        .map(line => {
            const [key, ...val] = line.split('=');
            return [key.trim(), val.join('=').trim().replace(/^"(.*)"$/, '$1')];
        })
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .or('full_name.ilike.%Cengiz%,full_name.ilike.%NovoTeam%,email.ilike.%novoteam%');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Found Profiles:');
    console.table(data);
}

checkProfiles();
