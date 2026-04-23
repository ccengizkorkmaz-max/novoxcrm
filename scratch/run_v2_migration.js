require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function run() {
  const sql = fs.readFileSync('supabase/migrations/20260423_whatsapp_inbox_v2.sql', 'utf8');
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
    console.error('RPC Error:', error.message);
    // Try individual statements
    const statements = sql.split(';').filter(s => s.trim().length > 5);
    for (const stmt of statements) {
      const { error: e2 } = await supabase.rpc('exec_sql', { sql_query: stmt + ';' });
      if (e2) console.error('Statement failed:', stmt.substring(0, 60), '›', e2.message);
      else console.log('OK:', stmt.substring(0, 60));
    }
  } else {
    console.log('Migration OK!');
  }
}
run();
