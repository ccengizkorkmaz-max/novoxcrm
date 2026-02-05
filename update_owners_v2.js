const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env.local manually
let env = {};
try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    env = Object.fromEntries(
        envFile.split('\n')
            .filter(line => line && !line.startsWith('#'))
            .map(line => {
                const [key, ...val] = line.split('=');
                return [key.trim(), val.join('=').trim().replace(/^"(.*)"$/, '$1')];
            })
    );
} catch (e) {
    console.error('Could not read .env.local');
    process.exit(1);
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const OLD_OWNER_ID = '60925a94-8539-484d-843d-a11ae0e00ddd'; // Cengiz Korkmaz
const NEW_OWNER_ID = '927a0ddc-4ad1-4957-a1e1-adf5f4eb167e'; // NovoTeam

async function updateOwners() {
    console.log('Starting update...');

    // 1. Update Activities
    console.log('Updating Activities...');
    const { data: actData, error: actError, count: actCount } = await supabase
        .from('activities')
        .update({ owner_id: NEW_OWNER_ID })
        .eq('owner_id', OLD_OWNER_ID)
        .select('id', { count: 'exact' });

    if (actError) {
        console.error('Error updating activities:', actError);
    } else {
        console.log(`Updated ${actCount} activities records.`);
    }

    // 2. Update Sales
    console.log('Updating Sales...');
    const { data: saleData, error: saleError, count: saleCount } = await supabase
        .from('sales')
        .update({ assigned_to: NEW_OWNER_ID })
        .eq('assigned_to', OLD_OWNER_ID)
        .select('id', { count: 'exact' });

    if (saleError) {
        console.error('Error updating sales:', saleError);
    } else {
        console.log(`Updated ${saleCount} sales records.`);
    }
}

updateOwners();
