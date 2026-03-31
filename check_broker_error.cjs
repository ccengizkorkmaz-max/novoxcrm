require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBrokerError() {
  console.log('Checking for Bahadır Ali Civan and their recent logs...');

  // 1. Find user in profiles
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .ilike('full_name', '%Bahadır Ali Civan%');

  if (pErr) {
      console.error('Error fetching profile:', pErr);
      return;
  }
  
  if (!profiles || profiles.length === 0) {
      console.log('User Bahadır Ali Civan not found in profiles.');
  } else {
      console.log('Found user profile:', profiles[0]);
      
      const userId = profiles[0].id;

      // 2. Check system_logs for this user
      const { data: logs, error: lErr } = await supabase
        .from('system_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (lErr) {
          console.error('Error fetching logs:', lErr);
      } else {
          console.log('\n--- Recent logs for this user ---');
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
      
      // Also check general logs just in case it's not tied to user_id correctly
  }
  
  // 3. Check general recent errors from system_logs
  const { data: generalErrors, error: geErr } = await supabase
        .from('system_logs')
        .select(`*, profiles(full_name)`)
        .eq('status', 'ERROR')
        .order('created_at', { ascending: false })
        .limit(5);
        
  if (geErr) {
      console.error('Error fetching general errors:', geErr);
  } else {
        console.log('\n--- Recent global errors in system_logs ---');
        if (generalErrors && generalErrors.length > 0) {
            generalErrors.forEach(log => {
                console.log(`[${log.created_at}] User: ${log.profiles?.full_name || log.user_id}, Action: ${log.action_type}, Entity: ${log.entity_type}`);
                console.log(`ERROR DETAILS:`, log.details);
            });
        } else {
            console.log('No recent global errors found.');
        }
  }
}

checkBrokerError().catch(console.error);
