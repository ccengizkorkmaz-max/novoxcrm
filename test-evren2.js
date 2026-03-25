const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const filterSearch = "Evren";
  
  // 1. Build Base Query
  let query = supabase
    .from('customers')
    .select('*, customer_demands(*), contract_customers(id)', { count: 'exact' });
  
  // 2. Add search just like customers/page.tsx
  if (filterSearch) {
    query = query.or(`full_name.ilike.%${filterSearch}%,phone.ilike.%${filterSearch}%,email.ilike.%${filterSearch}%`)
  }

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(0, 49);

  if (error) console.error("Error:", error);
  console.log("Count exact:", count);
  console.log("Data length:", data?.length);

  if (data && data.length > 0) {
    console.log("First Match name:", data[0].full_name);
    console.log("Tenant:", data[0].tenant_id);
  }
}

check();
