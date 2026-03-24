import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVista() {
    const { data: sales, error } = await supabase
        .from('sales')
        .select('id, description, project_id')
        .ilike('description', '%vista%');
        
    if (error) { console.error(error); return; }

    const { data: projects } = await supabase.from('projects').select('id, name');
    const pMap = {};
    projects.forEach(p => pMap[p.id] = p.name);

    console.log(`Found ${sales.length} sales with 'vista' in description.`);

    const countMap = {};
    sales.forEach(s => {
        const pName = s.project_id ? pMap[s.project_id] : 'NULL';
        countMap[pName] = (countMap[pName] || 0) + 1;
    });

    console.log(countMap);
}
checkVista();
