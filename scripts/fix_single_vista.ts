import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSingleError() {
    const izmirId = 'c598e37a-bd02-47e6-9bf5-4ccc1e168f37';
    const vistaId = '366093a6-2f2e-41b5-9677-ce07fb3d9b5a';
    
    const { data: sales } = await supabase.from('sales')
        .select('id, description')
        .eq('project_id', izmirId)
        .ilike('description', '%vista%');

    if (sales && sales.length > 0) {
        console.log("Found the mistakenly assigned sale:", sales[0].description);
        await supabase.from('sales').update({ project_id: vistaId }).eq('id', sales[0].id);
        console.log("Fixed its project_id to VISTA");
    } else {
        console.log("No mistaken Vista sale found in Izmir project.");
    }
}
fixSingleError();
