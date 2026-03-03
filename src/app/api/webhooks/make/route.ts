import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();
        const { channel, external_user_id, message } = payload;

        if (!channel || !external_user_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // If message is empty (e.g. sticker, image, audio), acknowledge but skip AI
        if (!message || message.trim() === '') {
            return NextResponse.json({
                reply: 'Mesajınızı aldım, ancak metin içermeyen mesajlara şu an yanıt veremiyorum. Lütfen yazılı mesaj gönderin. 😊',
                lead_status: 'in_progress'
            });
        }

        const adminSupabase = createAdminClient();

        // 1. Get an active tenant. Default to the first active one, or one predefined.
        const { data: tenantData } = await adminSupabase
            .from('tenants')
            .select('id, name')
            .limit(1)
            .single();

        const tenantId = tenantData?.id;
        if (!tenantId) {
            return NextResponse.json({ error: 'No active tenant found' }, { status: 500 });
        }

        // 2. Fetch or Create Session
        let { data: session } = await adminSupabase
            .from('messaging_sessions')
            .select('*')
            .eq('channel', channel)
            .eq('external_user_id', external_user_id)
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        // Session Timeout Logic: If the session is older than 24 hours, we start a new one
        const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
        if (session) {
            const lastUpdate = new Date(session.updated_at).getTime();
            const now = new Date().getTime();
            if (now - lastUpdate > SESSION_TIMEOUT) {
                // Mark old session as closed/expired could be done here
                session = null;
            }
        }

        if (!session) {
            const { data: newSession, error: sessionErr } = await adminSupabase
                .from('messaging_sessions')
                .insert({
                    tenant_id: tenantId,
                    channel,
                    external_user_id,
                    status: 'active'
                })
                .select('*')
                .single();

            if (sessionErr) throw new Error("Failed to create session: " + sessionErr.message);
            session = newSession;
        }

        // Fetch historical messages for the session
        const { data: messages } = await adminSupabase
            .from('messaging_messages')
            .select('role, content')
            .eq('session_id', session.id)
            .order('created_at', { ascending: true });

        const history = messages || [];

        // Store current user message
        const { error: msgErr } = await adminSupabase.from('messaging_messages').insert({
            session_id: session.id,
            role: 'user',
            content: message
        });

        if (msgErr) throw new Error("Failed to store message: " + msgErr.message);

        // Update session's last_message_at
        await adminSupabase.from('messaging_sessions')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', session.id);

        // Fetch active projects for this tenant to provide to AI
        const { data: allProjects } = await adminSupabase
            .from('projects')
            .select('id, name, city')
            .eq('tenant_id', tenantId)
            .eq('status', 'Active');

        // 3. Prepare AI Interaction
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API key missing' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const systemPrompt = `Sen Novo CRM için çalışan sanal gayrimenkul asistanısın. 
Görevin, müşterinin aradığı projeyi saptamak ve onlara doğru projeyi önermektir.
Mevcut projelerimiz: ${JSON.stringify(allProjects || [])}.
Müşteri ile iletişim kanalın: ${channel}. 

Hedeflerin:
1. Müşterinin ismini ve telefon numarasını kibarca öğrenmek. İsim ve numarayı bir arada ya da ayrı ayrı alabilirsin.
2. Bu temel bilgileri doğrulamadan detaylı proje dokümanları veya kesin fiyatlar paylaşmamak.
3. Müşteri ciddi bir alıcı izlenimi bırakıyorsa ve geçerli bir isim-telefon aldıysan cevabının sonuna şu özel etiketi ekle: [LEAD_QUALIFIED]
4. Müşteri ısrarla gerçek bir insanla konuşmak isterse veya asabi davranırsa cevabının sonuna şu özel etiketi ekle: [HUMAN_REQUIRED]

Daima:
- Kısa, net, yardımsever ve kurumsal bir üslup kullan.
- Emoji kullanabilirsin.
- Asla müşteriye uzun destanlar yazma (telefon ekranında okuyacaklar).
- Bilmediğin konularda "bilmiyorum" de.`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", systemInstruction: systemPrompt });

        // Build history in the format required by Gemini
        const chatHistory = history.map(h => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }]
        }));

        // Gemini history MUST start with 'user' role
        const firstUserIndex = chatHistory.findIndex(m => m.role === 'user');
        let validHistory = firstUserIndex >= 0 ? chatHistory.slice(firstUserIndex) : chatHistory;

        const chat = model.startChat({ history: validHistory });

        // Retry logic for Gemini API rate limits (429)
        let responseText = '';
        let geminiAttempt = 0;
        while (geminiAttempt < 2) {
            try {
                const result = await chat.sendMessage(message);
                responseText = result.response.text();
                break; // success, exit retry loop
            } catch (geminiErr: any) {
                geminiAttempt++;
                const is429 = geminiErr?.message?.includes('429') || geminiErr?.message?.includes('Resource exhausted');
                if (is429 && geminiAttempt < 2) {
                    // Wait 2 seconds and retry once
                    await new Promise(res => setTimeout(res, 2000));
                } else if (is429) {
                    // Exhausted retries - return a graceful message instead of crashing
                    return NextResponse.json({
                        reply: 'Şu anda yoğun talepler nedeniyle gecikmeli yanıt veriyoruz. Lütfen birkaç saniye sonra tekrar yazınız. 🙏',
                        lead_status: 'in_progress'
                    });
                } else {
                    throw geminiErr; // Re-throw non-429 errors
                }
            }
        }

        const isQualified = responseText.includes('[LEAD_QUALIFIED]');
        const isHumanRequired = responseText.includes('[HUMAN_REQUIRED]');

        let cleanReply = responseText
            .replace(/\[LEAD_QUALIFIED\]/g, '')
            .replace(/\[HUMAN_REQUIRED\]/g, '')
            .replace(/\\/g, '/') // Replace backslashes
            .replace(/"/g, "'")  // Replace double quotes
            .replace(/[\x00-\x1F\x7F-\x9F\u2028\u2029]/g, ' ') // Strip ALL control chars + UTF-16 separators
            .replace(/\s+/g, ' ') // Collapse spaces
            .trim();

        // Debug: Log length to see if it correlates with error position
        console.log(`AI Reply sanitized (len: ${cleanReply.length}): ${cleanReply.substring(0, 50)}...`);

        const finalReply = cleanReply + " [V3]";
        let leadStatus = 'in_progress';

        if (isHumanRequired) {
            leadStatus = 'human_required';
        } else if (isQualified) {
            leadStatus = 'qualified';
        }

        // Store assistant message
        await adminSupabase.from('messaging_messages').insert({
            session_id: session.id,
            role: 'assistant',
            content: cleanReply
        });

        if (leadStatus !== 'in_progress') {
            await adminSupabase.from('messaging_sessions')
                .update({ status: leadStatus })
                .eq('id', session.id);
        }

        // 4. Contact and Pipeline Lead creation
        if (isQualified && !session.customer_id) {
            try {
                const extractionModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                const fullContext = history.map(h => `${h.role}: ${h.content}`).join('\n') + `\nuser: ${message}`;

                const extractionResult = await extractionModel.generateContent(`
                    Aşağıdaki konuşma geçmişinden müşterinin "isim_soyisim", "telefon" ve eğer bahsetmişse "proje_id" bilgilerini ayıkla (proje adı varsa elimizdeki listeyle eşleştir).
                    SADECE saf JSON formatında döndür. Markdown blokları kullanma (örn. \`\`\`json ekleme).
                    Eğer isim veya telefon yoksa değerini null bırak. Proje listesi: ${JSON.stringify(allProjects || [])}.
                    Format: {"full_name": "Ahmet Yılmaz", "phone": "05321234567", "project_id": "uuid-here" veya null}
                    
                    Konuşma:
                    ${fullContext}
                `);

                let jsonText = extractionResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                const leadData = JSON.parse(jsonText);

                if (leadData.full_name && leadData.phone) {
                    // Create customer
                    const { data: customerData, error: customerErr } = await adminSupabase.from('customers').insert({
                        tenant_id: tenantId,
                        full_name: leadData.full_name,
                        phone: leadData.phone,
                        source: channel, /* e.g. facebook_messenger */
                        notes: `Otomatik olarak AI Asistanı (${channel}) tarafından oluşturuldu. PSID: ${external_user_id}`
                    }).select('id').single();

                    if (!customerErr && customerData) {
                        const customerId = customerData.id;

                        // Create sale pipeline logic (Assuming lead creates a sale record)
                        let saleParams: any = {
                            tenant_id: tenantId,
                            customer_id: customerId,
                            status: 'Lead',
                            description: `AI Asistanı (${channel}) ile görüşüldü.`
                        };

                        // Add dummy unit or project based on schema: 
                        // Our schema has unit_id, assigned_to etc. "project_id" column might exist in sales table now (added via a migration) 
                        // Let's just create raw Sale record
                        const { data: saleData } = await adminSupabase.from('sales').insert(saleParams).select('id').single();

                        // Update session to link
                        await adminSupabase.from('messaging_sessions').update({
                            customer_id: customerId,
                            sale_id: saleData?.id
                        }).eq('id', session.id);
                    }
                }
            } catch (e) {
                console.error("Qualification extraction or CRM insertion failed: ", e);
            }
        }

        // Revalidate the conversations pages for real-time-like update
        revalidatePath('/conversations')
        revalidatePath(`/conversations/${session.id}`)

        return NextResponse.json({
            reply: finalReply,
            lead_status: leadStatus
        });

    } catch (err: any) {
        console.error("AI Messaging Webhook Error: ", err);
        return NextResponse.json({
            error: "Internal Server Error",
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }, { status: 500 });
    }
}
