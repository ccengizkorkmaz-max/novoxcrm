require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkConnection() {
  const { count: customersCount, error: cErr } = await supabase.from('customers').select('*', { count: 'exact', head: true });
  const { count: leadsCount, error: lErr } = await supabase.from('leads').select('*', { count: 'exact', head: true });
  
  if (cErr) console.error('Error fetching customers count', cErr);
  if (lErr) console.error('Error fetching leads count', lErr);

  console.log(`Customers Table Count: ${customersCount}`);
  console.log(`Leads Table Count: ${leadsCount}`);
}

checkConnection().catch(console.error);
