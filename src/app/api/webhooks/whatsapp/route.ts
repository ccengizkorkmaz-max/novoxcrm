import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

/**
 * WHATSAPP & MESSENGER UNIFIED WEBHOOK
 *
 * Bu endpoint hem WhatsApp hem de Facebook Messenger üzerinden gelen mesajları karşılar,
 * veritabanına kaydeder, ve Native AI Chatbot motoruyla otomatik yanıt verir.
 *
 * Meta Developer Dashboard -> WhatsApp -> Configuration kısmında bu URL tanımlanmalıdır.
 * Aynı URL Facebook Messenger webhook'u olarak da kullanılabilir.
 */

// ─── Meta Webhook Doğrulaması (GET) ────────────────────────────────────────
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'novox_wa_secure_2024';

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ Webhook Başarıyla Doğrulandı.');
            return new NextResponse(challenge, { status: 200 });
        } else {
            console.error('❌ Webhook Doğrulama Hatası: Token uyuşmuyor.');
            return new NextResponse('Forbidden', { status: 403 });
        }
    }
    return new NextResponse('Bad Request', { status: 400 });
}

// ─── Gelen Mesajları İşleme (POST) ────────────────────────────────────────
export async function POST(req: NextRequest) {
    console.log('--- Webhook Triggered ---');
    try {
        const body = await req.json();
        console.log('Full Incoming Body:', JSON.stringify(body));

        // ── 1. Parse: WhatsApp veya Messenger payload'ını normalize et ──
        const payload = parseIncomingPayload(body);

        if (!payload || !payload.message) {
            // Mesaj dışı event (okundu bilgisi, status update vb.) → 200 dön
            return NextResponse.json({ status: 'event_received' }, { status: 200 });
        }

        console.log(`📩 Yeni Mesaj (${payload.channel}): ${payload.name} (${payload.phone}): ${payload.message}`);

        const supabase = createAdminClient();

        // ── 2. Tenant Eşleştir ─────────────────────────────────────────
        console.log(`🔍 Tenant aranıyor: phoneNumberId=${payload.phoneNumberId}, channel=${payload.channel}`);
        const tenantData = await findTenant(supabase, payload.phoneNumberId, payload.channel);
        if (!tenantData) {
            console.error('❌ Tenant bulunamadı, mesaj atılıyor.');
            return NextResponse.json({ status: 'no_tenant' }, { status: 200 });
        }

        const tenantId = tenantData.id;
        console.log(`✅ Tenant eşleşti: ${tenantId} (fb_page_id: ${tenantData.fb_page_id})`);
        const normalizedPhone = payload.phone.replace(/\D/g, '');

        // ── 3. Sohbeti Bul veya Oluştur ────────────────────────────────
        const { conversationId, aiEnabled } = await findOrCreateConversation(
            supabase, tenantId, normalizedPhone, payload.message, payload.channel
        );

        if (!conversationId) {
            console.error('❌ Conversation oluşturulamadı.');
            return NextResponse.json({ status: 'conv_error' }, { status: 200 });
        }

        // ── 4. Gelen Mesajı Kaydet ─────────────────────────────────────
        const { error: msgInsertError } = await supabase.from('whatsapp_messages').insert({
            conversation_id: conversationId,
            tenant_id: tenantId,
            wa_message_id: payload.message_id,
            direction: 'inbound',
            sender_type: 'customer',
            content: payload.message,
            status: 'received',
            role: 'user',
        });

        if (msgInsertError) {
            console.error('❌ Mesaj kaydedilemedi:', JSON.stringify(msgInsertError));
        } else {
            console.log('✅ Mesaj kaydedildi:', payload.message.substring(0, 30));
        }

        // ── 5. AI Chatbot Motoru ───────────────────────────────────────
        // Dinamik AI provider ve key çözümleme
        const resolvedAi = resolveAiProvider(tenantData);

        if (aiEnabled && resolvedAi) {
            try {
                console.log(`🤖 AI aktif, yanıt üretiliyor (${resolvedAi.provider})...`);

                // Son 20 mesajı context olarak çek
                const { data: history } = await supabase
                    .from('whatsapp_messages')
                    .select('role, content')
                    .eq('conversation_id', conversationId)
                    .order('created_at', { ascending: true })
                    .limit(20);

                const chatHistory = (history || []).map((m: any) => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content }],
                }));

                // Get CRM context to feed to AI
                const crmContext = await getTenantCrmContext(supabase, tenantId);

                // Base AI system rules to strictly hide AI identity and qualify leads
                const strictHumanPersona = `\n\nÖNEMLİ KURALLAR:
1. Sen sadece Novo CRM firmasında profesyonel bir satış danışmanısın.
2. Kendini tanıtırken veya sorulara cevap verirken ASLA "insanım", "yapay zekayım", "dil modeliyim" veya "asistanım" kelimelerini KULLANMA. Kimliğini açıklamaya çalışma, sadece doğrudan konuya gir.
3. Müşteriye doğrudan aşağıda sana verilen 'CRM ENVANTER BİLGİSİ'ne dayanarak bütçesi veya bölge tercihlerine göre gerçek projelerden örnekler ver. Sadece elindeki projeleri sat.
4. LEAD KALİFİKASYONU: Sohbet sırasında çok doğal ve nazik bir şekilde müşterinin adını, soyadını, aradığı daire tipini, bütçesini ve asıl amacını/acı noktasını (yatırım mı, oturum mu vb.) öğrenmeye çalış.

GİZLİ SİSTEM KOMUTLARI (BU KOMUTLARI SADECE ŞARTLAR SAĞLANDIĞINDA YANITININ EN SONUNA EKLERSİN, KULLANICI GÖRMEZ):
- Eğer müşterinin Adını, Soyadını ve Telefon Numarasını (Eğer telefon numarasını daha önce verdiyse veya sistem biliyorsa tekrar sorma) net olarak öğrendiysen ve müşteri ilgilendiğini belli ettiyse, yanıtının EN SONUNA şu formatta bir JSON ekle:
[LEAD_DATA: {"first_name": "Ad", "last_name": "Soyad", "phone": "Telefon Numarası", "notes": "Müşterinin bütçesi ve ilgilendiği şeyler"}]
- Eğer müşteri "Hemen satın almak istiyorum", "Acil daire arıyorum", "Bugün kaparo verebilirim" gibi yüksek satın alma sinyali (HOT LEAD) verirse, yanıtının EN SONUNA şunu ekle:
[HOT_LEAD]`;

                // AI'dan yanıt al
                const finalPrompt = (tenantData.ai_system_prompt || tenantData.ai_assistant_instructions || getDefaultSystemPrompt()) + crmContext + strictHumanPersona;

                let aiReply = await generateAIReply(
                    resolvedAi.provider,
                    resolvedAi.apiKey,
                    finalPrompt,
                    chatHistory,
                    resolvedAi.model
                );

                if (aiReply) {
                    // GİZLİ KOMUTLARI İŞLE VE METİNDEN TEMİZLE
                    let isHotLead = false;
                    if (aiReply.includes('[HOT_LEAD]')) {
                        isHotLead = true;
                        aiReply = aiReply.replace('[HOT_LEAD]', '').trim();
                        
                        // Yüksek öncelikli bildirim/aktivite oluştur
                        await supabase.from('activities').insert({
                            tenant_id: tenantId,
                            type: 'Call',
                            topic: 'Sales',
                            summary: '🔥 ACİL SATIŞ (HOT LEAD)',
                            description: `Novo AI bir satış kapatmak üzere! Müşteri hemen satın almak istiyor. Telefon: ${normalizedPhone}`,
                            status: 'Pending',
                            priority: 'High',
                        });
                        console.log('🔥 HOT LEAD DETECTED AND ALERT CREATED');
                    }

                    const leadMatch = aiReply.match(/\[LEAD_DATA:\s*(\{.*?\})\s*\]/);
                    if (leadMatch) {
                        try {
                            const leadData = JSON.parse(leadMatch[1]);
                            aiReply = aiReply.replace(leadMatch[0], '').trim();
                            
                            // CRM'de müşteri oluştur veya güncelle
                            const { data: existingCust } = await supabase.from('customers').select('id').eq('phone', normalizedPhone).single();
                            if (!existingCust) {
                                await supabase.from('customers').insert({
                                    tenant_id: tenantId,
                                    first_name: leadData.first_name,
                                    last_name: leadData.last_name || 'Bilinmiyor',
                                    phone: normalizedPhone,
                                    email: '',
                                    type: 'Lead',
                                    status: 'New',
                                    source: payload.channel,
                                });
                                console.log(`✅ YENİ LEAD OLUŞTURULDU: ${leadData.first_name} ${leadData.last_name}`);
                            }
                        } catch (e) {
                            console.error('Lead data parse error:', e);
                        }
                    }

                    const accessToken = tenantData.wa_access_token;
                    let sendSuccess = false;

                    if (payload.channel === 'messenger' && accessToken) {
                        // Messenger: Facebook Graph API
                        const res = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ recipient: { id: normalizedPhone }, message: { text: aiReply } }),
                        });
                        sendSuccess = res.ok;
                    } else if (tenantData.wa_phone_number_id && accessToken) {
                        // WhatsApp Cloud API
                        const sendResult = await sendWhatsAppMessage(normalizedPhone, aiReply, tenantData.wa_phone_number_id, accessToken);
                        sendSuccess = sendResult.success;
                    }

                    // AI yanıtını DB'ye kaydet
                    await supabase.from('whatsapp_messages').insert({
                        conversation_id: conversationId,
                        tenant_id: tenantId,
                        direction: 'outbound',
                        sender_type: 'bot',
                        content: aiReply,
                        status: sendSuccess ? 'sent' : 'failed',
                        role: 'assistant',
                    });

                    // Conversation güncelle
                    await supabase.from('whatsapp_conversations').update({
                        last_message_at: new Date().toISOString(),
                        last_message_preview: aiReply.substring(0, 50),
                    }).eq('id', conversationId);

                    console.log(`✅ AI yanıtı gönderildi: "${aiReply.substring(0, 80)}..."`);
                }
            } catch (aiError) {
                console.error('🔥 AI Chatbot Error:', aiError);
                // AI hatası mesaj kaydını engellemez, devam et
            }
        } else if (aiEnabled && !resolvedAi) {
            console.log('⚠️ AI aktif ama API key tanımlı değil — yanıt üretilmedi.');
        }

        // ── 6. Outreach Yanıt Algılama ─────────────────────────────────
        try {
            const { data: activeExecs } = await supabase
                .from('outreach_executions')
                .select('id, customer_id, customers!inner(phone)')
                .in('status', ['active', 'waiting'])
                .limit(10);

            const matchingExecs = (activeExecs || []).filter((exec: any) => {
                const custPhone = (exec.customers?.phone || '').replace(/\D/g, '');
                return custPhone && (normalizedPhone.endsWith(custPhone) || custPhone.endsWith(normalizedPhone));
            });

            for (const exec of matchingExecs) {
                await supabase.from('outreach_executions')
                    .update({ status: 'converted', completed_at: new Date().toISOString() })
                    .eq('id', exec.id);

                await supabase.from('activities').insert({
                    customer_id: exec.customer_id,
                    type: 'Whatsapp',
                    topic: 'Sales',
                    summary: 'Outreach Yanıtı',
                    description: `Müşteri yanıt verdi: "${payload.message.substring(0, 200)}"`,
                    due_date: new Date().toISOString(),
                    status: 'Completed',
                    priority: 'High',
                });
            }
        } catch (outreachError) {
            console.error('Outreach check error:', outreachError);
        }

        return NextResponse.json({ status: 'ok' }, { status: 200 });

    } catch (error: any) {
        console.error('Webhook POST Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


// ═══════════════════════════════════════════════════════════════════════════
// YARDIMCI FONKSİYONLAR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tenant ayarlarından aktif AI provider, model ve API key'i dinamik olarak çözer.
 * Model adı tenant'ta tanımlıysa onu kullanır, yoksa default kullanır.
 */
function resolveAiProvider(tenant: any): { provider: string; apiKey: string; model: string } | null {
    const geminiModel = tenant.gemini_model || 'gemini-2.5-flash';
    const openaiModel = tenant.openai_model || 'gpt-4o-mini';

    // 1. Gemini aktif ve key varsa
    if (tenant.is_gemini_enabled && tenant.gemini_api_key) {
        return { provider: 'gemini', apiKey: tenant.gemini_api_key, model: geminiModel };
    }
    // 2. OpenAI aktif ve key varsa
    if (tenant.is_openai_enabled && tenant.openai_api_key) {
        return { provider: 'openai', apiKey: tenant.openai_api_key, model: openaiModel };
    }
    // 3. Eski ai_api_key fallback
    if (tenant.ai_api_key) {
        const p = tenant.ai_provider || 'gemini';
        return { provider: p, apiKey: tenant.ai_api_key, model: p === 'openai' ? openaiModel : geminiModel };
    }
    // 4. Key var ama toggle açık değilse yine kullan
    if (tenant.gemini_api_key) {
        return { provider: 'gemini', apiKey: tenant.gemini_api_key, model: geminiModel };
    }
    if (tenant.openai_api_key) {
        return { provider: 'openai', apiKey: tenant.openai_api_key, model: openaiModel };
    }
    return null;
}

interface IncomingPayload {
    channel: 'whatsapp' | 'messenger';
    phone: string;
    external_user_id: string;
    name: string;
    message: string;
    timestamp: string;
    message_id: string;
    phoneNumberId: string;
}

/**
 * Meta webhook body'sini normalize eder (WhatsApp veya Messenger)
 */
function parseIncomingPayload(body: any): IncomingPayload | null {
    // WhatsApp Business
    if (body.object === 'whatsapp_business_account') {
        if (
            body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
        ) {
            const msg = body.entry[0].changes[0].value.messages[0];
            const contact = body.entry[0].changes[0].value.contacts?.[0];
            const meta = body.entry[0].changes[0].value.metadata;
            return {
                channel: 'whatsapp',
                phone: msg.from,
                external_user_id: contact?.wa_id || msg.from,
                name: contact?.profile?.name || 'WhatsApp User',
                message: msg.text?.body || '',
                timestamp: msg.timestamp,
                message_id: msg.id,
                phoneNumberId: meta?.phone_number_id || '',
            };
        }
    }

    // Facebook Messenger
    if (body.object === 'page') {
        const msgData = body.entry?.[0]?.messaging?.[0];

        // Skip echo messages (our own outgoing messages reflected back)
        if (msgData?.message?.is_echo) {
            console.log('📤 Echo mesajı atlandı (kendi gönderdiğimiz mesaj)');
            return null;
        }

        if (msgData?.message?.text) {
            return {
                channel: 'messenger',
                phone: msgData.sender.id,
                external_user_id: msgData.sender.id,
                name: `FB User ${String(msgData.sender.id).slice(-4)}`,
                message: msgData.message.text,
                timestamp: String(msgData.timestamp),
                message_id: msgData.message.mid,
                phoneNumberId: body.entry[0].id,
            };
        }
    }

    return null;
}

/**
 * Tenant'ı kanal türüne göre eşleştirir.
 * WhatsApp → wa_phone_number_id, Messenger → fb_page_id
 */
async function findTenant(supabase: any, phoneNumberId: string, channel?: string) {
    const selectFields = 'id, ai_provider, ai_api_key, ai_system_prompt, ai_assistant_instructions, wa_phone_number_id, wa_access_token, fb_page_id, gemini_api_key, openai_api_key, is_gemini_enabled, is_openai_enabled, gemini_model, openai_model, name';

    // Messenger ise önce fb_page_id ile dene
    if (channel === 'messenger') {
        const { data } = await supabase
            .from('tenants')
            .select(selectFields)
            .eq('fb_page_id', phoneNumberId)
            .single();
        if (data) return data;
    }

    // WhatsApp veya fallback: wa_phone_number_id ile dene
    const { data } = await supabase
        .from('tenants')
        .select(selectFields)
        .eq('wa_phone_number_id', phoneNumberId)
        .single();
    if (data) return data;

    // Son fallback: ilk tenant'ı al (tek-tenant kurulumlar için)
    const { data: fallback } = await supabase
        .from('tenants')
        .select(selectFields)
        .limit(1)
        .single();

    return fallback || null;
}

/**
 * Telefon numarasına göre sohbet bul veya yeni oluştur
 */
async function findOrCreateConversation(
    supabase: any, tenantId: string, phone: string, messagePreview: string, channel: string = 'whatsapp'
) {
    const { data: existing } = await supabase
        .from('whatsapp_conversations')
        .select('id, ai_enabled')
        .eq('tenant_id', tenantId)
        .eq('phone_number', phone)
        .single();

    if (existing) {
        await supabase.from('whatsapp_conversations').update({
            last_message_at: new Date().toISOString(),
            last_message_preview: messagePreview.substring(0, 50),
            unread_count: 1,
            channel, // Ensure channel is always up-to-date
        }).eq('id', existing.id);

        return { conversationId: existing.id, aiEnabled: existing.ai_enabled };
    }

    // Yeni sohbet
    const { data: newConv } = await supabase.from('whatsapp_conversations').insert({
        tenant_id: tenantId,
        phone_number: phone,
        last_message_preview: messagePreview.substring(0, 50),
        unread_count: 1,
        ai_enabled: true,
        channel,
    }).select('id').single();

    return { conversationId: newConv?.id || null, aiEnabled: true };
}

/**
 * Varsayılan AI system prompt
 */
function getDefaultSystemPrompt(): string {
    return `Sen bir Türk gayrimenkul firmasının profesyonel satış danışmanısın.
Adın "Novo Danışmanı". Kısa, nazik ve bilgilendirici yanıtlar ver.
Müşteriye proje bilgileri, fiyatlar ve randevu alma konularında yardımcı ol.
Her zaman Türkçe yanıt ver. Agresif satış yapma, insan odaklı danışmanlık yaklaşımı sergile.
Eğer bir soruyu tam bilemiyorsan, "Bu konuyu hemen ofisteki ekip arkadaşlarıma teyit edip size dönüş yapacağım" gibi tamamen insani bir tepki ver.`;
}

/**
 * AI sağlayıcısına göre yanıt üretir (Gemini veya OpenAI)
 */
async function generateAIReply(
    provider: string,
    apiKey: string,
    systemPrompt: string,
    chatHistory: { role: string; parts: { text: string }[] }[],
    modelName?: string
): Promise<string | null> {
    try {
        if (provider === 'openai') {
            return await callOpenAI(apiKey, systemPrompt, chatHistory, modelName || 'gpt-4o-mini');
        }
        return await callGemini(apiKey, systemPrompt, chatHistory, modelName || 'gemini-2.5-flash');
    } catch (error) {
        console.error(`${provider} API Error:`, error);
        return null;
    }
}

/**
 * Google Gemini AI API
 */
async function callGemini(
    apiKey: string,
    systemPrompt: string,
    chatHistory: { role: string; parts: { text: string }[] }[],
    modelName: string = 'gemini-2.5-flash'
): Promise<string | null> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Model fallback list if 404 occurs
    const modelOptions = [
        modelName, 
        'gemini-2.5-flash', 
        'gemini-2.5-pro'
    ];
    
    // Remove duplicates
    const uniqueModels = [...new Set(modelOptions)];
    
    let lastError = null;
    
    for (const currentModel of uniqueModels) {
        try {
            console.log(`[AI] Attempting Gemini model: ${currentModel}`);
            const isLegacy = currentModel === 'gemini-pro';
            
            // Legacy models (gemini-pro) don't support systemInstruction in v1beta via SDK easily
            const modelConfig = isLegacy ? { model: currentModel } : { 
                model: currentModel, 
                systemInstruction: systemPrompt 
            };
            
            const model = genAI.getGenerativeModel(modelConfig);

            const chat = model.startChat({ history: chatHistory.slice(0, -1) }); // Son mesaj hariç geçmiş
            const lastMessage = chatHistory[chatHistory.length - 1]?.parts?.[0]?.text || '';
            const result = await chat.sendMessage(lastMessage);
            const text = result.response.text();
            
            console.log(`[AI] Successfully generated response using ${currentModel}`);
            return text || null;
            
        } catch (error: any) {
            console.warn(`[AI] Model ${currentModel} failed:`, error.message);
            lastError = error;
            // If it's a 404, we continue to the next fallback. Otherwise, break.
            if (error.message?.includes('404') || error.message?.includes('not found') || error.message?.includes('not supported')) {
                continue;
            } else {
                break; // E.g., API Key invalid, Rate limit, etc.
            }
        }
    }
    
    console.error(`[AI] All Gemini models failed. Last error:`, lastError);
    throw lastError;
}

/**
 * OpenAI Chat Completion API
 */
async function callOpenAI(
    apiKey: string,
    systemPrompt: string,
    chatHistory: { role: string; parts: { text: string }[] }[],
    modelName: string = 'gpt-4o-mini'
): Promise<string | null> {
    const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.map((m) => ({
            role: m.role === 'model' ? 'assistant' : 'user',
            content: m.parts[0].text,
        })),
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: modelName,
            messages,
            max_tokens: 500,
            temperature: 0.7,
        }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
}

/**
 * Veritabanından projeler ve müsait üniteler hakkında context çeker.
 */
async function getTenantCrmContext(supabase: any, tenantId: string): Promise<string> {
    try {
        const { data: projects } = await supabase
            .from('projects')
            .select('id, name, city, district, address, amenities, phase_count')
            .eq('tenant_id', tenantId)
            .eq('status', 'Active')
            .limit(10);

        const { data: units } = await supabase
            .from('units')
            .select('project_id, type, price, status')
            .eq('tenant_id', tenantId)
            .in('status', ['Available', 'Müsait', 'Reserved'])
            .limit(100);

        if (!projects || projects.length === 0) return '\n\n--- CRM ENVANTER BİLGİSİ ---\nŞu an aktif proje yok.';

        let context = '\n\n--- CRM ENVANTER BİLGİSİ (BU BİLGİLERİ MÜŞTERİYE SATIŞ YAPMAK İÇİN KULLAN) ---\n';
        for (const p of projects) {
            context += `\nProje Adı: ${p.name} (Şehir: ${p.city}${p.district ? ', İlçe: ' + p.district : ''})\n`;
            if (p.amenities && p.amenities.length > 0) {
                context += `  Sosyal Olanaklar: ${p.amenities.join(', ')}\n`;
            }
            const projUnits = (units || []).filter((u: any) => u.project_id === p.id);
            if (projUnits.length > 0) {
                context += `  Müsait Daire Tipleri ve Fiyatlar:\n`;
                const typeGroups: Record<string, { min: number; count: number }> = {};
                projUnits.forEach((u: any) => {
                    if (!typeGroups[u.type]) {
                        typeGroups[u.type] = { min: u.price, count: 1 };
                    } else {
                        typeGroups[u.type].count++;
                        if (u.price < typeGroups[u.type].min) typeGroups[u.type].min = u.price;
                    }
                });
                for (const [type, info] of Object.entries(typeGroups)) {
                    context += `    - ${type}: ${info.min > 0 ? info.min.toLocaleString('tr-TR') + ' TL\'den başlıyor' : 'Fiyat sorulmalı'} (${info.count} adet müsait)\n`;
                }
            } else {
                context += `  Şu an müsait daire yok, yeni etap açılacak.\n`;
            }
        }
        context += '------------------------------------------------\n';
        return context;
    } catch (e) {
        console.error('Error fetching CRM context:', e);
        return '';
    }
}
