
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function testSql() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envConfig.split(/\r?\n/).forEach(line => {
        const [key, ...rest] = line.split('=');
        if (key && rest) env[key.trim()] = rest.join('=').trim();
    });

    const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

    console.log('Testing RPC exec_sql...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' });

    if (error) {
        console.error('exec_sql RPC not found or failed:', error.message);
    } else {
        console.log('exec_sql RPC found! Data:', data);
    }
}

testSql();
