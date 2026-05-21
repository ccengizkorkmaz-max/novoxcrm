const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split(/\r?\n/).forEach(line => {
    if (!line.trim() || line.trim().startsWith('#')) return;
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let val = (match[2] || '').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
        }
        envVars[match[1]] = val;
    }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
    try {
        console.log('Querying workflow...');
        const { data: workflows } = await supabase
            .from('outreach_workflows')
            .select('*')
            .ilike('name', '%Burak - WhatsApp Kampanya (Proje Bazlı)%');

        const workflow = workflows[0];
        console.log('Workflow:', workflow.name, 'ID:', workflow.id);

        // Fetch executions for this workflow
        const { data: execs } = await supabase
            .from('outreach_executions')
            .select('id, customer_id, status')
            .eq('workflow_id', workflow.id);

        console.log(`Total executions: ${execs.length}`);

        const customerIds = execs.map(e => e.customer_id).filter(Boolean);
        console.log(`Unique customer IDs in executions: ${new Set(customerIds).size}`);

        // Fetch conversations for these customers
        const { data: convs } = await supabase
            .from('whatsapp_conversations')
            .select('*')
            .in('customer_id', customerIds);

        console.log(`Total whatsapp_conversations for these customers: ${convs.length}`);
        if (convs.length > 0) {
            console.log('Sample conversation:', {
                id: convs[0].id,
                customer_id: convs[0].customer_id,
                phone_number: convs[0].phone_number,
                last_message_preview: convs[0].last_message_preview,
                last_message_at: convs[0].last_message_at
            });
        }

        // Check if there are any conversations for this tenant in general
        const { data: allConvs } = await supabase
            .from('whatsapp_conversations')
            .select('id, customer_id, phone_number, last_message_preview, last_message_at')
            .limit(10);
        console.log(`Total conversations in DB (limit 10): ${allConvs.length}`);
        allConvs.forEach(c => {
            console.log(`- Conv: customer_id=${c.customer_id}, phone=${c.phone_number}, last_message="${c.last_message_preview}"`);
        });

    } catch (err) {
        console.error(err);
    }
}

run();
