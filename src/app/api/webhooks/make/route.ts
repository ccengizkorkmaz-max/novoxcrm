import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();
        const { channel, external_user_id, message } = payload;

        if (!channel || !external_user_id || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

        // Check if session already qualified or human required
        if (session.status === 'qualified' || session.status === 'human_required') {
            return NextResponse.json({
                reply: session.status === 'human_required'
                    ? "Müşteri temsilcilerimiz size en kısa sürede dönüş yapacaktır."
                    : "Sizinle yakında iletişime geçeceğiz.",
                lead_status: session.status
            });
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
        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        const isQualified = responseText.includes('[LEAD_QUALIFIED]');
        const isHumanRequired = responseText.includes('[HUMAN_REQUIRED]');

        let cleanReply = responseText.replace('[LEAD_QUALIFIED]', '').replace('[HUMAN_REQUIRED]', '').trim();
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

        return NextResponse.json({
            reply: cleanReply,
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
