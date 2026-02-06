const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envFile.split('\n').filter(line => line.includes('=')).map(line => line.split('=')));

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase.rpc('get_table_columns', { table_name_param: 'deposits' });

    if (error) {
        // Fallback: raw query if RPC doesn't exist
        const { data: cols, error: queryError } = await supabase.from('deposits').select('*').limit(1);
        if (queryError) {
            console.error('Error fetching columns:', queryError);
        } else if (cols && cols.length > 0) {
            console.log('Columns found in a record:', Object.keys(cols[0]));
        } else {
            const { data: infoCols, error: infoError } = await supabase.rpc('get_columns_info', { t_name: 'deposits' });
            console.log('Columns (fallback):', infoCols || 'No data');
        }
    } else {
        console.log('Columns:', data);
    }
}

// Simplified version using information_schema via raw query since I have service role
async function checkSchemaRaw() {
    const { data, error } = await supabase.from('profiles').select('id').limit(1); // test connection
    if (error) {
        console.error('Connection error:', error);
        return;
    }

    // Try to get one record to see keys
    const { data: records, error: recError } = await supabase.from('deposits').select('*').limit(1);
    if (records && records.length > 0) {
        console.log('Sample record keys:', Object.keys(records[0]));
        console.log('Sample record details:', records[0]);
    } else {
        console.log('No records in deposits table yet.');
        // Try another way to get columns
        const { data: colInfo, error: colError } = await supabase.rpc('inspect_table', { table_name: 'deposits' });
        console.log('Table info:', colInfo || colError);
    }
}

checkSchemaRaw();
