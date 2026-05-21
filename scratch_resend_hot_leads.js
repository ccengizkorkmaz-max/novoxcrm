const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Credentials missing in env!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Normalize phone helper
function normalizePhone(phone) {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '90' + cleanPhone.substring(1);
    } else if (cleanPhone.length === 10) {
        cleanPhone = '90' + cleanPhone;
    }
    return cleanPhone;
}

// Meta API sending helper
async function sendWhatsAppTemplate(
    to,
    templateName,
    parameters,
    language = 'tr',
    phoneId,
    accessToken
) {
    if (!phoneId || !accessToken) {
        return { success: false, error: 'WhatsApp API credentials missing' };
    }

    const cleanPhone = normalizePhone(to);
    const components = [];
    
    if (Array.isArray(parameters) && parameters.length > 0) {
        components.push({
            type: 'body',
            parameters: parameters.map(p => ({
                type: 'text',
                text: p,
            })),
        });
    }

    const cleanedAccessToken = accessToken.replace(/[\r\n"\s]+/g, '');

    try {
        const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cleanedAccessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: cleanPhone,
                type: 'template',
                template: {
                    name: templateName,
                    language: { code: language },
                    components,
                },
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('WhatsApp Template Send Error:', data);
            return { success: false, error: data.error?.message || 'Template API Error', data };
        }

        return { success: true, data };
    } catch (error) {
        console.error('WhatsApp Template Fetch Error:', error);
        return { success: false, error: 'Network or Fetch Error' };
    }
}

async function main() {
    console.log('=== RETROSPECTIVE HOT LEAD BATCH RESEND SCRIPT ===\n');

    const tenantId = '89b2829e-fc21-477e-8fd8-9f9f0c587e81'; // Novo Şirketler Grubu

    // 1. Get Tenant details
    const { data: tenant, error: tErr } = await supabase
        .from('tenants')
        .select('name, wa_phone_number_id, wa_access_token')
        .eq('id', tenantId)
        .single();

    if (tErr || !tenant) {
        console.error('Error fetching tenant details:', tErr);
        return;
    }

    console.log(`Tenant Name: ${tenant.name}`);
    console.log(`Phone ID: ${tenant.wa_phone_number_id}`);

    // 2. Get active Hot Lead Managers for this tenant
    const { data: managers, error: mErr } = await supabase
        .from('profiles')
        .select('id, full_name, phone, is_hot_lead_manager')
        .eq('tenant_id', tenantId)
        .eq('is_hot_lead_manager', true)
        .eq('is_active', true);

    if (mErr) {
        console.error('Error fetching hot lead managers:', mErr);
        return;
    }

    if (!managers || managers.length === 0) {
        console.error('No active Hot Lead Managers found!');
        return;
    }

    console.log('\n--- Active Hot Lead Managers ---');
    managers.forEach(m => console.log(`- ${m.full_name} (${m.phone})`));

    // 3. Find all hot, warm, call_requested conversations since May 20th 00:00
    const startDate = '2026-05-20T00:00:00.000Z';

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
        .or('hot_lead_notified.is.null,hot_lead_notified.eq.false')
        .gte('updated_at', startDate)
        .order('updated_at', { ascending: true });

    if (cErr) {
        console.error('Error fetching conversations:', cErr);
        return;
    }

    console.log(`\nFound ${convs.length} total lead candidates in the date range.`);

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
                .map(m => `${m.role === 'user' ? 'Müşteri' : 'AI'}: ${m.content.substring(0, 100).replace(/\n/g, ' ')}`)
                .join(' | ');
        }

        const customerName = c.customers?.full_name || 'Bilinmeyen Müşteri';
        const customerPhone = c.customers?.phone || c.phone_number;

        let leadLabel = '';
        let description = '';

        if (c.lead_score === 'call_requested') {
            leadLabel = '[ARAMA TALEBİ]';
            description = `${leadLabel} Müşteri kampanya şablonuna "Evet arayın" yanıtını verdi. Arama talep ediyor.`;
        } else {
            leadLabel = c.lead_score === 'warm' ? '[ILIK LEAD]' : '[SICAK LEAD]';
            const shortSummary = summary ? summary.substring(0, 400) : 'Özet bulunamadı';
            description = `${leadLabel} ${shortSummary}`;
        }

        leadsToSend.push({
            convId: c.id,
            customerName,
            customerPhone,
            updatedAt: c.updated_at,
            score: c.lead_score,
            description
        });
    }

    console.log(`\nPrepared ${leadsToSend.length} leads for sending.`);
    
    // We will loop and send to each manager
    console.log('\n=== STARTING RESEND PROCESS ===\n');

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < leadsToSend.length; i++) {
        const lead = leadsToSend[i];
        console.log(`[${i + 1}/${leadsToSend.length}] Sending Lead: ${lead.customerName} (${lead.customerPhone}) - Score: ${lead.score}`);

        const formattedDate = new Date(lead.updatedAt).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
        // Prepare 4 parameters (İşlem No/Kod, Referans/İrtibat, Oluşturulma Zamanı, Durum Açıklaması)
        // Meta API disallows newlines, tabs, and >4 spaces in template params
        const params = [
            lead.customerPhone,
            lead.customerName,
            formattedDate,
            lead.description
        ].map(p => typeof p === 'string' ? p.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim() : p);

        let leadSuccess = true;

        for (const manager of managers) {
            if (!manager.phone) continue;
            
            console.log(`  -> Sending to Manager: ${manager.full_name} (${manager.phone})`);
            const res = await sendWhatsAppTemplate(
                manager.phone,
                'crm_operasyonel_durum_bildirimi',
                params,
                'tr',
                tenant.wa_phone_number_id,
                tenant.wa_access_token
            );

            if (res.success) {
                console.log(`  ✅ Successfully sent! Wamid: ${res.data?.messages?.[0]?.id}`);
            } else {
                console.error(`  ❌ Failed to send: ${res.error}`);
                leadSuccess = false;
            }
        }

        if (leadSuccess) {
            successCount++;
            // Update supabase conversation hot_lead_notified = true
            const { error: upErr } = await supabase
                .from('whatsapp_conversations')
                .update({ hot_lead_notified: true })
                .eq('id', lead.convId);

            if (upErr) {
                console.error(`  ⚠️ Warning: Failed to update hot_lead_notified flag in DB:`, upErr);
            } else {
                console.log(`  💾 Updated DB status to notified.`);
            }
        } else {
            failCount++;
        }

        // Small delay to prevent API rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('');
    }

    console.log('=== RESEND PROCESS COMPLETED ===');
    console.log(`Total Leads Processed: ${leadsToSend.length}`);
    console.log(`Successfully Notified: ${successCount}`);
    console.log(`Failed/Partial: ${failCount}`);
}

main().catch(console.error);
