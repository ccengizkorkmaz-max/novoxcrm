const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function exec() {
    console.log("Fetching sales...");
    const { data: allSales, error } = await supabase
        .from('sales')
        .select('id, customer_id, unit_id, created_at, assigned_to')
        .not('unit_id', 'is', null);
        
    if (error) return console.error(error);
    
    const groups = {};
    for (let s of allSales) {
        const k = s.customer_id + '_' + s.unit_id;
        if (!groups[k]) groups[k] = [];
        groups[k].push(s);
    }
    
    let toDelete = [];
    let countDuplicatesFound = 0;
    
    for (let k in groups) {
        if (groups[k].length > 1) {
            countDuplicatesFound++;
            // Sort by assigned_to (having one is better), then oldest created_at
            const sorted = groups[k].sort((a, b) => {
                if (a.assigned_to && !b.assigned_to) return -1;
                if (!a.assigned_to && b.assigned_to) return 1;
                return new Date(a.created_at) - new Date(b.created_at);
            });
            // Keep the first (best), delete the rest
            toDelete.push(...sorted.slice(1).map(s => s.id));
        }
    }
    
    console.log('Total sales mapped with units:', allSales.length);
    console.log('Total unique pairs with dupes:', countDuplicatesFound);
    console.log('Total duplicate entries to delete:', toDelete.length);
    
    if (toDelete.length > 0) {
        // Splice toDelete into chunks of 100
        for (let i = 0; i < toDelete.length; i += 100) {
            const chunk = toDelete.slice(i, i + 100);
            const res = await supabase.from('sales').delete().in('id', chunk);
            console.log('Deleted chunk of size:', chunk.length, res.error ? 'Error: ' + res.error.message : 'OK');
        }
        console.log('Deduplication finished successfully!');
    }
}

exec();
