require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function investigateFailures() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const { data, error } = await supabase
        .from('outreach_step_logs')
        .select('id, channel, status, call_summary, error_details, executed_at, external_id, outreach_executions(id, customers(phone))')
        .eq('channel', 'ai_call')
        .eq('status', 'failed')
        .gte('executed_at', todayStr)
        .order('executed_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error("Error fetching logs:", error);
    } else {
        console.log("Failed Call Details:", JSON.stringify(data, null, 2));
    }
}

investigateFailures();
