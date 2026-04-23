import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const newKey = "AIzaSyAXeR_rvaozeb7E_l772keF1WsuAZWk9vE";
    
    // Update the tenant's api key
    const { data, error } = await supabase.from('tenants').update({ gemini_api_key: newKey }).not('name', 'is', null).select('name');
    
    if (error) {
        console.error('Failed to update:', error.message);
    } else {
        console.log('Successfully updated API key for tenants:', data);
    }
}
main();
