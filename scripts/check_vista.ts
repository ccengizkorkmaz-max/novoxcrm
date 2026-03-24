import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjects() {
    const { data: projects } = await supabase.from('projects').select('id, name');
    console.log("PROJECTS:");
    projects.forEach(p => console.log(p.id, p.name));

    const { data: sales, error } = await supabase.from('sales').select('id, project_id, description');
    if (error) {
        console.error(error);
        return;
    }

    const counts = {};
    projects.forEach(p => counts[p.id] = { name: p.name, count: 0, fromNull: 0 });
    counts['null'] = { name: 'NULL', count: 0 };

    sales.forEach(s => {
        if (!s.project_id) counts['null'].count++;
        else if (counts[s.project_id]) counts[s.project_id].count++;
        else counts[s.project_id] = { name: 'Unknown', count: 1 };
    });

    console.log("\nSALES COUNTS BY PROJECT:");
    Object.values(counts).forEach((c: any) => console.log(`${c.name}: ${c.count}`));

    // Find any Vista ones that might have been misassigned
    const vistaSales = sales.filter(s => s.description && s.description.toLowerCase().includes('vista'));
    console.log(`\nFound ${vistaSales.length} sales with 'vista' in description.`);
    console.log("Their project assignments are:");
    const vistaCounts = {};
    vistaSales.forEach(s => {
        const pName = counts[s.project_id] ? counts[s.project_id].name : ((s.project_id===null)?'NULL':'Unknown');
        vistaCounts[pName] = (vistaCounts[pName] || 0) + 1;
    });
    console.log(vistaCounts);
}
checkProjects();
