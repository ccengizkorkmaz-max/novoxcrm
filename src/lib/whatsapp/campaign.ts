/**
 * WhatsApp Webhook – Campaign Reply Handling
 *
 * Kampanya şablonu quick-reply butonlarının işlenmesi:
 * "Evet arayın" → call_requested, satış panosu, hot lead bildirimi
 * "Hayır teşekkürler" → opted_out, disqualified
 */

import { sendWhatsAppTemplate } from '@/lib/whatsapp';

/**
 * Kampanya yanıtı olup olmadığını kontrol eder.
 */
export function isCampaignReply(msgNormalized: string): boolean {
    return msgNormalized === 'evet arayin' ||
           msgNormalized === 'evet, arayin' ||
           msgNormalized === 'hayir tesekkurler' ||
           msgNormalized === 'hayir, tesekkurler';
}

/**
 * Kampanya yanıtını işler (evet arayın / hayır teşekkürler).
 * true dönerse → AI chatbot'a gitmesine gerek yok, early return yap.
 */
export async function handleCampaignReply(
    supabase: any,
    tenantId: string,
    tenantData: any,
    conversationId: string,
    normalizedPhone: string,
    msgNormalized: string,
    payloadName: string
): Promise<boolean> {
    try {
        // Telefon ile müşteriyi bul
        const { data: customer } = await supabase.from('customers')
            .select('id, full_name')
            .or(`phone.ilike.%${normalizedPhone.slice(-10)}%`)
            .limit(1)
            .single();

        if (customer) {
            if (msgNormalized.startsWith('evet')) {
                // "Evet arayin" → call_requested olarak işaretle
                await supabase.from('lead_qualifications')
                    .update({ status: 'call_requested', interest_level: 'call_requested', updated_at: new Date().toISOString() })
                    .eq('customer_id', customer.id);
                
                await supabase.from('whatsapp_conversations')
                    .update({ lead_score: 'call_requested', updated_at: new Date().toISOString() })
                    .eq('id', conversationId);

                console.log(`✅ Kampanya yanıtı: ${normalizedPhone} → call_requested`);

                // ── Satış Panosuna (Ön Değerlendirme) Otomatik Ekle ──
                const { data: existingSale } = await supabase.from('sales')
                    .select('id')
                    .eq('customer_id', customer.id)
                    .in('status', ['Lead', 'Prospect', 'Proposal', 'Reservation', 'Negotiation', 'Contract'])
                    .maybeSingle();

                if (!existingSale) {
                    await supabase.from('sales').insert({
                        tenant_id: tenantId,
                        customer_id: customer.id,
                        status: 'Lead',
                        lead_origin: 'whatsapp_campaign'
                    });
                    console.log(`✅ ${customer.full_name} otomatik satış panosuna eklendi (Lead).`);
                }

                // ── Hot Lead Manager WhatsApp Bildirimi Tetikle ──
                try {
                    const { data: convCheck } = await supabase
                        .from('whatsapp_conversations')
                        .select('hot_lead_notified')
                        .eq('id', conversationId)
                        .single();

                    if (convCheck && !convCheck.hot_lead_notified) {
                        // Yüksek öncelikli bildirim/aktivite oluştur
                        await supabase.from('activities').insert({
                            tenant_id: tenantId,
                            type: 'Call',
                            topic: 'Sales',
                            summary: '📞 ARAMA TALEBİ (Evet Arayın)',
                            description: `Müşteri kampanya şablonundaki "Evet arayın" butonuna tıkladı. Telefon: ${normalizedPhone}`,
                            status: 'Pending',
                            priority: 'High',
                        });

                        // Tüm hot lead manager'ları bul
                        const { data: hotLeadManagers } = await supabase
                            .from('profiles')
                            .select('id, full_name, phone')
                            .eq('tenant_id', tenantId)
                            .eq('is_hot_lead_manager', true)
                            .eq('is_active', true);

                        if (hotLeadManagers && hotLeadManagers.length > 0) {
                            const customerName = customer.full_name || payloadName || 'Bilinmiyor';
                            const params = [
                                normalizedPhone,
                                customerName,
                                new Date().toLocaleString('tr-TR'),
                                `[ARAMA TALEBİ] Müşteri kampanya şablonuna "Evet arayın" yanıtını verdi. Arama talep ediyor.`
                            ].map(p => typeof p === 'string' ? p.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim() : p);

                            const accessToken = tenantData.wa_access_token;
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
                                        console.log(`🔥 Hot Lead (Arama Talebi) bildirimi gönderildi: ${manager.full_name} (${manager.phone})`);
                                    } catch (sendErr) {
                                        console.error(`Hot Lead (Arama Talebi) bildirim hatası (${manager.full_name}):`, sendErr);
                                    }
                                }
                            }
                        }

                        // Bu konuşma için bildirim gönderildiğini işaretle
                        await supabase.from('whatsapp_conversations').update({
                            hot_lead_notified: true,
                        }).eq('id', conversationId);
                    }
                } catch (notifyErr) {
                    console.error('Evet arayın bildirim hatası:', notifyErr);
                }
            } else {
                // "Hayir tesekkurler" → opted_out
                await supabase.from('lead_qualifications')
                    .update({ 
                        status: 'disqualified', 
                        interest_level: 'disqualified', 
                        call_notes: 'WhatsApp kampanyasından aranmak istemedi',
                        updated_at: new Date().toISOString()
                    })
                    .eq('customer_id', customer.id);
                
                await supabase.from('whatsapp_conversations')
                    .update({ lead_score: 'disqualified', updated_at: new Date().toISOString() })
                    .eq('id', conversationId);

                // Opt-out kaydı
                await supabase.from('outreach_optouts').upsert({
                    phone: normalizedPhone,
                    channel: 'ai_call',
                    reason: 'WhatsApp kampanyasından red',
                }, { onConflict: 'phone,channel' }).select();
                console.log(`🚫 Kampanya yanıtı: ${normalizedPhone} → opted_out`);
            }
        }
        // Kampanya yanıtı için AI chatbot'a girmesine gerek yok
        return true;
    } catch (err: any) {
        console.error('❌ Kampanya yanıt hatası:', err.message);
        return false;
    }
}
