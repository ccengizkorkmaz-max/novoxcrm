const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envPath = '.env.local';
if (!fs.existsSync(envPath)) {
    console.error('.env.local not found');
    process.exit(1);
}

const env = fs.readFileSync(envPath, 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/) || env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

if (!urlMatch || !keyMatch) {
    console.error('Keys not found in .env.local');
    process.exit(1);
}

const url = urlMatch[1].trim();
const key = keyMatch[1].trim();
console.log('Connecting to:', url);
console.log('Using Key:', key.substring(0, 10) + '...');

const supabase = createClient(url, key);

async function check() {
    console.log('--- Fetching Last 5 Sales ---');
    const { data: sales, error } = await supabase
        .from('sales')
        .select(`
            id, 
            created_at, 
            unit_id, 
            customer_id, 
            tenant_id, 
            status,
            customers(full_name),
            activities(id, type, description)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching sales:', error);
    } else {
        console.log(JSON.stringify(sales, null, 2));
    }

    console.log('--- Fetching Julien Martin ---');
    const { data: customers } = await supabase
        .from('customers')
        .select('id, full_name')
        .ilike('full_name', '%Julien%');

    console.log('Customers Found:', customers);

    if (customers && customers.length > 0) {
        const custId = customers[0].id;
        console.log('Checking Sales for Customer:', custId);
        const { data: customerSales } = await supabase
            .from('sales')
            .select('*')
            .eq('customer_id', custId);
        console.log('Sales for Julien:', JSON.stringify(customerSales, null, 2));
    }
}

check();
