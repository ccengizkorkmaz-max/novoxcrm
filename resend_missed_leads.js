const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Credentials missing in env!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// WhatsApp helper functions replicated here to avoid require/import issues with TypeScript
function normalizePhone(phone) {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '90' + cleanPhone.substring(1);
    } else if (cleanPhone.length === 10) {
        cleanPhone = '90' + cleanPhone;
    }
    return cleanPhone;
}

async function sendWhatsAppTemplate(
    to,
    templateName,
    parameters,
    language = 'tr',
    phoneId,
    accessToken
) {
    const PHONE_ID = phoneId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    let ACCESS_TOKEN = accessToken || process.env.WHATSAPP_ACCESS_TOKEN;

    if (!PHONE_ID || !ACCESS_TOKEN) {
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

    ACCESS_TOKEN = ACCESS_TOKEN.replace(/[\r\n"\s]+/g, '');

    try {
        const response = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
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
    console.log('=== STARTING AUTOMATED RESEND FOR MISSED LEADS ===\n');

    // 1. Fetch eligible tenants with WhatsApp auto-sending enabled
    const { data: tenants, error: tErr } = await supabase
        .from('tenants')
        .select('id, name, wa_auto_template_enabled, wa_auto_template_name, wa_phone_number_id, wa_access_token')
        .eq('wa_auto_template_enabled', true);

    if (tErr) {
        console.error('Error fetching tenants:', tErr);
        return;
    }

    if (!tenants || tenants.length === 0) {
        console.log('No tenants with automated WhatsApp templates enabled.');
        return;
    }

    console.log(`Found ${tenants.length} eligible tenant(s):`, tenants.map(t => t.name).join(', '));

    // Create a lookup map of tenants
    const tenantMap = {};
    for (const t of tenants) {
        tenantMap[t.id] = t;
    }

    // 2. Fetch all leads since May 20th 00:00 Turkey time (May 19th 21:00 UTC)
    const startDate = '2026-05-19T21:00:00.000Z';
    const eligibleTenantIds = tenants.map(t => t.id);

    const { data: sales, error: sErr } = await supabase
        .from('sales')
        .select(`
            id,
            created_at,
            tenant_id,
            project_id,
            wa_first_message_sent,
            customer_id,
            customers!inner (
                id,
                full_name,
                phone,
                source
            )
        `)
        .in('tenant_id', eligibleTenantIds)
        .gte('created_at', startDate)
        .order('created_at', { ascending: true }); // Process oldest first

    if (sErr) {
        console.error('Error fetching sales:', sErr);
        return;
    }

    // Filter for Facebook Ads leads
    const fbSales = sales.filter(s => {
        const src = s.customers?.source || '';
        return src.toLowerCase().includes('facebook') || src.toLowerCase().includes('fb');
    });

    console.log(`Total Facebook Ads sales since ${startDate} for eligible tenants: ${fbSales.length}`);

    // Filter to find the unsent and valid ones
    const toResend = [];
    for (const sale of fbSales) {
        const customer = sale.customers;
        const phone = customer?.phone || '';
        const name = customer?.full_name || 'Değerli Müşterimiz';
        const isSent = sale.wa_first_message_sent;

        // Check if phone number is valid
        let wpPhone = phone.replace(/[^\d]/g, '');
        if (wpPhone.startsWith('0')) wpPhone = '90' + wpPhone.substring(1);
        if (!wpPhone.startsWith('90') && wpPhone.length === 10) wpPhone = '90' + wpPhone;

        const isDummy = wpPhone.length < 10 || /^900+$/.test(wpPhone) || wpPhone.includes('00000') || wpPhone === '90' || wpPhone === '';

        if (!isSent && !isDummy) {
            toResend.push({
                sale,
                wpPhone,
                customerName: name.trim(),
                tenant: tenantMap[sale.tenant_id]
            });
        }
    }

    console.log(`Leads needing resending: ${toResend.length}`);
    if (toResend.length === 0) {
        console.log('No missed leads found to resend messages to. Everything is up-to-date!');
        return;
    }

    // Cache project names to avoid repeating queries
    const projectCache = {};

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < toResend.length; i++) {
        const { sale, wpPhone, customerName, tenant } = toResend[i];
        console.log(`\n[${i + 1}/${toResend.length}] Processing Lead: ${customerName} (${wpPhone})`);

        // Resolve Project Name
        let projectName = 'Novo';
        const projectId = sale.project_id;
        if (projectId) {
            if (projectCache[projectId]) {
                projectName = projectCache[projectId];
            } else {
                const { data: proj } = await supabase
                    .from('projects')
                    .select('name')
                    .eq('id', projectId)
                    .single();
                if (proj && proj.name) {
                    projectName = proj.name;
                    projectCache[projectId] = proj.name;
                }
            }
        }

        const templateName = tenant.wa_auto_template_name || 'new_lead_bilgilendirme';
        console.log(`Sending template "${templateName}" with params: ["${customerName}", "${projectName}"]`);

        // Send template using Meta Cloud API via helper
        const result = await sendWhatsAppTemplate(
            wpPhone,
            templateName,
            [customerName, projectName],
            'tr',
            tenant.wa_phone_number_id,
            tenant.wa_access_token
        );

        if (result.success) {
            console.log(`✅ WhatsApp template message successfully sent to ${wpPhone}`);
            successCount++;

            // 1. Update sales record
            const { error: saleUpErr } = await supabase
                .from('sales')
                .update({
                    wa_first_message_sent: true,
                    wa_first_message_at: new Date().toISOString()
                })
                .eq('id', sale.id);

            if (saleUpErr) {
                console.error(`⚠️ Failed to update sales.wa_first_message_sent for sale ${sale.id}:`, saleUpErr);
            }

            // 2. Insert into activities
            const { error: actErr } = await supabase
                .from('activities')
                .insert({
                    tenant_id: tenant.id,
                    customer_id: sale.customer_id,
                    project_id: projectId,
                    type: 'Whatsapp',
                    topic: 'Sales',
                    summary: `💬 WhatsApp Mesajı Gönderildi (${templateName}) [Resent]`,
                    description: `Sistem tarafından kaçırılan otomatik şablon mesajı yeniden gönderildi.`,
                    status: 'Completed',
                    due_date: new Date().toISOString(),
                    priority: 'Medium'
                });

            if (actErr) {
                console.error(`⚠️ Failed to insert activity for customer ${sale.customer_id}:`, actErr);
            }

            // 3. Create or Update conversation history
            try {
                let { data: existingConv } = await supabase
                    .from('whatsapp_conversations')
                    .select('id')
                    .eq('tenant_id', tenant.id)
                    .eq('phone_number', wpPhone)
                    .maybeSingle();

                if (!existingConv) {
                    const { data: newConv } = await supabase
                        .from('whatsapp_conversations')
                        .insert({
                            tenant_id: tenant.id,
                            phone_number: wpPhone,
                            customer_id: sale.customer_id,
                            channel: 'whatsapp',
                            ai_enabled: true,
                            last_message_preview: `[Şablon] ${templateName}`,
                            unread_count: 0
                        })
                        .select('id')
                        .single();
                    existingConv = newConv;
                } else {
                    // Update preview
                    await supabase
                        .from('whatsapp_conversations')
                        .update({
                            last_message_preview: `[Şablon] ${templateName}`
                        })
                        .eq('id', existingConv.id);
                }

                if (existingConv) {
                    const { error: msgErr } = await supabase
                        .from('whatsapp_messages')
                        .insert({
                            conversation_id: existingConv.id,
                            tenant_id: tenant.id,
                            role: 'assistant',
                            direction: 'outbound',
                            sender_type: 'bot',
                            content: `[Şablon: ${templateName}] Müşteriye ${projectName} projesi hakkında bilgi mesajı gönderildi. Müşteri adı: ${customerName}. [Yeniden Gönderildi]`,
                            status: 'delivered'
                        });

                    if (msgErr) {
                        console.error(`⚠️ Failed to insert message for conversation ${existingConv.id}:`, msgErr);
                    }
                }
            } catch (convErr) {
                console.warn(`⚠️ Conversation/Message tracking error for ${wpPhone}:`, convErr);
            }
        } else {
            console.error(`❌ Failed to send template message to ${wpPhone}:`, result.error);
            failCount++;
        }
    }

    console.log(`\n=== RESEND PROCESS FINISHED ===`);
    console.log(`- Total Success: ${successCount}`);
    console.log(`- Total Failed: ${failCount}`);
}

main().catch(console.error);
