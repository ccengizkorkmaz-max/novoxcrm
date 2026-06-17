/**
 * WhatsApp Webhook – Lead Detection & Scoring
 *
 * AI yanıtından gizli komutların çıkarılması:
 * [LEAD_SCORE:hot|warm|cold], [HOT_LEAD], [LEAD_DATA:{...}]
 * Hot/Warm lead bildirimi, satış panosuna otomatik ekleme.
 */

import { sendWhatsAppTemplate } from '@/lib/whatsapp';
import { extractAvailabilityPreferenceFromMessages } from '@/lib/utils/availability';

/**
 * Otomatik yanıt (auto-reply) pattern'leri.
 * Müşteriden gelen mesaj bunlardan birine eşleşiyorsa,
 * AI'ın verdiği skor ne olursa olsun 'cold' olarak override edilir.
 */
const AUTO_REPLY_PATTERNS = [
    /iletişime geçtiğiniz için teşekkür/i,
    /size nasıl yardımcı olabiliriz/i,
    /en kısa zamanda (cevap|dönüş|geri dönüş) (vereceğiz|yapacağız|sağlayacağız)/i,
    /mesajınız (alınmıştır|bize ulaşmıştır)/i,
    /otomatik (yanıt|cevap|mesaj)/i,
    /ofis saatleri (dışında|içinde)/i,
    /çalışma saatleri (dışında|içinde)/i,
    /thank you for (contacting|reaching|messaging|your message)/i,
    /how (can|may) (we|i) (help|assist) you/i,
    /we('ll| will) (get back|respond|reply) (to you )?(as soon as|shortly|promptly)/i,
    /your (message|inquiry) has been received/i,
    /this is an? auto(matic|mated)?[- ]?(reply|response|message)/i,
    /out of office/i,
    /currently (unavailable|away|busy)/i,
    /will respond during (business|office|working) hours/i,
];

/**
 * Verilen metin otomatik yanıt mı kontrol eder.
 */
function isAutoReplyMessage(text: string): boolean {
    return AUTO_REPLY_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * AI yanıtından LEAD_SCORE etiketini çıkarır ve conversation'ı günceller.
 * Temizlenmiş aiReply ve leadScore döner.
 */
export async function extractAndUpdateLeadScore(
    supabase: any,
    tenantId: string,
    conversationId: string,
    aiReply: string,
    lastUserMessage?: string
): Promise<{ aiReply: string; leadScore: string }> {
    let leadScore = 'unknown';
    // Genişletilmiş regex: hot, warm, cold, disqualified, call_requested
    const scoreMatch = aiReply.match(/\[LEAD_SCORE:(hot|warm|cold|disqualified|call_requested)\]/);
    if (scoreMatch) {
        leadScore = scoreMatch[1];
        aiReply = aiReply.replace(scoreMatch[0], '').trim();
        console.log(`🌡️ Lead Score (AI): ${leadScore}`);

        // ── AUTO-REPLY OVERRIDE ──
        // Müşterinin son mesajı otomatik yanıt ise, AI skoru ne derse desin cold'a düşür
        if (lastUserMessage && isAutoReplyMessage(lastUserMessage)) {
            if (leadScore === 'hot' || leadScore === 'warm' || leadScore === 'call_requested') {
                console.log(`⚠️ AUTO-REPLY TESPİT EDİLDİ: "${lastUserMessage.substring(0, 80)}..." → AI skoru ${leadScore} → cold'a override edildi`);
                leadScore = 'cold';
            }
        }

        // ─── Skor Yükseltme: Skor asla düşmez ───
        // Hiyerarşi: disqualified < cold < warm < hot (call_requested = hot seviyesi)
        const SCORE_HIERARCHY: Record<string, number> = {
            'unknown': 0,
            'disqualified': 0,
            'cold': 1,
            'warm': 2,
            'call_requested': 3,
            'hot': 3,
        };

        // Mevcut skoru kontrol et
        const { data: convData } = await supabase
            .from('whatsapp_conversations')
            .select('lead_score, customer_id')
            .eq('id', conversationId)
            .single();

        const currentScore = convData?.lead_score || 'unknown';
        const currentLevel = SCORE_HIERARCHY[currentScore] ?? 0;
        const newLevel = SCORE_HIERARCHY[leadScore] ?? 0;

        // disqualified özel durum: her zaman uygulanır (müşteri red etti)
        const finalScore = leadScore === 'disqualified'
            ? 'disqualified'
            : (newLevel >= currentLevel ? leadScore : currentScore);

        console.log(`🌡️ Skor kararı: ${currentScore}(${currentLevel}) → ${leadScore}(${newLevel}) = ${finalScore}`);

        // Conversation'ın lead_score'unu güncelle
        await supabase.from('whatsapp_conversations').update({
            lead_score: finalScore,
        }).eq('id', conversationId);

        // Öndeğerlendirme kaydının interest_level'ını da güncelle
        if (convData?.customer_id) {
            await supabase.from('lead_qualifications')
                .update({ interest_level: finalScore, updated_at: new Date().toISOString() })
                .eq('customer_id', convData.customer_id)
                .eq('tenant_id', tenantId);
            console.log(`📊 Lead qualification interest_level güncellendi: ${finalScore} (customer: ${convData.customer_id})`);
        }

        leadScore = finalScore;
    }
    return { aiReply, leadScore };
}



/**
 * [HOT_LEAD] etiketini temizler ve hot/warm lead tespiti yapar.
 * Bildirim gönderir, satış panosuna ekler.
 */
export async function processHotLeadDetection(
    supabase: any,
    tenantId: string,
    tenantData: any,
    conversationId: string,
    normalizedPhone: string,
    payloadName: string,
    aiReply: string,
    leadScore: string
): Promise<string> {
    // 2. HOT veya WARM LEAD tespiti (eski format uyumluluğu + yeni skor)
    let isHotLead = leadScore === 'hot' || leadScore === 'warm' || aiReply.includes('[HOT_LEAD]');
    if (aiReply.includes('[HOT_LEAD]')) {
        aiReply = aiReply.replace('[HOT_LEAD]', '').trim();
    }
 
    // Dedup: Bu konuşma için daha önce bildirim gönderilmiş mi kontrol et
    let alreadyNotified = false;
    let storedAvailabilityPref: string | null = null;
    let storedLeadScore = 'unknown';

    try {
        const { data: convCheck, error: selectError } = await supabase
            .from('whatsapp_conversations')
            .select('hot_lead_notified, lead_score, availability_preference')
            .eq('id', conversationId)
            .single();

        if (selectError) {
            console.warn('⚠️ Could not select availability_preference, falling back...', selectError.message);
            const { data: fallbackCheck } = await supabase
                .from('whatsapp_conversations')
                .select('hot_lead_notified, lead_score')
                .eq('id', conversationId)
                .single();
            
            alreadyNotified = fallbackCheck?.hot_lead_notified === true;
            storedLeadScore = fallbackCheck?.lead_score || 'unknown';
        } else if (convCheck) {
            alreadyNotified = convCheck.hot_lead_notified === true;
            storedLeadScore = convCheck.lead_score || 'unknown';
            storedAvailabilityPref = convCheck.availability_preference || null;
        }
    } catch (e) {
        console.error('Error checking whatsapp_conversations status:', e);
    }

    const conversationIsHot = isHotLead || storedLeadScore === 'hot' || storedLeadScore === 'warm';

    // Konuşma özetini oluştur (son 10 mesaj)
    let conversationSummary = '';
    let availabilityPref: string | null = null;
    
    try {
        const { data: recentMessages } = await supabase
            .from('whatsapp_messages')
            .select('role, content, created_at')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (recentMessages && recentMessages.length > 0) {
            // Müsaitlik/zaman tercihi tespiti
            availabilityPref = extractAvailabilityPreferenceFromMessages(recentMessages);

            conversationSummary = recentMessages
                .slice()
                .reverse()
                .map((m: any) => `${m.role === 'user' ? 'Müşteri' : 'AI'}: ${m.content.substring(0, 120).replace(/\n/g, ' ')}`)
                .join(' | ');
        }
    } catch (e) {
        console.error('Error fetching/parsing recent conversation messages:', e);
    }
 
    if (isHotLead && !alreadyNotified) {
        // 1. Müşteri adını ve ID'sini bul (CRM veya WhatsApp adı) - Duplicate kayıtları önlemek için order ve limit(1) kullanıyoruz
        let customerName = payloadName || 'Bilinmiyor';
        const phoneVariantsForLookup = [normalizedPhone];
        if (normalizedPhone.startsWith('90') && normalizedPhone.length > 10) {
            phoneVariantsForLookup.push(normalizedPhone.substring(2));       // 5xx
            phoneVariantsForLookup.push('+' + normalizedPhone);              // +90xxx
            phoneVariantsForLookup.push('0' + normalizedPhone.substring(2)); // 05xx
        }
        let customerId = null;
        for (const variant of phoneVariantsForLookup) {
            const { data: custs } = await supabase
                .from('customers')
                .select('id, full_name')
                .eq('tenant_id', tenantId)
                .eq('phone', variant)
                .order('created_at', { ascending: false })
                .limit(1);
            
            const cust = custs && custs.length > 0 ? custs[0] : null;
            if (cust?.full_name) {
                customerName = cust.full_name;
                customerId = cust.id;
                break;
            }
        }

        const availabilityNote = availabilityPref ? `\n\n📌 MÜSAİTLİK ZAMANI TERCİHİ: "${availabilityPref}"` : '';
 
        // Yüksek öncelikli bildirim/aktivite oluştur (müşteri ile ilişkilendirerek)
        await supabase.from('activities').insert({
            tenant_id: tenantId,
            customer_id: customerId,
            type: 'Call',
            topic: 'Sales',
            summary: leadScore === 'warm' ? '🌤️ ILIK SATIŞ (WARM LEAD)' : '🔥 ACİL SATIŞ (HOT LEAD)',
            description: (leadScore === 'warm' 
                ? `Novo AI ılık bir potansiyel tespit etti! Telefon: ${normalizedPhone}` 
                : `Novo AI bir satış kapatmak üzere! Müşteri hemen satın almak istiyor. Telefon: ${normalizedPhone}`) + availabilityNote,
            status: 'Pending',
            priority: 'High',
        });
        console.log('🔥 HOT LEAD DETECTED AND ALERT CREATED');
 
        // ── Hot Lead Manager WhatsApp Bildirimi ──
        try {
            // Tüm hot lead manager'ları bul
            const { data: hotLeadManagers } = await supabase
                .from('profiles')
                .select('id, full_name, phone')
                .eq('tenant_id', tenantId)
                .eq('is_hot_lead_manager', true)
                .eq('is_active', true);
 
            if (hotLeadManagers && hotLeadManagers.length > 0) {
                // ── Satış Panosuna (Ön Değerlendirme) Otomatik Ekle (AI Hot Lead) ──
                if (customerId) {
                    const { data: existingSale } = await supabase.from('sales')
                        .select('id')
                        .eq('customer_id', customerId)
                        .in('status', ['Lead', 'Prospect', 'Proposal', 'Reservation', 'Negotiation', 'Contract'])
                        .maybeSingle();
 
                    if (!existingSale) {
                        await supabase.from('sales').insert({
                            tenant_id: tenantId,
                            customer_id: customerId,
                            status: 'Lead',
                            lead_origin: 'whatsapp_ai'
                        });
                        console.log(`✅ ${customerName} (AI Hot Lead) otomatik satış panosuna eklendi (Lead).`);
                    }
                }
 
                // Her hot lead manager'a WhatsApp mesajı gönder
                const accessToken = tenantData.wa_access_token;
                const leadLabel = leadScore === 'warm' ? '[ILIK LEAD] ' : '[SICAK LEAD] ';
                const availabilityPrefix = availabilityPref ? `⚠️ [UYGUNLUK ZAMANI: ${availabilityPref.toUpperCase()}] ⚠️ ` : '';
                
                const params = [
                    normalizedPhone,
                    customerName,
                    new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
                    availabilityPrefix + leadLabel + (conversationSummary ? conversationSummary.substring(0, 480).replace(/\n/g, ' ') : 'Özet oluşturulamadı')
                ].map(p => typeof p === 'string' ? p.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim() : p);
 
                for (const manager of hotLeadManagers) {
                    if (manager.phone && accessToken && tenantData.wa_phone_number_id) {
                        try {
                            await sendWhatsAppTemplate(
                                manager.phone,
                                'crm_operasyonel_durum_bildirimi',
                                params,
                                'tr',
                                tenantData.wa_phone_number_id,
                                accessToken
                            );
                            console.log(`🔥 Hot Lead bildirimi gönderildi: ${manager.full_name} (${manager.phone})`);
                        } catch (sendErr) {
                            console.error(`Hot Lead bildirim hatası (${manager.full_name}):`, sendErr);
                        }
                    }
                }
            }
        } catch (hotLeadNotifyError) {
            console.error('Hot Lead Manager bildirim hatası:', hotLeadNotifyError);
        }
 
        // Bu konuşma için bildirim gönderildiğini işaretle (tekrar gönderilmesini önle) ve zaman tercihini kaydet
        try {
            const updatePayload: any = { hot_lead_notified: true };
            if (availabilityPref) {
                updatePayload.availability_preference = availabilityPref;
            }
            await supabase.from('whatsapp_conversations').update(updatePayload).eq('id', conversationId);
            console.log('✅ Konuşma hot_lead_notified ve availability_preference güncellendi');
        } catch (updErr) {
            console.error('Error updating whatsapp_conversations:', updErr);
        }
    } else if (conversationIsHot && availabilityPref && availabilityPref !== storedAvailabilityPref) {
        console.log(`⏱️ NEW/UPDATED AVAILABILITY PREFERENCE DETECTED: "${availabilityPref}" (was: "${storedAvailabilityPref}")`);
        
        let customerName = payloadName || 'Bilinmiyor';
        const phoneVariantsForLookup = [normalizedPhone];
        if (normalizedPhone.startsWith('90') && normalizedPhone.length > 10) {
            phoneVariantsForLookup.push(normalizedPhone.substring(2));
            phoneVariantsForLookup.push('+' + normalizedPhone);
            phoneVariantsForLookup.push('0' + normalizedPhone.substring(2));
        }
        let customerId = null;
        for (const variant of phoneVariantsForLookup) {
            const { data: custs } = await supabase
                .from('customers')
                .select('id, full_name')
                .eq('tenant_id', tenantId)
                .eq('phone', variant)
                .order('created_at', { ascending: false })
                .limit(1);
            
            const cust = custs && custs.length > 0 ? custs[0] : null;
            if (cust?.full_name) {
                customerName = cust.full_name;
                customerId = cust.id;
                break;
            }
        }

        // Log update activity
        await supabase.from('activities').insert({
            tenant_id: tenantId,
            customer_id: customerId,
            type: 'Note',
            topic: 'Sales',
            summary: '⏱️ MÜSAİTLİK ZAMANI GÜNCELLEMESİ',
            description: `Müşteri arama saat tercihini iletti/güncelledi: "${availabilityPref}"`,
            status: 'Completed',
            priority: 'High',
        });

        // Notify Hot Lead Managers of the update
        try {
            const { data: hotLeadManagers } = await supabase
                .from('profiles')
                .select('id, full_name, phone')
                .eq('tenant_id', tenantId)
                .eq('is_hot_lead_manager', true)
                .eq('is_active', true);

            if (hotLeadManagers && hotLeadManagers.length > 0) {
                const accessToken = tenantData.wa_access_token;
                const updateMessage = `⚠️ [UYGUNLUK ZAMANI GÜNCELLEMESİ] Müşteri uygun olduğu saati iletti: "${availabilityPref.toUpperCase()}" ⚠️`;
                
                const params = [
                    normalizedPhone,
                    customerName,
                    new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
                    updateMessage
                ].map(p => typeof p === 'string' ? p.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim() : p);

                for (const manager of hotLeadManagers) {
                    if (manager.phone && accessToken && tenantData.wa_phone_number_id) {
                        try {
                            await sendWhatsAppTemplate(
                                manager.phone,
                                'crm_operasyonel_durum_bildirimi',
                                params,
                                'tr',
                                tenantData.wa_phone_number_id,
                                accessToken
                            );
                            console.log(`🔥 Hot Lead saat güncellemesi bildirildi: ${manager.full_name} (${manager.phone})`);
                        } catch (sendErr) {
                            console.error(`Hot Lead güncelleme bildirim hatası (${manager.full_name}):`, sendErr);
                        }
                    }
                }
            }
        } catch (hotLeadNotifyError) {
            console.error('Hot Lead Manager güncelleme bildirim hatası:', hotLeadNotifyError);
        }

        // Update database
        try {
            await supabase.from('whatsapp_conversations')
                .update({ availability_preference: availabilityPref })
                .eq('id', conversationId);
            console.log('✅ availability_preference veritabanında güncellendi');
        } catch (updErr) {
            console.error('Error updating availability_preference:', updErr);
        }
    }
 
    return aiReply;
}

/**
 * [LEAD_DATA:{...}] etiketini çıkarır ve CRM'de müşteri oluşturur/günceller.
 */
export async function extractAndCreateLead(
    supabase: any,
    tenantId: string,
    normalizedPhone: string,
    channel: string,
    aiReply: string
): Promise<string> {
    const leadMatch = aiReply.match(/\[LEAD_DATA:\s*(\{.*?\})\s*\]/);
    if (leadMatch) {
        try {
            const leadData = JSON.parse(leadMatch[1]);
            aiReply = aiReply.replace(leadMatch[0], '').trim();
            
            // CRM'de müşteri oluştur veya güncelle
            const { data: existingCust } = await supabase.from('customers').select('id').eq('phone', normalizedPhone).single();
            if (!existingCust) {
                const fullName = `${leadData.first_name || ''} ${leadData.last_name || ''}`.trim() || 'WhatsApp Lead';
                await supabase.from('customers').insert({
                    tenant_id: tenantId,
                    full_name: fullName,
                    phone: normalizedPhone,
                    email: leadData.email || '',
                    source: channel,
                    contact_type: 'buyer',
                    notes: leadData.notes || null,
                });
                console.log(`✅ YENİ LEAD OLUŞTURULDU: ${fullName}`);
            }
        } catch (e) {
            console.error('Lead data parse error:', e);
        }
    }
    return aiReply;
}
