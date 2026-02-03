const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envPath = '.env.local';
const env = fs.readFileSync(envPath, 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1].trim() || env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1].trim();
const supabase = createClient(url, key);

async function check() {
    const saleId = '9279e716-1729-404e-9371-92c03e6a7ef8'; // From previous output
    console.log('Checking activities for Sale:', saleId);

    // 1. Check raw activity
    const { data: acts, error: actError } = await supabase
        .from('activities')
        .select('*')
        .eq('sale_id', saleId);

    if (actError) console.log('Act Error:', actError);
    else console.log('Activities Found:', JSON.stringify(acts, null, 2));

    if (acts && acts.length > 0) {
        // 2. Check relation with projects
        console.log('Checking project join...');
        const { data: actsWithProj, error: joinError } = await supabase
            .from('activities')
            .select('id, project_id, projects(id, name)')
            .eq('sale_id', saleId);

        if (joinError) {
            console.log('Join Error:', joinError);
        } else {
            console.log('Joined Data:', JSON.stringify(actsWithProj, null, 2));
        }
    }
}
check();
