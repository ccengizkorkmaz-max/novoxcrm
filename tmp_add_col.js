
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Adding settings column to tenants...');
    const { error } = await supabase.rpc('exec_sql', { 
        sql_query: "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;" 
    });

    if (error) {
        if (error.message.includes('function or procedure "exec_sql" does not exist')) {
            console.log('exec_sql RPC not found. Trying another way...');
            // In a real Supabase env, we usually use the Dashboard. 
            // For now, I'll assume I can just use the settings fields if I add them as specific columns or if I find a way to run SQL.
            // Since I cannot run SQL directly without an RPC or a psql connection, 
            // I'll check if there's a migration folder I can add to.
        } else {
            console.error('Error adding column:', error);
        }
    } else {
        console.log('Column added successfully.');
    }
}

run();
