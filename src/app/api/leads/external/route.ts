import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { sendWhatsAppTemplate } from '@/lib/whatsapp'
import { makeOutboundCall, normalizeToE164 } from '@/lib/vapi'
import { getCrmMode } from '@/lib/crm-mode'
import { 
    validateWebFormLead, 
    extractWebFormName, 
    extractWebFormPhone, 
    extractWebFormEmail, 
    extractWebFormProject 
} from '@/lib/leads/webform-validator'

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
            try {
                body = await req.json()
            } catch (e) {
                console.warn('Malformed JSON received in request body:', e)
                try {
                    const rawText = await req.text()
                    body = { message: rawText, raw: rawText }
                } catch (err) {
                    body = {}
                }
            }
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

        // 🔍 Diagnostic: Raw payload'ı kaydet (name sorunu debug için)
        try {
            await supabase.from('api_debug_logs').insert({
                endpoint: '/api/leads/external',
                method: 'POST',
                payload: body,
                created_at: new Date().toISOString()
            })
        } catch (e) {
            // Tablo yoksa sessizce geç
            console.warn('Debug log insert failed (table may not exist):', e)
        }

        // If the payload is wrapped inside a "json" string key (e.g. from Make.com)
        if (body && typeof body.json === 'string') {
            try {
                const parsedJson = JSON.parse(body.json)
                body = { ...body, ...parsedJson }
            } catch (e) {
                console.warn('Failed to parse body.json string:', e)
            }
        }

        let {
            name,
            email,
            phone,
            source = body.source || 'External',
            message: bodyMessage = body.message || body.notes,
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
        // ALWAYS try body parsing first — top-level fields may be the form sender, not the customer
        let parsedProject: string | null = null
        if (bodyMessage && typeof bodyMessage === 'string') {
            const nameMatch = bodyMessage.match(/Ad\s+Soyad:\s*([^:\n\r]+?)(?=\s*(?:E-posta|Telefon|Konu|Proje|$)|\r|\n)/i)
            if (nameMatch) {
                name = nameMatch[1].replace(/\\n/g, '').trim()
            }

            const emailMatch = bodyMessage.match(/(?:E-posta Adresi|E-posta):\s*([^:\n\r\s]+?)(?=\s*(?:Ad Soyad|Telefon|Konu|Proje|$)|\r|\n)/i)
            if (emailMatch) {
                email = emailMatch[1].replace(/\\n/g, '').trim()
            }

            const phoneMatch = bodyMessage.match(/(?:Telefon Numarası|Telefon No|Telefon|Tel):\s*([\d\s\+\-\(\)\.\\n]+?)(?=\s*(?:Ad Soyad|E-posta|Konu|Proje|Mesaj|Not|KVKK|Se|$)|\r|\n)/i)
            if (phoneMatch) {
                phone = phoneMatch[1].replace(/\\n/g, '').replace(/\n/g, '').trim()
            }

            // Parse "Seçilen Proje: NOVO City İzmir" from web form emails
            const projectMatch = bodyMessage.match(/(?:Seçilen Proje|Proje|İlgilenilen Proje|Project):\s*([^\n\r]+?)(?=\s*(?:KVKK|Mesaj|Not|--|$)|\r|\n)/i)
            if (projectMatch) {
                parsedProject = projectMatch[1].replace(/\\n/g, '').trim()
                console.log('📋 Parsed project from message body:', parsedProject)
            }
        }

        // --- WEB FORM VALIDATION ---
        // Only process emails that contain the web form signature
        // This prevents random emails (newsletters, spam, personal) from becoming leads
        const isWebFormEmail = source === 'WEB Form' || source === 'Web Form'
        if (isWebFormEmail && bodyMessage) {
            const hasWebFormSignature =
                bodyMessage.includes('iletişim formu') ||
                bodyMessage.includes('web sitesindeki') ||
                bodyMessage.includes('Ad Soyad:') ||
                bodyMessage.includes('Seçilen Proje:') ||
                bodyMessage.includes('KVKK') ||
                bodyMessage.includes('Telefon Numarası:')

            if (!hasWebFormSignature) {
                console.log('⛔ Email rejected — no web form signature detected. Subject:', subject)
                return NextResponse.json({
                    success: false,
                    message: 'Email rejected: not a web form submission.',
                    rejected: true
                })
            }
        }

        // If form_name wasn't provided but we parsed project from the body, use it
        if (!form_name && parsedProject) {
            form_name = parsedProject
        }

        // Extract phone first from any possible key
        if (!phone) {
            phone = body.phone || body.phone_number || body['Phone number'] || body['phone_number']
                || body.Phone || body.telefon || body['Telefon Numarası'] || body['Telefon No']
                || body['Telefon'] || body.Tel || body.tel || body.mobile || null
        }

        // Extract email
        if (!email) {
            email = body.email || body.Email || body['Email'] || body.eposta
                || body['E-posta'] || body['E-posta Adresi'] || body.sender_email || null
        }

        // Extract name
        if (!name) {
            const firstName = body.first_name || body.firstName || body.ad || body.Ad || body.İsim || body.isim || ''
            const lastName = body.last_name || body.lastName || body.soyad || body.Soyad || body.soyadi || ''
            if (firstName || lastName) {
                name = `${firstName} ${lastName}`.trim()
            } else {
                name = body.full_name || body.fullName || body['Full name'] || body['full name']
                    || body.adi_soyadi || body['adi_soyadi'] || body['Ad Soyad'] || body['ad_soyad']
                    || body.name || body.Name || body.sender_name || body.customer_name
                    || subject || email || null
            }
        }

        // Check if phone, name or email is inside field_data array (Meta Ads Webhook format)
        if (Array.isArray(body.field_data)) {
            for (const item of body.field_data) {
                const fname = String(item.name || item.type || '').toLowerCase()
                const val = Array.isArray(item.values) ? item.values[0] : item.value || ''
                if (!val) continue
                if (!phone && (fname.includes('phone') || fname.includes('telefon') || fname.includes('tel'))) {
                    phone = String(val).trim()
                }
                if (!name && (fname.includes('name') || fname.includes('isim') || fname.includes('ad'))) {
                    name = String(val).trim()
                }
                if (!email && (fname.includes('email') || fname.includes('eposta'))) {
                    email = String(val).trim()
                }
            }
        }

        // Filter out known form sender addresses — these are NOT real customers
        const FORM_SENDER_EMAILS = ['web@novosirketlergrubu.com']
        const FORM_SENDER_NAMES = ['novo']
        if (email && FORM_SENDER_EMAILS.includes(email.toLowerCase())) email = null
        if (name && FORM_SENDER_NAMES.includes(name.toLowerCase()) && email === null) name = null

        // --- STRICT WEB FORM LEAD VALIDATION ---
        // Sadece web formlarından gelen gerçek müşteri adayları kabul edilir.
        // İş başvuruları, CV'ler, reklam/ajans teklifleri ve spamler kesinlikle elenir.
        const isWebOrEmail = source === 'WEB Form' || source === 'Web Form' || source === 'Email' || source === 'Gelen Kutusu'
        if (isWebOrEmail) {
            const validation = validateWebFormLead({
                name,
                email,
                phone,
                message: bodyMessage,
                source
            })

            if (!validation.isValid) {
                console.warn(`⛔ External lead rejected (${validation.category}): ${validation.reason}. Name: ${name}, Subject: ${subject}`)
                return NextResponse.json({
                    success: false,
                    message: `Lead reddedildi: ${validation.reason}`,
                    category: validation.category,
                    rejected: true
                }, { status: 400 })
            }

            // Apply best extracted data
            if (validation.extractedData.name && (!name || name.toLowerCase() === 'novo')) {
                name = validation.extractedData.name
            }
            if (validation.extractedData.phone && !phone) {
                phone = validation.extractedData.phone
            }
            if (validation.extractedData.email && (!email || email === 'web@novosirketlergrubu.com')) {
                email = validation.extractedData.email
            }
            if (validation.extractedData.project && !parsedProject) {
                parsedProject = validation.extractedData.project
            }
        }

        // Final fallback for missing name
        if (!name) {
            if (phone) {
                name = `FB Lead ${phone}`
            } else {
                name = 'Yeni Dış Kaynak Adayı'
                console.warn('⚠️ Lead geldi ama ne isim ne telefon var! Body:', JSON.stringify(body).substring(0, 300))
            }
        }

        // Tenant Protection: Ensure we have a tenant_id and load its auto-approval preference
        let autoApproveWebLeads = true;
        if (tenant_id) {
            const { data: tenantData } = await supabase.from('tenants').select('auto_approve_web_leads').eq('id', tenant_id).maybeSingle();
            autoApproveWebLeads = tenantData?.auto_approve_web_leads !== false;
        } else {
            const { data: firstTenant } = await supabase.from('tenants').select('id, auto_approve_web_leads').limit(1).maybeSingle();
            tenant_id = firstTenant?.id;
            autoApproveWebLeads = firstTenant?.auto_approve_web_leads !== false;
        }

        if (!tenant_id) {
            return NextResponse.json({ error: 'System Error: No valid tenant found to assign this lead.' }, { status: 500 })
        }

        // --- Try to link to a Project ---
        let projectId = null
        const projectSearchTerm = form_name || parsedProject || subject
        if (projectSearchTerm && tenant_id) {
            // Try exact-ish match first with each word
            const searchTerms = projectSearchTerm.split(/\s+/).filter((w: string) => w.length > 2)

            // Try full term first
            const { data: project } = await supabase
                .from('projects')
                .select('id, name')
                .eq('tenant_id', tenant_id)
                .ilike('name', `%${projectSearchTerm}%`)
                .limit(1)
                .maybeSingle()

            if (project) {
                projectId = project.id
                console.log('🏗️ Project matched:', project.name, '→', projectId)
            } else if (searchTerms.length > 1) {
                // Fallback: try matching each significant word
                for (const term of searchTerms) {
                    const { data: proj } = await supabase
                        .from('projects')
                        .select('id, name')
                        .eq('tenant_id', tenant_id)
                        .ilike('name', `%${term}%`)
                        .limit(1)
                        .maybeSingle()
                    if (proj) {
                        projectId = proj.id
                        console.log('🏗️ Project matched (word fallback):', proj.name, '→', projectId)
                        break
                    }
                }
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
            !source ||
            source.toLowerCase().includes('facebook') ||
            source.toLowerCase().includes('fb') ||
            source.toLowerCase().includes('meta') ||
            source.toLowerCase().includes('make') ||
            source.toLowerCase().includes('ortak') ||
            source.toLowerCase().includes('instagram') ||
            source.toLowerCase() === 'external' ||
            source.toLowerCase() === 'web form' ||
            source.toLowerCase() === 'api'

        if (isFacebookAds) {
            console.log('Automating Facebook Ads lead processing...')

            // ── ADVANCE MOD: leads tablosuna yönlendir ─────────────────
            const crmMode = await getCrmMode(tenant_id)
            if (crmMode === 'advance') {
                const { assignLeadRoundRobin, sendLeadAssignmentNotifications } = await import('@/lib/crm-mode')
                const assignedTo = await assignLeadRoundRobin(tenant_id)

                const { data: newLead, error: leadErr } = await supabase.from('leads').insert({
                    tenant_id,
                    full_name: name,
                    phone: phone || null,
                    email: email || null,
                    status: 'new',
                    source: 'Facebook Ads',
                    form_name: form_name || null,
                    campaign_id: campaign || null,
                    notes: finalMessage.trim() || 'Facebook Ads Lead',
                    assigned_to: assignedTo
                }).select('id').single()

                if (leadErr) {
                    console.error('Error creating lead (advance):', leadErr)
                    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
                }

                if (assignedTo && newLead) {
                    await sendLeadAssignmentNotifications(
                        tenant_id,
                        newLead.id,
                        name,
                        phone || null,
                        assignedTo
                    )
                }

                console.log('✅ Facebook Ads lead created (Advance mode):', newLead?.id)
                revalidatePath('/[locale]/(dashboard)/leads')
                return NextResponse.json({
                    success: true,
                    message: 'Lead created in advance CRM mode.',
                    lead_id: newLead?.id,
                    recorded_date: recordDate
                })
            }

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

            // ── 5. Otomatik aksiyon: WhatsApp / AI Arama / Hiçbiri (Tenant ayarlarından) ───────
            if (phone) {
                try {
                    const { data: tenantSettings } = await supabase
                        .from('tenants')
                        .select('auto_action_on_new_lead, wa_auto_template_enabled, wa_auto_template_name, wa_auto_template_rule, ai_knowledge_base')
                        .eq('id', tenant_id)
                        .single();

                    // New field takes priority, fallback to old wa_auto_template_enabled
                    const autoAction = tenantSettings?.auto_action_on_new_lead
                        || (tenantSettings?.wa_auto_template_enabled ? 'whatsapp' : 'none');

                    // Proje adını bul (tüm aksiyonlar için ortak)
                    let projectName = 'Novo';
                    if (projectId) {
                        const { data: proj } = await supabase.from('projects').select('name').eq('id', projectId).single();
                        if (proj) projectName = proj.name;
                    } else if (form_name) {
                        projectName = form_name;
                    }
                    const customerName = name?.trim() || 'Değerli Müşterimiz';

                    if (autoAction === 'whatsapp') {
                        // ── WhatsApp şablon mesajı gönder ──
                        const templateName = tenantSettings?.wa_auto_template_name || 'novo_talep_alindi';
                        const templateRule = tenantSettings?.wa_auto_template_rule || 'new_lead';

                        if (templateRule !== 'disabled') {
                            // Check if a welcome WhatsApp template has already been sent to prevent duplicate messages
                            const { data: existingWa } = await supabase
                                .from('activities')
                                .select('id')
                                .eq('customer_id', customerId)
                                .eq('type', 'Whatsapp')
                                .ilike('summary', `%${templateName}%`)
                                .limit(1)
                                .maybeSingle();

                            if (existingWa) {
                                console.log(`ℹ️ WhatsApp welcome message "${templateName}" already sent to customer ${customerId}. Skipping duplicate.`);
                            } else {
                                let wpPhone = phone.replace(/[^\d]/g, '');
                                if (wpPhone.startsWith('0')) wpPhone = '90' + wpPhone.substring(1);
                                if (!wpPhone.startsWith('90') && wpPhone.length === 10) wpPhone = '90' + wpPhone;

                                const templateResult = await sendWhatsAppTemplate(wpPhone, templateName, [customerName, projectName]);

                                if (templateResult.success) {
                                    console.log(`📩 WhatsApp "${templateName}" gönderildi: ${wpPhone} (${projectName})`);
                                    await supabase.from('sales').update({
                                        wa_first_message_sent: true,
                                        wa_first_message_at: new Date().toISOString()
                                    }).eq('id', newSale.id);

                                    // Otomatik aktivite kaydı kaldırıldı — sistem sessizce işini yapıyor

                                    // Conversation log
                                    try {
                                        let { data: existingConv } = await supabase
                                            .from('whatsapp_conversations').select('id')
                                            .eq('tenant_id', tenant_id).eq('phone_number', wpPhone).maybeSingle();
                                        if (!existingConv) {
                                            const { data: newConv } = await supabase.from('whatsapp_conversations').insert({
                                                tenant_id, phone_number: wpPhone, customer_id: customerId,
                                                channel: 'whatsapp', ai_enabled: true,
                                                last_message_preview: `[Şablon] ${templateName}`, unread_count: 0
                                            }).select('id').single();
                                            existingConv = newConv;
                                        }
                                        if (existingConv) {
                                            await supabase.from('whatsapp_messages').insert({
                                                conversation_id: existingConv.id, tenant_id, role: 'assistant',
                                                direction: 'outbound', sender_type: 'bot',
                                                content: `[Şablon: ${templateName}] Müşteriye ${projectName} projesi hakkında bilgi mesajı gönderildi.`,
                                                status: 'delivered',
                                            });
                                        }
                                    } catch (convErr) {
                                        console.warn('Conversation log hatası (non-blocking):', convErr);
                                    }
                                } else {
                                    console.warn('⚠️ WhatsApp şablon gönderilemedi:', templateResult.error);
                                }
                            }
                        }
                    } else if (autoAction === 'ai_call') {
                        // ── Vapi AI Arama başlat ──
                        // Check if already called to prevent duplicate calls
                        const { data: existingCall } = await supabase
                            .from('activities')
                            .select('id')
                            .eq('customer_id', customerId)
                            .eq('type', 'Call')
                            .ilike('summary', '%AI Arama%')
                            .limit(1)
                            .maybeSingle();

                        if (existingCall) {
                            console.log(`ℹ️ AI Call already initiated for customer ${customerId}. Skipping duplicate.`);
                        } else {
                            console.log(`📞 AI Arama başlatılıyor: ${phone} → ${projectName}`);

                            const knowledgeBase = tenantSettings?.ai_knowledge_base || '';
                            const systemPrompt = `Sen Novo İnşaat için çalışan profesyonel sesli yapay zeka asistanısın. Adın Maya.
Müşteri az önce ${projectName} projesi hakkında bir form doldurarak bilgi talep etti. Şimdi onu arıyorsun.

=== KONUŞMA AKIŞI ===
1. GİRİŞ: "${customerName}" diye hitap et. Kendini tanıt.
   "Merhaba ${customerName}, ben Maya, Novo İnşaat'tan arıyorum. ${projectName} projemizle ilgilendiğinizi gördük, kısaca bilgi vermek istiyorum. Uygun musunuz?"
2. Müşteri uygunsa, proje hakkında KISA bilgi ver (en fazla 1-2 kısa cümle).
3. İlgileniyorsa satış danışmanına yönlendireceğini söyle ve vedalaş.
4. İlgilenmiyorsa veya müsait değilse nazikçe vedalaş.

=== PROJE BİLGİLERİ ===
${knowledgeBase || 'Proje detayları için satış danışmanına yönlendir.'}

=== KURALLAR (MONOLOG KESİNLİKLE YASAKTIR) ===
- Her yanıtın en fazla 1-2 kısa cümle ve 20 kelime olmalıdır.
- Bilgiyi tek seferde yığmak yerine parça parça ver ve her yanıtın sonunda topu müşteriye atacak kısa bir soru sor.
- Müşteriye söz hakkı ver, monolog yapma. Müşteri konuşurken sözünü kesme, dinle.
- Ret durumunda HEMEN vedalaş ve endCall çağır.`;

                            const callResult = await makeOutboundCall({
                                phoneNumber: phone,
                                systemPrompt,
                                firstMessage: `Merhaba ${customerName}, ben Maya, Novo AI satış asistanıyım. Nasılsınız?`,
                                metadata: {
                                    tenant_id, customer_id: customerId, sale_id: newSale.id,
                                    project_name: projectName, source: 'auto_new_lead'
                                }
                            });

                            if (callResult.success) {
                                console.log(`📞 AI Arama başlatıldı: ${callResult.callId} → ${phone}`);
                                // Otomatik aktivite kaydı kaldırıldı — sistem sessizce işini yapıyor
                            } else {
                                console.warn('⚠️ AI Arama başlatılamadı:', callResult.error);
                            }
                        }
                    } else {
                        console.log('ℹ️ Yeni lead aksiyonu: none — otomatik işlem yapılmadı');
                    }
                } catch (actionError) {
                    console.warn('⚠️ Auto-action error (non-blocking):', actionError);
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

        // --- Default Flow: Auto-CRM + Archive in Inbox ---
        if (!autoApproveWebLeads) {
            console.log('Auto-approval is disabled for web form leads. Saving to inbox as pending...')
            
            const { error: inboxErr } = await supabase
                .from('inbox_items')
                .insert({
                    tenant_id: tenant_id,
                    name: name,
                    email: email || null,
                    phone: phone || null,
                    message: finalMessage.trim() || 'No message provided',
                    source: source,
                    status: 'pending',
                    project_id: projectId,
                    sale_id: null,
                    approved_at: null
                })

            if (inboxErr) {
                console.error('Error saving pending lead to inbox:', inboxErr)
                return NextResponse.json({ error: 'Failed to queue lead in inbox' }, { status: 500 })
            }

            revalidatePath('/[locale]/(dashboard)/inbox')

            return NextResponse.json({
                success: true,
                    message: 'Web form lead received and queued in inbox for approval.',
                queued: true
            })
        }

        // Web form leads are now auto-processed (like Facebook Ads) instead of waiting for manual approval.
        // A copy is saved in inbox as 'approved' for archive/audit purposes.
        console.log('Auto-processing web form lead to CRM...')

        // ── ADVANCE MOD: Web form lead'leri de leads tablosuna yönlendir ──
        const webCrmMode = await getCrmMode(tenant_id)
        if (webCrmMode === 'advance') {
            const { assignLeadRoundRobin, sendLeadAssignmentNotifications } = await import('@/lib/crm-mode')
            const assignedTo = await assignLeadRoundRobin(tenant_id)

            const { data: newLead, error: leadErr } = await supabase.from('leads').insert({
                tenant_id,
                full_name: name,
                phone: phone || null,
                email: email || null,
                status: 'new',
                source: source || 'WEB Form',
                form_name: form_name || null,
                notes: finalMessage.trim() || 'Web Form Lead',
                assigned_to: assignedTo
            }).select('id').single()

            if (leadErr) {
                console.error('Error creating lead (advance, web form):', leadErr)
                return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
            }

            if (assignedTo && newLead) {
                await sendLeadAssignmentNotifications(
                    tenant_id,
                    newLead.id,
                    name,
                    phone || null,
                    assignedTo
                )
            }

            // Inbox'a da arşiv kopyası kaydet
            await supabase.from('inbox_items').insert({
                tenant_id, name, email: email || null, phone: phone || null,
                message: finalMessage.trim() || 'No message provided',
                source, status: 'approved', project_id: projectId,
                approved_at: new Date().toISOString()
            })

            console.log('✅ Web form lead created (Advance mode):', newLead?.id)
            revalidatePath('/[locale]/(dashboard)/leads')
            revalidatePath('/[locale]/(dashboard)/inbox')
            return NextResponse.json({
                success: true,
                message: 'Web form lead created in advance CRM mode.',
                lead_id: newLead?.id
            })
        }

        // ── 1. Customer deduplication ─────────────────
        let customerId: string | null = null

        // Check by email first
        if (email) {
            const { data: byEmail } = await supabase
                .from('customers')
                .select('id')
                .eq('tenant_id', tenant_id)
                .eq('email', email)
                .limit(1)
                .maybeSingle()
            if (byEmail) customerId = byEmail.id
        }

        // Then by phone
        if (!customerId && phone) {
            const normalizedPhone = phone.replace(/[\s\-\(\)\.]/g, '')
            const last10 = normalizedPhone.slice(-10)
            if (last10.length >= 7) {
                const { data: byPhone } = await supabase
                    .from('customers')
                    .select('id, phone')
                    .eq('tenant_id', tenant_id)
                    .not('phone', 'is', null)

                if (byPhone) {
                    const match = byPhone.find((c: any) =>
                        c.phone && c.phone.replace(/[\s\-\(\)\.]/g, '').slice(-10) === last10
                    )
                    if (match) customerId = match.id
                }
            }
        }

        // Create new customer if not found
        if (!customerId) {
            const { data: newCustomer, error: customerError } = await supabase
                .from('customers')
                .insert({
                    tenant_id: tenant_id,
                    full_name: name,
                    email: email || null,
                    phone: phone || null,
                    source: source
                })
                .select('id')
                .single()

            if (customerError || !newCustomer) {
                console.error('Error creating customer:', customerError)
                return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
            }
            customerId = newCustomer.id
            console.log('🆕 New customer created:', customerId)
        } else {
            console.log('✅ Existing customer found:', customerId)
            // Update missing fields
            const { data: existing } = await supabase.from('customers').select('phone, email').eq('id', customerId).single()
            const updates: any = {}
            if (existing && !existing.phone && phone) updates.phone = phone
            if (existing && !existing.email && email) updates.email = email
            if (Object.keys(updates).length > 0) {
                await supabase.from('customers').update(updates).eq('id', customerId)
            }
        }

        // ── 2. Create sale (Lead) record ─────────────────
        // Check for existing active lead for same customer first
        const { data: existingSale } = await supabase
            .from('sales')
            .select('id')
            .eq('tenant_id', tenant_id)
            .eq('customer_id', customerId)
            .eq('status', 'Lead')
            .maybeSingle()

        let saleId: string

        if (existingSale) {
            saleId = existingSale.id
            if (projectId) {
                await supabase.from('sales').update({ project_id: projectId }).eq('id', saleId)
            }
            await supabase.from('sales').update({
                description: `${finalMessage.trim()}\\n\\n--- Ek form gönderimi ---`
            }).eq('id', saleId)
            console.log('📝 Existing sale updated:', saleId)
        } else {
            const { data: newSale, error: saleError } = await supabase
                .from('sales')
                .insert({
                    tenant_id: tenant_id,
                    customer_id: customerId,
                    project_id: projectId,
                    status: 'Lead',
                    description: finalMessage.trim() || 'Web Form Lead'
                })
                .select('id')
                .single()

            if (saleError || !newSale) {
                console.error('Error creating sale:', saleError)
                return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 })
            }
            saleId = newSale.id
            console.log('✅ New sale created:', saleId)
        }

        // ── 3. Save copy in inbox as 'approved' (archive) ─────────────────
        await supabase
            .from('inbox_items')
            .insert({
                tenant_id: tenant_id,
                name: name,
                email: email || null,
                phone: phone || null,
                message: finalMessage.trim() || 'No message provided',
                source: source,
                status: 'approved',
                project_id: projectId,
                sale_id: saleId,
                approved_at: new Date().toISOString()
            })

        console.log('📁 Inbox archive copy saved')

        // ── 4. Otomatik aksiyon: WhatsApp / AI Arama / Hiçbiri (same as FB Ads flow) ──
        if (phone && !existingSale) {
            try {
                const { data: tenantSettings } = await supabase
                    .from('tenants')
                    .select('auto_action_on_new_lead, wa_auto_template_enabled, wa_auto_template_name, wa_auto_template_rule, ai_knowledge_base')
                    .eq('id', tenant_id)
                    .single()

                const autoAction = tenantSettings?.auto_action_on_new_lead
                    || (tenantSettings?.wa_auto_template_enabled ? 'whatsapp' : 'none')

                let projectName = 'Novo'
                if (projectId) {
                    const { data: proj } = await supabase.from('projects').select('name').eq('id', projectId).single()
                    if (proj) projectName = proj.name
                } else if (form_name) {
                    projectName = form_name
                }
                const customerName = name?.trim() || 'Değerli Müşterimiz'

                if (autoAction === 'whatsapp') {
                    const templateName = tenantSettings?.wa_auto_template_name || 'novo_talep_alindi'
                    const templateRule = tenantSettings?.wa_auto_template_rule || 'new_lead'

                    if (templateRule !== 'disabled') {
                        // Check if a welcome WhatsApp template has already been sent to prevent duplicate messages
                        const { data: existingWa } = await supabase
                            .from('activities')
                            .select('id')
                            .eq('customer_id', customerId)
                            .eq('type', 'Whatsapp')
                            .ilike('summary', `%${templateName}%`)
                            .limit(1)
                            .maybeSingle()

                        if (existingWa) {
                            console.log(`ℹ️ WhatsApp welcome message "${templateName}" already sent (Web Form). Skipping duplicate.`);
                        } else {
                            let wpPhone = String(phone).replace(/[^\d]/g, '')
                            if (wpPhone.startsWith('0')) wpPhone = '90' + wpPhone.substring(1)
                            if (!wpPhone.startsWith('90') && wpPhone.length === 10) wpPhone = '90' + wpPhone

                            const templateResult = await sendWhatsAppTemplate(wpPhone, templateName, [customerName, projectName])

                            if (templateResult.success) {
                                console.log(`📩 WhatsApp "${templateName}" gönderildi (Web Form): ${wpPhone}`)
                                await supabase.from('sales').update({
                                    wa_first_message_sent: true, wa_first_message_at: new Date().toISOString()
                                }).eq('id', saleId)

                                // Otomatik aktivite kaydı kaldırıldı — sistem sessizce işini yapıyor

                                try {
                                    let { data: existingConv } = await supabase
                                        .from('whatsapp_conversations').select('id')
                                        .eq('tenant_id', tenant_id).eq('phone_number', wpPhone).maybeSingle()
                                    if (!existingConv) {
                                        const { data: newConv } = await supabase.from('whatsapp_conversations').insert({
                                            tenant_id, phone_number: wpPhone, customer_id: customerId,
                                            channel: 'whatsapp', ai_enabled: true,
                                            last_message_preview: `[Şablon] ${templateName}`, unread_count: 0
                                        }).select('id').single()
                                        existingConv = newConv
                                    }
                                    if (existingConv) {
                                        await supabase.from('whatsapp_messages').insert({
                                            conversation_id: existingConv.id, tenant_id, role: 'assistant',
                                            direction: 'outbound', sender_type: 'bot',
                                            content: `[Şablon: ${templateName}] Müşteriye ${projectName} projesi hakkında bilgi mesajı gönderildi.`,
                                            status: 'delivered',
                                        })
                                    }
                                } catch (convErr) {
                                    console.warn('Conversation log hatası (non-blocking):', convErr)
                                }
                            } else {
                                console.warn('⚠️ WhatsApp şablon gönderilemedi (Web Form):', templateResult.error)
                            }
                        }
                    }
                } else if (autoAction === 'ai_call') {
                    // Check if already called to prevent duplicate calls
                    const { data: existingCall } = await supabase
                        .from('activities')
                        .select('id')
                        .eq('customer_id', customerId)
                        .eq('type', 'Call')
                        .ilike('summary', '%AI Arama%')
                        .limit(1)
                        .maybeSingle()

                    if (existingCall) {
                        console.log(`ℹ️ AI Call already initiated (Web Form). Skipping duplicate.`);
                    } else {
                        console.log(`📞 AI Arama başlatılıyor (Web Form): ${phone} → ${projectName}`)
                        const knowledgeBase = tenantSettings?.ai_knowledge_base || ''
                        const systemPrompt = `Sen Novo İnşaat için çalışan profesyonel sesli yapay zeka asistanısın. Adın Maya.
Müşteri az önce ${projectName} projesi hakkında web sitesinden bilgi talep etti. Şimdi onu arıyorsun.

=== KONUŞMA AKIŞI ===
1. GİRİŞ: "${customerName}" diye hitap et. Kendini tanıt.
   "Merhaba ${customerName}, ben Maya, Novo İnşaat'tan arıyorum. ${projectName} projemizle ilgilendiğinizi gördük, kısaca bilgi vermek istiyorum. Uygun musunuz?"
2. Müşteri uygunsa, proje hakkında KISA bilgi ver (en fazla 1-2 kısa cümle).
3. İlgileniyorsa satış danışmanına yönlendireceğini söyle ve vedalaş.
4. İlgilenmiyorsa veya müsait değilse nazikçe vedalaş.

=== PROJE BİLGİLERİ ===
${knowledgeBase || 'Proje detayları için satış danışmanına yönlendir.'}

=== KURALLAR (MONOLOG KESİNLİKLE YASAKTIR) ===
- Her yanıtın en fazla 1-2 kısa cümle ve 20 kelime olmalıdır.
- Bilgiyi tek seferde yığmak yerine parça parça ver ve her yanıtın sonunda topu müşteriye atacak kısa bir soru sor.
- Müşteriye söz hakkı ver, monolog yapma. Müşteri konuşurken sözünü kesme, dinle.
- Ret durumunda HEMEN vedalaş ve endCall çağır.`

                        const callResult = await makeOutboundCall({
                            phoneNumber: phone,
                            systemPrompt,
                            firstMessage: `Merhaba ${customerName}, ben Maya, Novo AI satış asistanıyım. Nasılsınız?`,
                            metadata: {
                                tenant_id, customer_id: customerId, sale_id: saleId,
                                project_name: projectName, source: 'auto_new_lead_webform'
                            }
                        })

                        if (callResult.success) {
                            console.log(`📞 AI Arama başlatıldı (Web Form): ${callResult.callId} → ${phone}`)
                            // Otomatik aktivite kaydı kaldırıldı — sistem sessizce işini yapıyor
                        } else {
                            console.warn('⚠️ AI Arama başlatılamadı (Web Form):', callResult.error)
                        }
                    }
                } else {
                    console.log('ℹ️ Yeni lead aksiyonu: none — otomatik işlem yapılmadı (Web Form)')
                }
            } catch (actionError) {
                console.warn('⚠️ Auto-action error (non-blocking):', actionError)
            }
        }

        revalidatePath('/[locale]/(dashboard)/inbox')
        revalidatePath('/[locale]/(dashboard)/crm')
        revalidatePath('/[locale]/(dashboard)/customers')

        return NextResponse.json({
            success: true,
            message: existingSale
                ? 'Existing customer sale updated (auto-approved).'
                : 'Lead auto-created in CRM and archived in inbox.',
            lead_id: saleId,
            customer_id: customerId,
            was_duplicate: !!existingSale
        })
    } catch (error: any) {
        console.error('Unexpected error in external lead route:', error)
        return NextResponse.json({
            error: 'Internal server error',
            message: error.message
        }, { status: 500 })
    }
}
