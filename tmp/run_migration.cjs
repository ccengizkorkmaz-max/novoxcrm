const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://ncjamvghbzutohmtclwf.supabase.co',
    'sb_secret_Ml_K9LttVNk3qzlyFxEQlA_B7lBW0HA',
    { db: { schema: 'public' } }
);

async function runMigration() {
    // Use the service role key to execute raw SQL via postgrest
    // Since we can't run DDL via postgrest directly, we'll use a workaround:
    // Call the Supabase SQL API endpoint directly

    const url = 'https://ncjamvghbzutohmtclwf.supabase.co/rest/v1/rpc/';

    // Try direct fetch to the SQL endpoint
    const response = await fetch('https://ncjamvghbzutohmtclwf.supabase.co/pg', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer sb_secret_Ml_K9LttVNk3qzlyFxEQlA_B7lBW0HA',
            'apikey': 'sb_secret_Ml_K9LttVNk3qzlyFxEQlA_B7lBW0HA'
        },
        body: JSON.stringify({
            query: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_external boolean DEFAULT false;'
        })
    });

    if (!response.ok) {
        console.log('Direct SQL endpoint not available, status:', response.status);
        console.log('Trying alternative approach...');

        // Try via Supabase Management API
        const mgmtResponse = await fetch('https://ncjamvghbzutohmtclwf.supabase.co/rest/v1/rpc/exec_sql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sb_secret_Ml_K9LttVNk3qzlyFxEQlA_B7lBW0HA',
                'apikey': 'sb_secret_Ml_K9LttVNk3qzlyFxEQlA_B7lBW0HA'
            },
            body: JSON.stringify({
                sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_external boolean DEFAULT false;'
            })
        });

        console.log('Management API response:', mgmtResponse.status);
        const text = await mgmtResponse.text();
        console.log('Response:', text);
    } else {
        console.log('Success!');
        const result = await response.json();
        console.log(result);
    }

    // Verify
    const { data, error } = await supabase.from('profiles').select('id, full_name, is_external').limit(3);
    if (error) {
        console.log('Verification failed - column still missing:', error.message);
    } else {
        console.log('Verification OK - column exists:', data);
    }
}

runMigration();
