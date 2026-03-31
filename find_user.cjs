require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findUsers() {
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, full_name, role');

  if (pErr) {
      console.error('Error fetching profiles:', pErr);
      return;
  }
  
  if (profiles) {
      const match = profiles.filter(p => (p.full_name || '').toLowerCase().includes('bahad'));
      console.log('Matches:', match);
      
      if (match.length > 0) {
          const userId = match[0].id;
          
          const { data: logs, error: lErr } = await supabase
            .from('system_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);
            
          console.log('\n--- Logs for', match[0].full_name, '---');
          if (logs && logs.length > 0) {
              logs.forEach(log => {
                  console.log(`[${log.created_at}] Action: ${log.action_type}, Entity: ${log.entity_type}, Status: ${log.status}`);
                  if (log.status === 'ERROR') {
                      console.log(`ERROR DETAILS:`, log.details);
                  }
              });
          } else {
              console.log('No recent logs found.');
          }
      }
  }
}

findUsers().catch(console.error);
