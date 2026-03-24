import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVistaStatus() {
    const { data: project } = await supabase.from('projects')
        .select('*')
        .ilike('name', '%VISTA%');
        
    console.log("Vista Project info:", JSON.stringify(project, null, 2));

    const { data: recentSales } = await supabase.from('sales')
        .select('id, created_at, status, description')
        .eq('project_id', project[0].id)
        .order('created_at', { ascending: false })
        .limit(3);
    console.log("\nRecent Vista Sales:", JSON.stringify(recentSales, null, 2));
}

checkVistaStatus();
