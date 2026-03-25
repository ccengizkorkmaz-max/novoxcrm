const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .ilike('full_name', '%Evren Turan%');

  console.log("Customer Records Found:", customer?.length);
  if (customer && customer.length > 0) {
    console.log("Customer ID:", customer[0].id);
    console.log("Tenant ID:", customer[0].tenant_id);
    console.log("Created At:", customer[0].created_at);
  }
}

check();
