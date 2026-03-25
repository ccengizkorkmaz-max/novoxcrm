const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const dbClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey);

async function check() {
  console.log('Fetching customers...');
  const { data: customer } = await dbClient.from('customers').select('id, full_name').ilike('full_name', '%şeyma%').single();

  if(!customer) { console.log('not found'); return; }

  console.log('Found:', customer.full_name);

  // Exact deletion log to see the constraint
  const finalDel = await dbClient.from('customers').delete().eq('id', customer.id);
  if (finalDel.error) {
      console.log('Final DELETE Error on customers:', JSON.stringify(finalDel.error, null, 2));
  } else {
      console.log('Customer correctly deleted.');
  }
}

check();
