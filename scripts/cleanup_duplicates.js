const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const TENANT_ID = '89b2829e-fc21-477e-8fd8-9f9f0c587e81';
const DRY_RUN = false;
const BATCH_SIZE = 1000;
const CONCURRENCY = 20; // Process 20 groups in parallel

// --- LOAD ENVIRONMENT ---
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
    envContent.split('\n')
        .filter(line => line.includes('='))
        .map(line => line.split('=').map(s => s.trim()))
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function standardizeTRPhone(input) {
    if (!input) return null;
    let digits = String(input).replace(/\D/g, '');
    if (digits.length === 10 && digits.startsWith('5')) return digits;
    if (digits.length === 11 && digits.startsWith('05')) return digits.substring(1);
    if (digits.length === 12 && digits.startsWith('905')) return digits.substring(2);
    if (digits.length >= 13 && digits.includes('905')) {
        const index = digits.indexOf('5');
        if (index !== -1 && digits.substring(index).length === 10) return digits.substring(index);
    }
    if (digits.length === 10) return digits;
    return null;
}

async function fetchAllCustomers() {
    let all = [];
    let from = 0;
    let to = BATCH_SIZE - 1;
    let finished = false;

    console.log('Fetching all customers in batches...');
    while (!finished) {
        const { data, error } = await supabase
            .from('customers')
            .select('id, phone, full_name, created_at, source')
            .eq('tenant_id', TENANT_ID)
            .range(from, to)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Fetch Error:', error);
            break;
        }

        if (data.length === 0) {
            finished = true;
        } else {
            all = all.concat(data);
            console.log(`Fetched ${all.length} customers...`);
            from += BATCH_SIZE;
            to += BATCH_SIZE;
            if (data.length < BATCH_SIZE) finished = true;
        }
    }
    return all;
}

async function processGroup(phone, members) {
    members.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const survivor = members[0];
    const redundants = members.slice(1);

    let merges = 0;
    let deletions = 0;

    for (const redundant of redundants) {
        if (!DRY_RUN) {
            // Parallelize inner moves too
            await Promise.all([
                supabase.from('activities').update({ customer_id: survivor.id }).eq('customer_id', redundant.id),
                supabase.from('sales').update({ customer_id: survivor.id }).eq('customer_id', redundant.id).then(({ error }) => {
                    if (error && error.code === '23505') return supabase.from('sales').delete().eq('customer_id', redundant.id);
                }),
                supabase.from('customer_demands').update({ customer_id: survivor.id }).eq('customer_id', redundant.id).then(({ error }) => {
                    if (error && error.code === '23505') return supabase.from('customer_demands').delete().eq('customer_id', redundant.id);
                })
            ]);

            const { error: delError } = await supabase.from('customers').delete().eq('id', redundant.id);
            if (!delError) deletions++;
        }
        merges++;
    }
    return { merges, deletions };
}

async function cleanup() {
    console.log(`Starting cleanup for Tenant: ${TENANT_ID} (Dry Run: ${DRY_RUN}, Concurrency: ${CONCURRENCY})`);

    const allCustomers = await fetchAllCustomers();
    console.log(`Final total to process: ${allCustomers.length}`);

    const groups = new Map();
    allCustomers.forEach(c => {
        const std = standardizeTRPhone(c.phone);
        if (!std) return;
        if (!groups.has(std)) groups.set(std, []);
        groups.get(std).push(c);
    });

    const duplicateGroups = Array.from(groups.entries()).filter(([_, members]) => members.length > 1);
    console.log(`Found ${duplicateGroups.length} groups with duplicates.`);

    let totalMerges = 0;
    let totalDeletions = 0;
    let processedGroups = 0;

    // Process in chunks of CONCURRENCY
    for (let i = 0; i < duplicateGroups.length; i += CONCURRENCY) {
        const chunk = duplicateGroups.slice(i, i + CONCURRENCY);
        const results = await Promise.all(chunk.map(([phone, members]) => processGroup(phone, members)));

        results.forEach(res => {
            totalMerges += res.merges;
            totalDeletions += res.deletions;
        });

        processedGroups += chunk.length;
        if (processedGroups % 100 === 0 || processedGroups === duplicateGroups.length) {
            console.log(`Processed ${processedGroups}/${duplicateGroups.length} duplicate groups...`);
        }
    }

    console.log(`\n--- Summary ---`);
    console.log(`Groups Processed: ${duplicateGroups.length}`);
    console.log(`Total Records Merged: ${totalMerges}`);
    if (!DRY_RUN) {
        console.log(`Total Records Deleted: ${totalDeletions}`);
    }
}

cleanup();
