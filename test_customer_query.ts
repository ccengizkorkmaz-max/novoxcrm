import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    console.log('=== TEST CUSTOMER QUERY ===');
    const normalizedPhone = '905337237721';
    const last10 = normalizedPhone.slice(-10);
    console.log('last10:', last10);

    const { data: customer, error } = await supabase.from('customers')
        .select('id, full_name, phone')
        .or(`phone.ilike.%${last10}%`)
        .limit(1)
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Customer:', customer);
    }
}

main().catch(console.error);
