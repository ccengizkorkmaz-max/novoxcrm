import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { sendWhatsAppTemplate } from '@/lib/whatsapp'

export async function GET() {
    return NextResponse.json({
        status: 'active',
        message: 'Novo CRM External Lead API is running. Use POST to submit leads.'
    })
}

export async function POST(req: Request) {
    try {
        const supabase = createAdminClient()
        const contentType = req.headers.get('content-type') || ''

        let body: any = {}

        if (contentType.includes('application/json')) {
            body = await req.json()
        } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await req.formData()
            formData.forEach((value, key) => {
                body[key] = value
            })
        } else {
            // Fallback to JSON if unknown
            try {
                body = await req.json()
            } catch (e) {
                return NextResponse.json({ error: 'Unsupported content type and invalid JSON' }, { status: 400 })
            }
        }

        console.log('External Lead Incoming Body:', JSON.stringify(body, null, 2))

        let {
            name,
            email,
            phone,
            source = body.source || 'External',
            message: bodyMessage,
            tenant_id = body.tenant_id,
            subject,
            campaign,
            form_name,
            lead_date  // Facebook'un orijinal lead oluşturma tarihi (ISO string)
        } = body

        // Tarihi parse et — Unix timestamp, ISO string veya herhangi bir format gelebilir
        function parseLeadDate(val: any): string {
            if (!val) return new Date().toISOString()
            // Unix timestamp (saniye cinsinden — Facebook genellikle böyle gönderir)
            if (typeof val === 'number' || /^\d{9,11}$/.test(String(val))) {
                return new Date(Number(val) * 1000).toISOString()
            }
            // Unix timestamp (milisaniye — JS timestamp)
            if (/^\d{12,}$/.test(String(val))) {
                return new Date(Number(val)).toISOString()
            }
            // ISO veya standart string — Date.parse deneyelim
            const parsed = Date.parse(String(val))
            if (!isNaN(parsed)) return new Date(parsed).toISOString()
            // Hiçbiri değilse şimdiki zaman
            console.warn('lead_date parse edilemedi, şimdiki zaman kullanılıyor:', val)
            return new Date().toISOString()
        }
        const recordDate: string = parseLeadDate(lead_date)

        // --- ULTRA PERMISSIVE MODE: "Take whatever comes" ---
        // If we don't have a message or name/email, the user might be sending custom fields.
        if (!bodyMessage && !name && !email && !phone) {
            console.log('No standard fields found. Capturing entire body as message.');
            bodyMessage = JSON.stringify(body, null, 2);
        }

        // Parse customer info from message content if available (Regex parsing)
        if (bodyMessage && typeof bodyMessage === 'string') {
            const nameMatch = bodyMessage.match(/Ad\s+Soyad:\s*([^:\n\r]+?)(?=\s*(?:E-posta|Telefon|Konu|Proje|$)|\r|\n)/i)
            if (nameMatch && !name) name = nameMatch[1].trim()

            const emailMatch = bodyMessage.match(/(?:E-posta Adresi|E-posta):\s*([^:\n\r\s]+?)(?=\s*(?:Ad Soyad|Telefon|Konu|Proje|$)|\r|\n)/i)
            if (emailMatch && !email) email = emailMatch[1].trim()

            const phoneMatch = bodyMessage.match(/Telefon:\s*([^:\n\r\s]+?)(?=\s*(?:Ad Soyad|E-posta|Konu|Proje|$)|\r|\n)/i)
            if (phoneMatch && !phone) phone = phoneMatch[1].trim()
        }

        // Final fallback for missing fields - capture from any possible top-level keys
        if (!name) name = body.full_name || body.Ad || body['Ad Soyad'] || body.sender_name || subject || email || 'Yeni Dış Kaynak Adayı'
        if (!email) email = body.Email || body.eposta || body.sender_email || null
        if (!phone) phone = body.Phone || body.telefon || null

        // Tenant Protection: Ensure we have a tenant_id
        if (!tenant_id) {
            const { data: firstTenant } = await supabase.from('tenants').select('id').limit(1).maybeSingle();
            tenant_id = firstTenant?.id;
        }

        if (!tenant_id) {
            return NextResponse.json({ error: 'System Error: No valid tenant found to assign this lead.' }, { status: 500 })
        }

        // --- NEW: Try to link to a Project ---
        let projectId = null
        const projectSearchTerm = form_name || subject
        if (projectSearchTerm && tenant_id) {
            const { data: project } = await supabase
                .from('projects')
                .select('id')
                .eq('tenant_id', tenant_id)
                .ilike('name', `%${projectSearchTerm}%`)
                .limit(1)
                .maybeSingle()

            if (project) {
                projectId = project.id
            }
        }

        // Build final message matching the format in your screenshot
        let finalMessage = ''

        if (source === 'Facebook Ads') {
            finalMessage = `Lead from Facebook Ads`
            if (form_name) finalMessage += ` (Form: ${form_name})`
            if (campaign) finalMessage += ` (Campaign: ${campaign})`
            if (bodyMessage) finalMessage += `\n\n${bodyMessage}`
        } else {
            if (subject) {
                finalMessage += `**${subject}**\n\n`
            }
            if (bodyMessage) {
                finalMessage += bodyMessage
            }
            if (!finalMessage && (form_name || campaign)) {
                finalMessage = `Form: ${form_name || '-'} | Campaign: ${campaign || '-'}`
            }
        }

        // --- Conditional Logic ---
        // Facebook Ads leads are created automatically (idempotent / duplicate-safe)
        // WEB Form leads go to inbox for manual approval
        const isFacebookAds =
            source?.toLowerCase().includes('facebook') ||
            source?.toLowerCase().includes('fb ads') ||
            source?.toLowerCase() === 'facebook ads'

        if (isFacebookAds) {
            console.log('Automating Facebook Ads lead processing...')

            // ── 1. Create customer (NO DEDUPLICATION) ─────────────────
            // User request (25 Mar 2026): We completely bypassed duplicate checking. Every incoming lead creates a brand new customer.
            
            let customerId: string
            let isNewCustomer = false

            // Build OR filter only for non-null values to avoid false matches
            const orFilters: string[] = []
            if (phone) orFilters.push(`phone.eq.${phone}`)
            if (email) orFilters.push(`email.eq.${email}`)

            let existingCustomer: { id: string } | null = null

            if (orFilters.length > 0) {
                const { data } = await supabase
                    .from('customers')
                    .select('id')
                    .eq('tenant_id', tenant_id)
                    .or(orFilters.join(','))
                    .limit(1)
                    .maybeSingle()
                existingCustomer = data
            }

            if (existingCustomer) {
                customerId = existingCustomer.id
                console.log('✅ Existing customer found (no duplicate):', customerId)
            } else {
                // Create new customer
                const { data: newCustomer, error: customerError } = await supabase
                    .from('customers')
                    .insert({
                        tenant_id: tenant_id,
                        full_name: name,
                        email: email || null,
                        phone: phone || null,
                        source: 'Facebook Ads'
                    })
                    .select('id')
                    .single()

                if (customerError || !newCustomer) {
                    console.error('Error creating customer for Facebook Ads:', customerError)
                    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
                }
                
                customerId = newCustomer.id
                isNewCustomer = true
                console.log('🆕 New customer created:', customerId)
            }

            // ── 2. Duplicate Lead (sales) check ─────────────────────────────
            // We removed the duplicate skip block because historical imports or multiple form submissions
            // from the same customer were being wrongly swallowed. All webhooks will now create a lead.

            // ── 3. Create sale (Lead) record ─────────────────────────────────
            const { data: newSale, error: saleError } = await supabase
                .from('sales')
                .insert({
                    tenant_id: tenant_id,
                    customer_id: customerId,
                    project_id: projectId,
                    status: 'Lead',
                    description: finalMessage.trim() || 'Facebook Ads Lead'
                })
                .select('id')
                .single()

            if (saleError || !newSale) {
                console.error('Error creating sale for Facebook Ads:', saleError)
                return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 })
            }

            // ── 4. Force-set created_at (UPDATE garantili çalışır, INSERT DEFAULT'u override edebilir)
            if (lead_date) {
                await supabase
                    .from('sales')
                    .update({ created_at: recordDate })
                    .eq('id', newSale.id)

                console.log('📅 created_at zorla yazıldı (Sadece Sale için):', recordDate)
            }

            console.log('✅ Facebook Ads lead created:', newSale.id)

            // ── 5. Otomatik WhatsApp şablon mesajı gönder (Tenant ayarlarından) ───────
            if (phone) {
                try {
                    // Tenant'ın WhatsApp otomasyon ayarlarını kontrol et
                    const { data: tenantSettings } = await supabase
                        .from('tenants')
                        .select('wa_auto_template_enabled, wa_auto_template_name, wa_auto_template_rule')
                        .eq('id', tenant_id)
                        .single();

                    const isAutoEnabled = tenantSettings?.wa_auto_template_enabled ?? false;
                    const templateName = tenantSettings?.wa_auto_template_name || 'novo_talep_alindi';
                    const templateRule = tenantSettings?.wa_auto_template_rule || 'new_lead';

                    if (isAutoEnabled && templateRule !== 'disabled') {
                        // Proje adını bul
                        let projectName = 'Novo';
                        if (projectId) {
                            const { data: proj } = await supabase.from('projects').select('name').eq('id', projectId).single();
                            if (proj) projectName = proj.name;
                        } else if (form_name) {
                            projectName = form_name;
                        }

                        // Telefon numarasını normalize et
                        let wpPhone = phone.replace(/[^\d]/g, '');
                        if (wpPhone.startsWith('0')) wpPhone = '90' + wpPhone.substring(1);
                        if (!wpPhone.startsWith('90') && wpPhone.length === 10) wpPhone = '90' + wpPhone;

                        // Müşteri adını düzelt (tam ad kullan, sadece isim fazla samimi)
                        const customerName = name?.trim() || 'Değerli Müşterimiz';

                        // Şablonu gönder
                        const templateResult = await sendWhatsAppTemplate(
                            wpPhone,
                            templateName,
                            [customerName, projectName]
                        );

                        if (templateResult.success) {
                            console.log(`📩 WhatsApp "${templateName}" gönderildi: ${wpPhone} (${projectName})`);
                            // Sales kaydına WA gönderildi işareti koy
                            await supabase.from('sales').update({
                                wa_first_message_sent: true,
                                wa_first_message_at: new Date().toISOString()
                            }).eq('id', newSale.id);
                            
                            // Aktivite olarak kaydet
                            await supabase.from('activities').insert({
                                tenant_id: tenant_id,
                                customer_id: customerId,
                                project_id: projectId,
                                type: 'Whatsapp',
                                topic: 'Sales',
                                summary: `💬 WhatsApp Mesajı Gönderildi (${templateName})`,
                                description: `Sistem tarafından otomatik şablon mesajı gönderildi.`,
                                status: 'Completed',
                                due_date: new Date().toISOString(),
                                priority: 'Medium'
                            });

                            // Mesajı conversation geçmişine kaydet (AI context için)
                            try {
                                let { data: existingConv } = await supabase
                                    .from('whatsapp_conversations')
                                    .select('id')
                                    .eq('tenant_id', tenant_id)
                                    .eq('phone_number', wpPhone)
                                    .maybeSingle();

                                if (!existingConv) {
                                    // Sohbet yoksa oluştur
                                    const { data: newConv } = await supabase.from('whatsapp_conversations').insert({
                                        tenant_id: tenant_id,
                                        phone_number: wpPhone,
                                        customer_id: customerId,
                                        channel: 'whatsapp',
                                        ai_enabled: true,
                                        last_message_preview: `[Şablon] ${templateName}`,
                                        unread_count: 0
                                    }).select('id').single();
                                    existingConv = newConv;
                                }

                                if (existingConv) {
                                    await supabase.from('whatsapp_messages').insert({
                                        conversation_id: existingConv.id,
                                        tenant_id: tenant_id,
                                        role: 'assistant',
                                        direction: 'outbound',
                                        sender_type: 'bot',
                                        content: `[Şablon: ${templateName}] Müşteriye ${projectName} projesi hakkında bilgi mesajı gönderildi. Müşteri adı: ${customerName}.`,
                                        status: 'delivered',
                                    });
                                }
                            } catch (convErr) {
                                console.warn('Conversation log hatası (non-blocking):', convErr);
                            }
                        } else {
                            console.warn('⚠️ WhatsApp şablon gönderilemedi:', templateResult.error);
                        }
                    } else {
                        console.log('ℹ️ WhatsApp otomasyon devre dışı (tenant ayarı)');
                    }
                } catch (waError) {
                    console.warn('⚠️ WhatsApp auto-send error (non-blocking):', waError);
                }
            }

            revalidatePath('/[locale]/(dashboard)/crm')
            return NextResponse.json({
                success: true,
                duplicate: false,
                message: isNewCustomer
                    ? 'New customer and lead created.'
                    : 'Existing customer found — new lead created.',
                lead_id: newSale.id,
                recorded_date: recordDate
            })
        }

        // --- Default Flow: Inbox Items ---
        const { data: inboxItem, error: inboxError } = await supabase
            .from('inbox_items')
            .insert({
                tenant_id: tenant_id,
                name: name,
                email: email || null,
                phone: phone || null,
                message: finalMessage.trim() || 'No message provided',
                source: source,
                status: 'pending',
                project_id: projectId
            })
            .select()
            .single()

        if (inboxError) {
            console.error('Error creating inbox item:', inboxError)
            return NextResponse.json({
                error: `Failed to create inbox item: ${inboxError.message}`,
                details: inboxError
            }, { status: 500 })
        }

        console.log('Inbox item created successfully:', inboxItem.id)

        revalidatePath('/[locale]/(dashboard)/inbox')

        return NextResponse.json({
            success: true,
            message: 'Lead received and added to Inbox for approval.',
            inbox_item_id: inboxItem.id
        })
    } catch (error: any) {
        console.error('Unexpected error in external lead route:', error)
        return NextResponse.json({
            error: 'Internal server error',
            message: error.message
        }, { status: 500 })
    }
}
