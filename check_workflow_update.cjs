require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testUpdate() {
    const payload = {
        name: "Test Update Workflow",
        start_date: "2026-05-28",
        end_date: "2026-06-28",
    };
    
    const { data, error } = await supabase
        .from('outreach_workflows')
        .update(payload)
        .eq('id', 'bfbef386-a728-4461-8de5-7482be185692')
        .select();

    console.log("Error:", error);
    console.log("Data:", data);
}

testUpdate();
