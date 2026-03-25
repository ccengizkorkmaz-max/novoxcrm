const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const dbClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey);

async function check() {
  console.log('Fetching customers...');
  const { data: customers } = await dbClient.from('customers').select('id, full_name').order('created_at', { ascending: false }).limit(5);

  for(const customer of customers) {
      console.log('Found:', customer.full_name);

      // Try to replicate the cleanup logic
      let res = await dbClient.from('activities').delete().eq('customer_id', customer.id);
      res = await dbClient.from('customer_demands').delete().eq('customer_id', customer.id);
      
      const { data: sales } = await dbClient.from('sales').select('id').eq('customer_id', customer.id);
      if (sales && sales.length > 0) {
          const saleIds = sales.map(s => s.id);
          res = await dbClient.from('sales').delete().in('id', saleIds);
      }

      res = await dbClient.from('finance_accounts').delete().eq('customer_id', customer.id);
      console.log('financeAccounts error:', res.error ? JSON.stringify(res.error, null, 2) : 'OK');

      const finalDel = await dbClient.from('customers').delete().eq('id', customer.id);
      if (finalDel.error) {
          console.log('Final DELETE Error on customers:', JSON.stringify(finalDel.error, null, 2));
      } else {
          console.log('Customer correctly deleted.');
      }
      break; // Just do the first one
  }
}

check();
