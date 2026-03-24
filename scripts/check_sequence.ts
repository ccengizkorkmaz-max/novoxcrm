import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSequenceAndCustomers() {
    // Let's get the max customer number in db
    const { data: maxNum } = await supabase
        .from('customers')
        .select('customer_number')
        .order('customer_number', { ascending: false })
        .limit(5);
    
    console.log("Highest customer numbers:", maxNum);

    // Let's fetch customers created today and their numbers
    const { data: recent } = await supabase
        .from('customers')
        .select('id, full_name, customer_number, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

    console.log("Recent customers:", recent.map(r => `${r.full_name} -> ${r.customer_number}`));
}

testSequenceAndCustomers();
