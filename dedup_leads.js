const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function exec() {
    console.log("Fetching all open sales...");
    
    let allSales = [];
    let hasMore = true;
    let page = 0;
    const PAGE_SIZE = 1000;
    
    while (hasMore) {
        const { data, error } = await supabase
            .from('sales')
            .select(`
                id, 
                customer_id, 
                project_id, 
                unit_id, 
                status,
                created_at, 
                assigned_to,
                customers ( full_name, customer_number )
            `)
            .in('status', ['Lead', 'Prospect', 'Inbox', 'Proposal', 'Negotiation'])
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
            
        if (error) {
            console.error("Fetch error:", error);
            break;
        }
        
        allSales = allSales.concat(data);
        if (data.length < PAGE_SIZE) {
            hasMore = false;
        } else {
            page++;
        }
    }
    
    // Group sales by exact matching customer + project + unit
    const groups = {};
    for (let s of allSales) {
        if (!s.customer_id) continue;
        
        // Grouping key: Customer ID + Project ID + Unit ID
        const pId = s.project_id || 'no-project';
        const uId = s.unit_id || 'no-unit';
        const k = `${s.customer_id}_${pId}_${uId}`;
        
        if (!groups[k]) groups[k] = [];
        groups[k].push(s);
    }
    
    let toDelete = [];
    let countDuplicatesFound = 0;
    
    for (let k in groups) {
        if (groups[k].length > 1) {
            countDuplicatesFound++;
            
            // Sort to decide which one to keep
            const sorted = groups[k].sort((a, b) => {
                // Priority 1: Has an assigned user (assigned_to != null)
                if (a.assigned_to && !b.assigned_to) return -1;
                if (!a.assigned_to && b.assigned_to) return 1;
                
                // Priority 2: Older creation date (the original lead)
                return new Date(a.created_at) - new Date(b.created_at);
            });
            
            // The first one is kept, the rest are deleted
            toDelete.push(...sorted.slice(1).map(s => s.id));
        }
    }
    
    console.log('\n--- SUMMARY ---');
    console.log('Total open leads evaluated:', allSales.length);
    console.log('Total distinct duplicate clusters found:', countDuplicatesFound);
    console.log('Total overlapping duplicate records to delete:', toDelete.length);
    
    if (toDelete.length > 0) {
        console.log("Proceeding with deletion...");
        let deletedCount = 0;
        // Splice toDelete into chunks of 100
        for (let i = 0; i < toDelete.length; i += 100) {
            const chunk = toDelete.slice(i, i + 100);
            const res = await supabase.from('sales').delete().in('id', chunk);
            if (res.error) {
                console.error('Error deleting chunk:', res.error);
            } else {
                deletedCount += chunk.length;
            }
        }
        console.log(`Deduplication finished successfully! Deleted ${deletedCount} records.`);
    } else {
        console.log('No duplicates found. The system is clean!');
    }
}

exec();
