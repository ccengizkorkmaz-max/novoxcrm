const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) process.env[key.trim()] = value.trim();
        });
    }
}

loadEnv();

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listAll() {
    const { data, error } = await s.rpc('get_tables'); // unlikely
    if (error) {
        // Try a common table and see if it works
        const { data: prof, error: perr } = await s.from('profiles').select('id').limit(1);
        console.log('Profiles check:', perr ? perr.message : 'Working');

        const { data: notif, error: nerr } = await s.from('system_notifications').select('id').limit(1);
        console.log('system_notifications check:', nerr ? nerr.message : 'Working');
    }
}
listAll();
