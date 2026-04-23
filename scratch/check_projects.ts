import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // Check ALL projects
    const { data: projects } = await supabase.from('projects').select('id, title, name, city, status, tenant_id').limit(20);
    console.log('=== ALL PROJECTS ===');
    console.table(projects);
    
    // Check units
    const { data: units } = await supabase.from('units').select('id, type, price, status, project_id').limit(20);
    console.log('\n=== ALL UNITS ===');
    console.table(units);
}
main();
