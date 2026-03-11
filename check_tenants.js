
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.from('tenants').select('*').limit(1).single();
    if (error) {
        console.error('Error fetching tenant:', error);
    } else {
        console.log('Tenant columns:', Object.keys(data));
    }
}

run();
