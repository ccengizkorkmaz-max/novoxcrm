require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkCalls() {
    // Check if there are any logs for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const { data, error, count } = await supabase
        .from('outreach_step_logs')
        .select('channel, status, executed_at', { count: 'exact' })
        .eq('channel', 'ai_call')
        .gte('executed_at', todayStr)
        .order('executed_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`Total calls today: ${count}`);
        console.log("Recent calls:", data);
    }

    // Also check active workflows
    const { data: execs } = await supabase
        .from('outreach_executions')
        .select('status, started_at')
        .gte('started_at', todayStr)
        .limit(5);
    
    console.log("Recent Executions today:", execs);
}

checkCalls();
