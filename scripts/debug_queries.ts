import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCustomers() {
    const { data, error } = await supabase
        .from('customers')
        .select('id, full_name, customer_number, created_at')
        .eq('customer_number', 'C-1124');

    console.log(`C-1124 counts: ${data?.length}`);
    console.log(data?.slice(0, 5));
}

async function debugProjectsMatching() {
    const { data: sales } = await supabase
        .from('sales')
        .select('id, description, tenant_id')
        .is('project_id', null)
        .not('description', 'is', null)
        .limit(10);
        
    console.log("Random descriptions from sales missing project_id:");
    for (const sale of sales) {
        console.log(`- ${sale.description.substring(0, 100).replace(/\n/g, ' ')}...`);
    }
}

checkCustomers();
debugProjectsMatching();
