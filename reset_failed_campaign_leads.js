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
        const { data: workflows, error: wfError } = await supabase
            .from('outreach_workflows')
            .select('*')
            .ilike('name', '%Burak - WhatsApp Kampanya (Proje Bazlı)%');

        if (wfError) {
            console.error('Error fetching workflows:', wfError);
            return;
        }

        const workflow = workflows[0];
        console.log('Found workflow:', workflow.name, 'ID:', workflow.id);

        console.log('Fetching executions...');
        const { data: execs, error: execsError } = await supabase
            .from('outreach_executions')
            .select('id, status, customer_id')
            .eq('workflow_id', workflow.id);

        if (execsError) {
            console.error('Error fetching executions:', execsError);
            return;
        }

        const execIds = execs.map(e => e.id);
        
        const chunkArray = (arr, size) => {
            const chunks = [];
            for (let i = 0; i < arr.length; i += size) {
                chunks.push(arr.slice(i, i + size));
            }
            return chunks;
        };

        const execChunks = chunkArray(execIds, 150);
        let allLogs = [];
        for (const chunk of execChunks) {
            const { data: logs, error: logsError } = await supabase
                .from('outreach_step_logs')
                .select('id, execution_id, channel, status, error_message, executed_at')
                .in('execution_id', chunk);
            if (logsError) {
                console.error('Error fetching step logs chunk:', logsError);
            } else if (logs) {
                allLogs.push(...logs);
            }
        }

        const whatsappLogs = allLogs.filter(l => l.channel === 'whatsapp');
        const failedWhatsappLogs = whatsappLogs.filter(l => l.status === 'failed');
        const failedExecIds = new Set(failedWhatsappLogs.map(l => l.execution_id));
        const successExecIds = new Set(whatsappLogs.filter(l => l.status === 'sent' || l.status === 'success').map(l => l.execution_id));
        
        const permanentFailedExecs = [];
        failedExecIds.forEach(id => {
            if (!successExecIds.has(id)) {
                permanentFailedExecs.push(id);
            }
        });

        console.log(`Identified ${permanentFailedExecs.length} executions to delete.`);

        if (permanentFailedExecs.length === 0) {
            console.log('No failed executions found to reset.');
            return;
        }

        // Perform delete on outreach_executions
        console.log('Deleting executions from database...');
        const deleteChunks = chunkArray(permanentFailedExecs, 100);
        let totalDeleted = 0;

        for (const chunk of deleteChunks) {
            const { count, error: deleteError } = await supabase
                .from('outreach_executions')
                .delete({ count: 'exact' })
                .in('id', chunk);

            if (deleteError) {
                console.error('Error during deletion:', deleteError);
            } else {
                totalDeleted += count || 0;
            }
        }

        console.log(`Successfully deleted ${totalDeleted} execution records (and cascaded step logs).`);

    } catch (err) {
        console.error('Fatal error:', err);
    }
}

run();
