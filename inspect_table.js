const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim();
    }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function inspect() {
    const tableName = process.argv[2] || 'activities';
    console.log(`Inspecting ${tableName} table...`);
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    if (error) {
        console.error('Error:', error);
    } else if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
    } else {
        console.log('Table is empty or access denied.');
        // Try to get schema via RPC or just assume it's empty
        const { data: cols, error: colError } = await supabase.rpc('get_table_columns', { table_name: tableName });
        if (!colError && cols) console.log('Columns (from RPC):', cols);
    }
}

inspect();
