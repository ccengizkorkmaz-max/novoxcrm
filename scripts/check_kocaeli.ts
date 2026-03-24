import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkKocaeli() {
    const kocaeliId = '8b5c1a91-0bd4-411d-a142-ba61dee2e83d';
    let allSales = [];
    let page = 0;
    while(true) {
        const { data, error } = await supabase.from('sales').select('id, description, project_id, status').eq('project_id', kocaeliId).range(page*1000, (page+1)*1000-1);
        if (data && data.length > 0) {
            allSales.push(...data);
            page++;
        } else {
            break;
        }
    }
    
    console.log(`NOVO PARK 4 KOCAELI has ${allSales.length} sales.`);
    
    const vistaMention = allSales.filter(s => s.description && s.description.toLowerCase().includes('vista'));
    console.log(`How many have "vista" in their description? ${vistaMention.length}`);
    
    const noVista = allSales.filter(s => s.description && !s.description.toLowerCase().includes('vista') && s.description.toLowerCase().includes('novo park'));
    console.log(`How many have "novo park" but NOT vista? ${noVista.length}`);

    if (noVista.length > 0) {
        console.log("Samples of those descriptions:");
        noVista.slice(0, 3).forEach(s => console.log(s.description));
    }
}
checkKocaeli();
