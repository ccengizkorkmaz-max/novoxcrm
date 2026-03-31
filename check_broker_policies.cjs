require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBrokerRLS() {
    // We can simulate an insert with user's JWT instead of service role!
    // Or we can just insert with service role and check if RLS blocks regular users by reviewing policies?
    // Let's create an event log to see what the exact error is when using their token!
    
    // There is no easy way to get their JWT without signing in.
    // Instead we can query pg_policies using service_role!
    const { data: policies, error: polErr } = await supabase
        .from('pg_policies') // Supabase exposes pg_policies sometimes, if not it'll fail
        .select('*');
        
    if (polErr) {
        // If we can't select from pg_policies via restful API, we can just use Postgres function
        console.log('Cant select pg_policies via API directly', polErr);
    } else {
        const blPolicies = policies.filter(p => p.tablename === 'broker_leads');
        fs.writeFileSync('broker_leads_policies.json', JSON.stringify(blPolicies, null, 2));
        console.log('Policies written');
    }
}

checkBrokerRLS().catch(console.error);
