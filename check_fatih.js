require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.rpc('get_schema_info');
  // or query Postgres directly
  const { data: cols } = await supabase.from('information_schema.table_constraints').select('*').eq('table_name', 'customers').eq('constraint_type', 'UNIQUE');
  console.log('Unique constraints on customers:', cols);
}

check();
