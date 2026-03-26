require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.from('information_schema.tables').select('table_name').eq('table_schema', 'public').ilike('table_name', '%log%');

  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Log tables:', data);
  require('fs').writeFileSync('burak.json', JSON.stringify(data, null, 2));
  console.log('Saved to burak.json');
}

check();
