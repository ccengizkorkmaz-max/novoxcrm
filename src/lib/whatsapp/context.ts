/**
 * WhatsApp Webhook – Context & Prompt Building
 *
 * CRM envanter bilgisi, müşteri contexti, bilgi bankası enjeksiyonu,
 * davranış kuralları ve final prompt montajı.
 */

import type { ChatMessage } from './types';

/**
 * Varsayılan AI system prompt
 */
export function getDefaultSystemPrompt(): string {
    return `Sen Novo'da çalışan tecrübeli bir gayrimenkul satış danışmanısın.
Kısa, samimi ve doğal konuş. Müşteri ile gerçek bir WhatsApp sohbeti yapıyorsun.
Uzun paragraflar yazma, mesajlaşma gibi kısa tut.
Müşterinin sorduğu soruya ÖNCE cevap ver, sonra gerekirse yönlendir.
Bilmediğin bir konuda "Hemen bakıp döneyim" de, uydurma.
ASLA link veya URL uydurma. Bilgi bankasında olmayan bir link paylaşma.`;
}

/**
 * Son 20 mesajı chat history formatına dönüştürür.
 */
export async function fetchChatHistory(supabase: any, conversationId: string): Promise<ChatMessage[]> {
    const { data: history } = await supabase
        .from('whatsapp_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(20);

    return (history || []).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
    }));
}

/**
 * Müşteri bilgisi contexti oluşturur (CRM verisi + aktivite geçmişi).
 */
export async function buildCustomerContext(
    supabase: any,
    tenantId: string,
    normalizedPhone: string,
    payloadName: string
): Promise<string> {
    let customerContext = `\n\n--- MÜŞTERİ BİLGİSİ (SİSTEM İÇİ - MÜŞTERİYE BUNLARI SÖYLEME) ---
Müşteri Telefonu: ${normalizedPhone}
Müşteri WhatsApp Adı: ${payloadName}
ÖNEMLİ: Müşteriye "numaranız kayıtlı", "sistemimizde kayıtlısınız" gibi ifadeler KULLANMA. Bu bilgileri sadece kendi referansın için kullan.`;

    // CRM'de eşleşen müşteri varsa bilgilerini ekle
    const phoneVariants = [normalizedPhone];
    if (normalizedPhone.startsWith('90') && normalizedPhone.length > 10) {
        phoneVariants.push(normalizedPhone.substring(2));
    }
    for (const variant of phoneVariants) {
        const { data: crmCustomer } = await supabase
            .from('customers')
            .select('id, full_name, email, notes, contact_type, budget_min, budget_max, desired_rooms, desired_districts')
            .eq('tenant_id', tenantId)
            .eq('phone', variant)
            .single();
        if (crmCustomer) {
            customerContext += `\nCRM Kayıtlı İsim: ${crmCustomer.full_name}`;
            customerContext += `\nÖNEMLİ HİTAP KURALI: Müşterinin gerçek adı CRM sistemimizde "${crmCustomer.full_name}" olarak kayıtlıdır. Müşteriye hitap ederken mutlaka bu ismi (CRM Kayıtlı İsim) baz alarak hitap et. Örneğin "${crmCustomer.full_name}" bir erkek adı olduğundan hitap ederken "Merhaba Şentürk Bey" veya "... Bey" şeklinde doğru hitap eki (Bey/Hanım) kullan. WhatsApp profil adı ("${payloadName}") farklı olsa dahi hitapta kesinlikle WhatsApp profil adını KULLANMA, her zaman CRM Kayıtlı İsim bilgisini kullan.`;
            if (crmCustomer.notes) customerContext += `\nMüşteri Notları: ${crmCustomer.notes}`;
            if (crmCustomer.budget_min || crmCustomer.budget_max) customerContext += `\nBütçe: ${crmCustomer.budget_min || '?'} - ${crmCustomer.budget_max || '?'} TL`;
            if (crmCustomer.desired_rooms) customerContext += `\nAranan Oda Sayısı: ${crmCustomer.desired_rooms}`;
            if (crmCustomer.desired_districts) customerContext += `\nAranan Bölge: ${crmCustomer.desired_districts}`;

            // Müşterinin aktivite/lead geçmişini çek
            const { data: activities } = await supabase
                .from('activities')
                .select('type, summary, description, topic, status, notes, project_id, projects(name), created_at')
                .eq('customer_id', crmCustomer.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (activities && activities.length > 0) {
                customerContext += `\n\n📋 MÜŞTERİ GEÇMİŞİ (Son ${activities.length} aktivite):`;
                for (const act of activities) {
                    const projectName = (act as any).projects?.name;
                    customerContext += `\n- [${act.type}] ${act.summary}`;
                    if (projectName) customerContext += ` | Proje: ${projectName}`;
                    if (act.description && act.description !== act.summary) customerContext += ` | ${act.description}`;
                    if (act.status) customerContext += ` (${act.status})`;
                }
                customerContext += `\nBu geçmişi kullanarak müşterinin daha önce ilgilendiği projelere referans ver, "Daha önce ... projemizle ilgilenmiştiniz" gibi doğal geçişler yap.`;
            }

            customerContext += `\nMüşterinin adı ve telefonu zaten biliniyor. Bu bilgileri SORMA ve müşteriye kayıtlısınız veya numaranız bizde var gibi şeyler ASLA SÖYLEME. Doğrudan sorusuna cevap ver.`;
            break;
        }
    }
    customerContext += `\n------------------------------------------------`;

    return customerContext;
}

/**
 * Base AI davranış kuralları (strict human persona)
 */
export function getStrictHumanPersona(): string {
    return `\n\nDAVRANIŞ KURALLARI:
1. Sen Novo'da çalışan deneyimli bir satış danışmanısın. Kendini tanıtma, kimliğinden bahsetme, doğrudan konuşmaya odaklan.
2. ASLA "insanım", "yapay zekayım", "asistanım" gibi kelimeler kullanma.
3. KONU DIŞI SORULAR: Müşteri futbol, hava durumu, siyaset gibi işle alakasız bir şey sorarsa, kısaca ve samimi şekilde cevapla. Sonra nazikçe konuyu gayrimenkule getir.
4. TEKRAR YAPMA: Önceki mesajlarda zaten söylediğin bilgileri tekrar etme. Yeni bilgi ver veya sorduğu soruya odaklan.
5. DOĞAL KONUŞMA: Her mesajda "Merhaba" deme. Kısa ve öz cevaplar ver. Uzun paragraflar yazma.
6. LEAD KALİFİKASYONU: Telefon numarasını ASLA sorma. Sistemde "CRM Kayıtlı İsim" bilgisi verilmişse, doğrudan o isme ve ismin cinsiyetine uygun doğru hitap ekiyle (Bey/Hanım) hitap et (Örn: "Şentürk Koca" için "Şentürk Bey"). İsmini tekrar sorma. Eğer CRM ismi yoksa, adını ilk mesajda doğal bir şekilde sor. WhatsApp profil ismini (farklı veya alakasız olabilir) hitapta kullanma, her zaman CRM'deki gerçek adı tercih et.
7. CRM verilerini kullanarak müşteriye bütçe/bölge tercihine göre proje öner.
8. KESİN YASAK: Müşteriye ASLA şunları söyleme: "numaranız kayıtlı", "numaranız bizde mevcut", "sistemimizde kayıtlısınız", "numaranız bizde var", "WhatsApp üzerinden iletişimde olduğumuza göre". Bu tarz CRM/sistem bilgilerini müşteriye AÇIKLAMA. Doğrudan sorduğu soruya cevap ver.

GİZLİ SİSTEM KOMUTLARI (SADECE ŞARTLAR SAĞLANDIĞINDA YANITININ EN SONUNA EKLE, MÜŞTERİ GÖRMEZ):
- Müşterinin Adını öğrendiğinde ve ilgi gösterdiğinde:
[LEAD_DATA: {"first_name": "Ad", "last_name": "Soyad", "notes": "Bütçe ve ilgi"}]
- HER YANITININ EN SONUNA, sohbetin genel havasına göre lead sıcaklık etiketi ekle:
  * [LEAD_SCORE:hot] → Müşteri fiyat soruyor, randevu istiyor, aranmak istiyor, satın alma niyeti belli, ödeme/taksit soruyor
  * [LEAD_SCORE:warm] → Müşteri proje hakkında detaylı bilgi istiyor (metrekare, kat planı, konum, teslim tarihi), özellik/avantaj soruyor, karşılaştırma yapıyor
  * [LEAD_SCORE:cold] → Bunların HİÇBİRİ yoksa COLD ver. Özellikle şu durumlarda KESİNLİKLE cold: otomatik yanıtlar ("Size nasıl yardımcı olabiliriz"), şikayetler, "ilgilenmiyorum/aramayın" gibi red yanıtları, tek kelimelik/anlamsız mesajlar, konu dışı sohbet, sadece selamlaşma
  ÖNEMLİ: Şüphede kalırsan COLD ver. Warm ve hot SADECE müşteri gayrimenkul satın alma konusunda gerçek ilgi gösterdiğinde kullanılır.
  Bu etiketi HER yanıtına MUTLAKA ekle.
9. LINK YASAĞI: Müşteriye ASLA kendin link/URL üretip paylaşma. Sadece bilgi bankasında birebir yazılı olan linkleri gönderebilirsin. Link yoksa "Hemen bakıp iletiyorum" de. Sahte link paylaşmak müşteriyi kaybettirir.`;
}

/**
 * Final AI prompt'unu birleştirir.
 */
export function assembleFinalPrompt(
    tenantData: any,
    crmContext: string,
    customerContext: string
): string {
    // CRM envanter bilgisi devre dışı - proje bilgileri system prompt'taki web sitesinden alınan Bilgi Bankası'ndan geliyor
    // Units tablosundaki veriler eksik/güncel olmayabilir, AI'ı yanıltıyor

    let knowledgeContext = tenantData.ai_knowledge_base ? `\n\n--- ŞİRKET BİLGİ BANKASI VE AKTİF PROJELER ---\n${tenantData.ai_knowledge_base}\n\nÖNEMLİ KURAL: Projeler hakkında SADECE yukarıdaki BİLGİ BANKASI'nda yazan bilgileri kullan. Bilmediğin veya bilgi bankasında yazmayan bir detay (fiyat, metrekare, teslim tarihi vb.) sorulursa ASLA uydurma, 'Bu detay şu an sistemimde mevcut değil, dilerseniz ilgili satış uzmanımızın size net bilgi vermesini sağlayabilirim' şeklinde yanıt ver.\nLİNK/URL YASAĞI: ASLA kendin link veya URL uydurma. Sadece yukarıdaki BİLGİ BANKASI'nda açıkça yazılmış linkleri paylaş. Bilgi bankasında link yoksa 'Linki şu an bulamadım, hemen bakıp iletiyorum' de. Olmayan site adresi, canlı izleme linki, sanal tur linki gibi URL'ler KESINLIKLE üretme.\n` : '';

    const basePrompt = tenantData.ai_system_prompt || tenantData.ai_assistant_instructions || getDefaultSystemPrompt();
    const strictHumanPersona = getStrictHumanPersona();

    return basePrompt + knowledgeContext + crmContext + customerContext + strictHumanPersona;
}

/**
 * Veritabanından projeler ve müsait üniteler hakkında context çeker.
 */
export async function getTenantCrmContext(supabase: any, tenantId: string): Promise<string> {
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
                context += `  Daire detayları için yukarıdaki PROJE BİLGİ BANKASI'na bak. Bu projenin satışa kapalı olduğu ANLAMINA GELMEZ.\n`;
            }
        }
        context += '------------------------------------------------\n';
        return context;
    } catch (e) {
        console.error('Error fetching CRM context:', e);
        return '';
    }
}
