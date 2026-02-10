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

async function listTables() {
    // Try to use a common view or table to see if anything is there
    const { data, error } = await s.from('profiles').select('id').limit(1);
    console.log('Profiles check:', error ? error.message : 'OK');

    // List all tables using standard SQL query if rpc fails
    const { data: tables, error: tablesError } = await s.rpc('get_tables_info'); // unlikely to exist
    if (tablesError) {
        // Fallback: try to select from a non-existent table to get the hint again or use postgres catalog
        const { error: catalogError } = await s.from('pg_tables').select('*').limit(1); // will fail but maybe hint
        console.log('Tables search started...');
    }
}
listTables();
