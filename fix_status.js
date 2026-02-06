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

async function fixStatus() {
    console.log('Searching for Can Ergül...');

    // 1. Find Customer using full_name
    const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select('id, full_name')
        .ilike('full_name', '%Can%')
        .ilike('full_name', '%Ergül%');

    if (customerError) {
        console.error('Error finding customer:', customerError);
        return;
    }

    if (!customers || customers.length === 0) {
        console.log('Customer not found.');
        return;
    }

    const customer = customers[0];
    console.log(`Found customer: ${customer.full_name} (${customer.id})`);

    // 2. Find Sales Record
    const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('id, status')
        .eq('customer_id', customer.id);

    if (salesError) {
        console.error('Error finding sales:', salesError);
        return;
    }

    if (!sales || sales.length === 0) {
        console.log('No sales record found for this customer.');
        return;
    }

    const sale = sales[0];
    console.log(`Found sale: ${sale.id} with status: ${sale.status}`);

    // 3. Update Status
    const { error: updateError } = await supabase
        .from('sales')
        .update({ status: 'Lead' })
        .eq('id', sale.id);

    if (updateError) {
        console.error('Error updating sale:', updateError);
    } else {
        console.log('Successfully updated status to Lead.');
    }
}

fixStatus();
