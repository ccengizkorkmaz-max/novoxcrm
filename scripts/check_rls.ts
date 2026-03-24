import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function dumpRLS() {
    const { data: policies } = await supabase.rpc('get_policies'); // Supabase doesn't have this by default
    console.log("Checking if RLS exists");
}
// dumpRLS();
