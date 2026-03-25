const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const dbClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey);

async function testDelete() {
  const { data: customer } = await dbClient.from('customers').select('id, full_name').ilike('full_name', '%JULIEN%').single();
  
  if (!customer) {
      console.log('Customer not found');
      return;
  }
  
  console.log('Found:', customer);
  const { error } = await dbClient.from('customers').delete().eq('id', customer.id);
  console.log('Delete result error json: ' + JSON.stringify(error, null, 2));
}

testDelete();
