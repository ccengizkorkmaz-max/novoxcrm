import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReal() {
    const { data: sales, error } = await supabase.from('sales').select('id, project_id, description, tenant_id');
    // Supabase JS defaults to 1000 limit. We need to paginate to get all.
    let allSales = [];
    let page = 0;
    while(true) {
        const { data, error } = await supabase.from('sales').select('id, project_id, description, status, created_at').range(page*1000, (page+1)*1000-1);
        if (data && data.length > 0) {
            allSales.push(...data);
            page++;
        } else {
            break;
        }
    }
    
    console.log("Total sales:", allSales.length);

    const { data: projects } = await supabase.from('projects').select('id, name');
    const pMap = {};
    projects.forEach(p => pMap[p.id] = p.name);

    const counts = {};
    projects.forEach(p => counts[p.id] = 0);
    let nullCount = 0;
    
    // recent null project ids
    let recentNull = 0;

    allSales.forEach(s => {
        if (!s.project_id) {
            nullCount++;
        } else {
            counts[s.project_id] = (counts[s.project_id] || 0) + 1;
        }
    });

    Object.keys(counts).forEach(pid => {
        console.log(`${pMap[pid]}: ${counts[pid]}`);
    });
    console.log("NULL:", nullCount);
}
checkReal();
