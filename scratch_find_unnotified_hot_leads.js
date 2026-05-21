const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Credentials missing in env!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
    console.log('=== FINDING UNNOTIFIED OR MISSED HOT LEADS SINCE YESTERDAY ===');
    const tenantId = '89b2829e-fc21-477e-8fd8-9f9f0c587e81';
    
    // Find all hot, warm, call_requested conversations since May 20th 00:00 Turkey time (May 19th 21:00 UTC)
    const startDate = '2026-05-19T21:00:00.000Z';

    const { data: convs, error: cErr } = await supabase
        .from('whatsapp_conversations')
        .select(`
            id,
            phone_number,
            lead_score,
            hot_lead_notified,
            updated_at,
            customer_id,
            customers (
                full_name,
                phone
            )
        `)
        .eq('tenant_id', tenantId)
        .in('lead_score', ['hot', 'warm', 'call_requested'])
        .gte('updated_at', startDate)
        .order('updated_at', { ascending: true });

    if (cErr) {
        console.error('Error fetching conversations:', cErr);
        return;
    }

    console.log(`Found ${convs.length} candidates.`);
    
    // For each candidate, let's fetch the latest messages to construct a summary
    const leadsToSend = [];
    for (const c of convs) {
        // Fetch last 10 messages for summary
        const { data: recentMessages } = await supabase
            .from('whatsapp_messages')
            .select('role, content, created_at')
            .eq('conversation_id', c.id)
            .order('created_at', { ascending: false })
            .limit(10);

        let summary = '';
        if (recentMessages && recentMessages.length > 0) {
            summary = recentMessages
                .reverse()
                .map(m => `${m.role === 'user' ? 'Müşteri' : 'AI'}: ${m.content.substring(0, 120).replace(/\n/g, ' ')}`)
                .join(' | ');
        }

        leadsToSend.push({
            convId: c.id,
            phone: c.phone_number,
            score: c.lead_score,
            notifiedFlag: c.hot_lead_notified,
            updatedAt: c.updated_at,
            customerName: c.customers?.full_name || 'Bilinmeyen Müşteri',
            customerPhone: c.customers?.phone || c.phone_number,
            summary: summary
        });
    }

    console.log(JSON.stringify(leadsToSend, null, 2));
}

main().catch(console.error);
