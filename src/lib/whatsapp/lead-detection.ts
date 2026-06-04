/**
 * WhatsApp Webhook – Lead Detection & Scoring
 *
 * AI yanıtından gizli komutların çıkarılması:
 * [LEAD_SCORE:hot|warm|cold], [HOT_LEAD], [LEAD_DATA:{...}]
 * Hot/Warm lead bildirimi, satış panosuna otomatik ekleme.
 */

import { sendWhatsAppTemplate } from '@/lib/whatsapp';

/**
 * AI yanıtından LEAD_SCORE etiketini çıkarır ve conversation'ı günceller.
 * Temizlenmiş aiReply ve leadScore döner.
 */
export async function extractAndUpdateLeadScore(
    supabase: any,
    tenantId: string,
    conversationId: string,
    aiReply: string
): Promise<{ aiReply: string; leadScore: string }> {
    let leadScore = 'unknown';
    // Genişletilmiş regex: hot, warm, cold, disqualified, call_requested
    const scoreMatch = aiReply.match(/\[LEAD_SCORE:(hot|warm|cold|disqualified|call_requested)\]/);
    if (scoreMatch) {
        leadScore = scoreMatch[1];
        aiReply = aiReply.replace(scoreMatch[0], '').trim();
        console.log(`🌡️ Lead Score (AI): ${leadScore}`);

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
    if (isHotLead) {
        const { data: convCheck } = await supabase
            .from('whatsapp_conversations')
            .select('hot_lead_notified')
            .eq('id', conversationId)
            .single();
        alreadyNotified = convCheck?.hot_lead_notified === true;
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

        // Yüksek öncelikli bildirim/aktivite oluştur (müşteri ile ilişkilendirerek)
        await supabase.from('activities').insert({
            tenant_id: tenantId,
            customer_id: customerId,
            type: 'Call',
            topic: 'Sales',
            summary: leadScore === 'warm' ? '🌤️ ILIK SATIŞ (WARM LEAD)' : '🔥 ACİL SATIŞ (HOT LEAD)',
            description: leadScore === 'warm' ? `Novo AI ılık bir potansiyel tespit etti! Telefon: ${normalizedPhone}` : `Novo AI bir satış kapatmak üzere! Müşteri hemen satın almak istiyor. Telefon: ${normalizedPhone}`,
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
                // Konuşma özetini oluştur (son 10 mesaj)
                const { data: recentMessages } = await supabase
                    .from('whatsapp_messages')
                    .select('role, content, created_at')
                    .eq('conversation_id', conversationId)
                    .order('created_at', { ascending: false })
                    .limit(10);

                let conversationSummary = '';
                if (recentMessages && recentMessages.length > 0) {
                    conversationSummary = recentMessages
                        .reverse()
                        .map((m: any) => `${m.role === 'user' ? 'Müşteri' : 'AI'}: ${m.content.substring(0, 120).replace(/\n/g, ' ')}`)
                        .join(' | ');
                }

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
                const params = [
                    normalizedPhone,
                    customerName,
                    new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
                    leadLabel + (conversationSummary ? conversationSummary.substring(0, 480).replace(/\n/g, ' ') : 'Özet oluşturulamadı')
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

        // Bu konuşma için bildirim gönderildiğini işaretle (tekrar gönderilmesini önle)
        await supabase.from('whatsapp_conversations').update({
            hot_lead_notified: true,
        }).eq('id', conversationId);
        console.log('✅ Konuşma hot_lead_notified olarak işaretlendi');
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
