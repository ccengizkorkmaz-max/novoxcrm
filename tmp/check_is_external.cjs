const { createClient } = require('@supabase/supabase-js');
const c = createClient(
    'https://ncjamvghbzutohmtclwf.supabase.co',
    'sb_secret_Ml_K9LttVNk3qzlyFxEQlA_B7lBW0HA'
);

async function run() {
    // Check if column already exists
    const { data, error } = await c.from('profiles').select('is_external').limit(1);
    if (error && error.message.includes('is_external')) {
        console.log('Column does not exist yet. Please run the migration SQL in Supabase dashboard.');
    } else {
        console.log('is_external column exists. Current data sample:', data);
    }
}

run();
