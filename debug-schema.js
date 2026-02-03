const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envPath = '.env.local';
const env = fs.readFileSync(envPath, 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1].trim() || env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1].trim();
const supabase = createClient(url, key);

async function check() {
    console.log('Fetching 1 activity to inspect schema...');
    const { data: acts, error } = await supabase
        .from('activities')
        .select('*')
        .limit(1);

    if (error) {
        console.log('Error:', error);
    } else {
        if (acts.length > 0) {
            console.log('Columns:', Object.keys(acts[0]));
        } else {
            console.log('No activities found to inspect.');
        }
    }
}
check();
