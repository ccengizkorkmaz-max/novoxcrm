import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data, error } = await supabase.from('tenants').select('id, name, is_gemini_enabled, gemini_api_key, ai_api_key, ai_provider').limit(10);
    console.log(data);
}
main();
