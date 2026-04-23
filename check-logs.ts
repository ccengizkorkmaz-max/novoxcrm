import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkLogs() {
  const { data, error } = await supabase
    .from('system_logs') // or wherever logs are
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
    
  if (error) {
    console.error('Error fetching logs:', error);
    return;
  }
  
  // Search for the external lead incoming body logs
  // Since logs might not be stored, let's also check if "system_logs" even has this.
  console.log(`Found ${data.length} logs.`);
  data.forEach((log: any) => {
     if (JSON.stringify(log).includes('Ext') || log.action === 'Lead' || log.module === 'CRM') {
        console.log(log);
     }
  });

  // Check sales table for the newly inserted ones 
  // Wait, I already deleted them. So they should not be there.
}

checkLogs().catch(console.error);
