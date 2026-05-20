import { NextRequest, NextResponse } from 'next/server';

const VAPI_API_KEY = process.env.VAPI_API_KEY || '56495e99-0cdc-41d4-8bd8-964b50ac908d';
const VAPI_BASE_URL = 'https://api.vapi.ai';
const ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID || '282a5b95-f9a7-43f0-b559-d469702021d7';
const PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID || '332d8dc6-ba02-404a-bb4d-44866957a2fa';

// ─── Türkçe Sesli Arama Kuralları (her aramaya enjekte edilir) ───
const TURKISH_VOICE_RULES = `
=== DİL VE TELAFFUZ KURALLARI (KESİNLİKLE UYULMALIDIR) ===
1. SADECE TÜRKÇE KONUŞ. Hiçbir koşulda İngilizce kelime, cümle veya ifade kullanma.
2. Daire tipleri her zaman Türkçe okunmalıdır:
   - "1+1" → "bir artı bir" olarak söyle
   - "1+0" → "bir artı sıfır" olarak söyle
   - "2+1" → "iki artı bir" olarak söyle
   - "3+1" → "üç artı bir" olarak söyle
   - "4+1" → "dört artı bir" olarak söyle
   - "2+0" → "iki artı sıfır" olarak söyle
3. Rakamları ve birimleri Türkçe oku:
   - "m²" veya "metrekare" → "metrekare" olarak söyle
   - "50 m²" → "elli metrekare" olarak söyle
   - "2.000.000 TL" → "iki milyon TL" olarak söyle
   - "3.990.000 TL" → "üç milyon dokuz yüz doksan bin TL" olarak söyle
   - "%35" → "yüzde otuz beş" olarak söyle
4. Proje isimlerini olduğu gibi Türkçe aksanla söyle:
   - "NOVO Park Vista" → "Novo Park Vista" (İngilizce aksanla değil, Türkçe aksanla söyle)
   - "NOVO City İzmir" → "Novo Siti İzmir" (İngilizce aksanla "city" deme)
   - "NOVO Park Montenegro" → "Novo Park Montenegro" (doğal Türkçe aksanla)
5. Kısaltmaları açık söyle:
   - "OSB" → "Organize Sanayi Bölgesi" olarak söyle
   - "MİA" → "Merkezi İş Alanı" olarak söyle
   - "AB" → "Avrupa Birliği" olarak söyle
6. Tarih ve zamanları Türkçe söyle:
   - "Haziran 2026" → "Haziran iki bin yirmi altı"
   - "Aralık 2027" → "Aralık iki bin yirmi yedi"
7. Samimi ama profesyonel bir Türkçe ile konuş. Doğal, akıcı cümleler kur.
8. "Efendim", "Buyurun", "Tabii ki" gibi Türkçe nezaket kalıplarını kullan.
9. Müşteriyle konuşurken kesinlikle teknik jargon kullanma, sade ve anlaşılır Türkçe tercih et.
=== DİL KURALLARI SONU ===
`;




async function vapiRequest(endpoint: string, method: string = 'GET', body?: unknown) {
  const res = await fetch(`${VAPI_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Vapi API Error: ${res.status} - ${error}`);
  }

  return res.json();
}

// GET - List calls or get call details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('callId');
    const action = searchParams.get('action');

    if (action === 'assistant') {
      const data = await vapiRequest(`/assistant/${ASSISTANT_ID}`);
      return NextResponse.json(data);
    }



    if (callId) {
      const data = await vapiRequest(`/call/${callId}`);
      return NextResponse.json(data);
    }

    // List recent calls - Vapi returns paginated { value: [], Count: N }
    const data = await vapiRequest('/call?limit=50&sortOrder=DESC');
    const calls = Array.isArray(data) ? data : (data?.value ?? data?.results ?? []);
    return NextResponse.json(calls);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Create outbound call
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, customerName, action } = body;

    if (action === 'batch') {
      // Batch call - multiple numbers
      const { phoneNumbers } = body;
      const results = [];

      for (const item of phoneNumbers) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const callPayload: any = {
            assistantId: ASSISTANT_ID,
            phoneNumberId: PHONE_NUMBER_ID,
            customer: {
              number: item.number,
              name: item.name || undefined,
            },
            name: `Novo Call - ${item.name || item.number}`,
          };



          const callData = await vapiRequest('/call', 'POST', callPayload);
          results.push({ success: true, number: item.number, callId: callData.id });

          // Small delay between batch calls to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          results.push({ success: false, number: item.number, error: message });
        }
      }

      return NextResponse.json({ results });
    }

    // Single call
    if (!phoneNumber) {
      return NextResponse.json({ error: 'phoneNumber is required' }, { status: 400 });
    }

    // --- CRM CONTEXT LOOKUP ---
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const supabase = createAdminClient();

    let cleanPhone = phoneNumber.replace('+', '');
    if (cleanPhone.startsWith('90')) cleanPhone = cleanPhone.substring(2);

    const { data: customers } = await supabase.from('customers')
      .select('id, full_name, phone')
      .ilike('phone', `%${cleanPhone}%`)
      .limit(1);

    const crmCustomer = customers?.[0];
    let crmContext = `Müşteri Adı: ${crmCustomer?.full_name || customerName || 'Bilinmiyor'}\n`;

    const { data: tenants } = await supabase.from('tenants').select('*').not('ai_knowledge_base', 'is', null).limit(1);
    let tenantData = tenants?.[0];
    if (!tenantData) {
        // Fallback if no tenant has knowledge base
        const { data: anyTenants } = await supabase.from('tenants').select('*').limit(1);
        tenantData = anyTenants?.[0] || {};
    }

    if (crmCustomer) {
      const { data: activities } = await supabase.from('activities')
        .select('type, description, created_at')
        .eq('customer_id', crmCustomer.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (activities && activities.length > 0) {
        crmContext += `Son Etkileşim: ${activities[0].type} - ${activities[0].description}\n`;
      } else {
        crmContext += `Son Etkileşim: Yok (İlk Arama)\n`;
      }
    }


    // ---------------------------

    // Check for custom script/voice overrides from the request body
    const { customPrompt, customFirstMessage, customVoiceId, voiceSettings } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callPayload: any = {
      assistantId: ASSISTANT_ID,
      phoneNumberId: PHONE_NUMBER_ID,
      customer: {
        number: phoneNumber,
        name: crmCustomer?.full_name || customerName || undefined,
      },
      name: `Novo Call - ${crmCustomer?.full_name || customerName || phoneNumber}`,
    };

    // We will build assistantOverrides dynamically
    const overrides: any = {};
    if (customFirstMessage) {
      overrides.firstMessage = customFirstMessage;
    } else {
      overrides.firstMessageMode = 'assistant-waits-for-user';
    }
    // if (firstMessage) overrides.firstMessage = firstMessage; // Removing hardcoded firstMessage as the LLM will generate it based on the prompt

    // System prompt override
    // We append the CRM context so the AI knows exactly who they are talking to
    let basePrompt = customPrompt;
    if (!basePrompt) {
        basePrompt = tenantData.ai_assistant_instructions || "Sen Novo Gayrimenkul danışmanısın. Müşteriyi arıyorsun.";
        if (tenantData.ai_knowledge_base) {
             basePrompt += `\n\n--- ŞİRKET BİLGİ BANKASI VE AKTİF PROJELER ---\n${tenantData.ai_knowledge_base}\n\nÖNEMLİ KURAL: Projeler hakkında SADECE yukarıdaki BİLGİ BANKASI'nda yazan bilgileri kullan. Bilmediğin veya bilgi bankasında yazmayan bir detay (fiyat, metrekare, teslim tarihi vb.) sorulursa ASLA uydurma, 'Bu detay şu an sistemimde mevcut değil, dilerseniz ilgili satış uzmanımızın size net bilgi vermesini sağlayabilirim' şeklinde yanıt ver.\n`;
        }
    }
    
    const finalPrompt = `${TURKISH_VOICE_RULES}\n${basePrompt}\n\n=== CRM BİLGİSİ ===\n${crmContext}`;

    overrides.model = {
      provider: "openai",
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: finalPrompt
        }
      ]
    };

    // Lead scoring analysis — Vapi extracts structured data after call ends
    overrides.analysisPlan = {
      structuredDataPrompt: `Görüşme transkriptini analiz et ve aşağıdaki JSON yapısını doldur. Türkçe konuşma bağlamını dikkate al.`,
      structuredDataSchema: {
        type: 'object',
        properties: {
          lead_score: { type: 'string', enum: ['hot', 'warm', 'follow_up', 'disqualified'], description: 'Müşterinin sıcaklık skoru' },
          interested: { type: 'boolean', description: 'Müşteri ilgileniyor mu?' },
          investment_timeline: { type: 'string', enum: ['1-3_months', '3-6_months', '6plus_months', 'unknown'], description: 'Yatırım zamanlaması' },
          purpose: { type: 'string', enum: ['investment', 'residence', 'both', 'unknown'], description: 'Yatırım mı oturum mu?' },
          preferred_unit_type: { type: 'string', description: 'Tercih edilen daire tipi (1+1, 2+1, vb.)' },
          budget_mentioned: { type: 'boolean', description: 'Bütçe konuşuldu mu?' },
          wants_callback: { type: 'boolean', description: 'Tekrar aranmak istiyor mu?' },
          wants_catalog: { type: 'boolean', description: 'Katalog/bilgi istiyor mu?' },
          wants_appointment: { type: 'boolean', description: 'Randevu istiyor mu?' },
          rejection_reason: { type: 'string', description: 'Red sebebi (varsa)' },
          notes: { type: 'string', description: 'Görüşme hakkında kısa not (Türkçe)' },
        },
        required: ['lead_score', 'interested', 'notes'],
      },
      summaryPrompt: 'Bu telefon görüşmesini Türkçe olarak 2-3 cümleyle özetle. Müşterinin ilgi düzeyini ve sonraki adımı belirt.',
      successEvaluationPrompt: 'Müşteri randevu aldı veya detaylı bilgi talep etti ise başarılı say.',
      successEvaluationRubric: 'PassFail',
    };

    // Optimize start speaking plan to reduce the silence delay
    overrides.startSpeakingPlan = {
      waitSeconds: 0.1
    };

    // Voice override
    if (customVoiceId) {
      overrides.voice = {
        provider: "eleven_labs",
        voiceId: customVoiceId,
      };
      // Apply voice settings if provided
      if (voiceSettings) {
        overrides.voice.stability = voiceSettings.stability ?? 0.5;
        overrides.voice.similarityBoost = voiceSettings.similarityBoost ?? 0.7;
        overrides.voice.style = voiceSettings.style ?? 0;
        overrides.voice.useSpeakerBoost = voiceSettings.useSpeakerBoost ?? true;
      }
    }

    if (Object.keys(overrides).length > 0) {
      callPayload.assistantOverrides = overrides;
    }

    const callData = await vapiRequest('/call', 'POST', callPayload);

    return NextResponse.json(callData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
