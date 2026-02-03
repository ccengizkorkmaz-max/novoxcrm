const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function check() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing env vars');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('--- Last 5 Customers ---');
    const { data: customers, error: cErr } = await supabase
        .from('customers')
        .select('id, full_name, email, tenant_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (cErr) console.error(cErr);
    else console.table(customers);

    console.log('\n--- Last 5 Sales ---');
    const { data: sales, error: sErr } = await supabase
        .from('sales')
        .select('id, customer_id, status, tenant_id, description, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (sErr) console.error(sErr);
    else console.table(sales);

    console.log('\n--- Tenants ---');
    const { data: tenants } = await supabase.from('tenants').select('id, name');
    console.table(tenants);
}

check();
