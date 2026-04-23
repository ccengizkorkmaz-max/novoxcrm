import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // Get ALL projects without any filter, select all columns
    const { data, error } = await supabase.from('projects').select('*').limit(10);
    console.log('Error:', error);
    console.log('Projects:', JSON.stringify(data, null, 2));
}
main();
