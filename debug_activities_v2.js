const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env.local manually
let env = {};
try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    env = Object.fromEntries(
        envFile.split('\n')
            .filter(line => line && !line.startsWith('#'))
            .map(line => {
                const [key, ...val] = line.split('=');
                return [key.trim(), val.join('=').trim().replace(/^"(.*)"$/, '$1')];
            })
    );
} catch (e) {
    console.error('Could not read .env.local');
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugActivities() {
    console.log('--- Checking Profiles ---');
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .or('full_name.ilike.%Cengiz%,full_name.ilike.%NovoTeam%');
    console.table(profiles);

    const cengizProfile = profiles.find(p => p.full_name.includes('Cengiz Korkmaz'));
    const novoTeamProfile = profiles.find(p => p.full_name.includes('NovoTeam'));

    if (cengizProfile) {
        console.log(`\n--- Checking Activities still owned by Cengiz (${cengizProfile.id}) ---`);
        const { count, data } = await supabase
            .from('activities')
            .select('id, summary, owner_id', { count: 'exact' })
            .eq('owner_id', cengizProfile.id)
            .limit(5);

        console.log(`Count: ${count}`);
        if (data && data.length > 0) {
            console.log('Sample activities still owned by Cengiz:');
            console.table(data);
        } else {
            console.log('No activities found with Cengizs ID.');
        }
    }

    if (novoTeamProfile) {
        console.log(`\n--- Checking Activities owned by NovoTeam (${novoTeamProfile.id}) ---`);
        const { count } = await supabase
            .from('activities')
            .select('id', { count: 'exact' })
            .eq('owner_id', novoTeamProfile.id);
        console.log(`Count: ${count}`);
    }
}

debugActivities();
