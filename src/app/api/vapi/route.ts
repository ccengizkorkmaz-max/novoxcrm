import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const VAPI_API_KEY = process.env.VAPI_API_KEY!;
const VAPI_BASE_URL = 'https://api.vapi.ai';
const ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID!;




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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

// POST - Create outbound call (via lib/vapi.ts — tek kaynak)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { phoneNumber, customerName, action, customPrompt, customFirstMessage, customVoiceId } = body;

    // Kullanıcının tenant bilgilerini al
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const adminSupabase = createAdminClient();

    const { data: profile } = await adminSupabase.from('profiles').select('tenant_id').eq('id', user.id).single();
    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const { data: tenantData } = await adminSupabase.from('tenants').select('ai_assistant_instructions, ai_knowledge_base').eq('id', profile.tenant_id).single();

    // Prompt oluştur (custom yoksa tenant ayarlarından)
    let systemPrompt = customPrompt;
    if (!systemPrompt) {
      systemPrompt = tenantData?.ai_assistant_instructions || "Sen Novo Gayrimenkul danışmanısın. Müşteriyi arıyorsun.";
      if (tenantData?.ai_knowledge_base) {
        systemPrompt += `\n\n--- ŞİRKET BİLGİ BANKASI VE AKTİF PROJELER ---\n${tenantData.ai_knowledge_base}\n\nÖNEMLİ KURAL: Projeler hakkında SADECE yukarıdaki BİLGİ BANKASI'nda yazan bilgileri kullan. Bilmediğin veya bilgi bankasında yazmayan bir detay (fiyat, metrekare, teslim tarihi vb.) sorulursa ASLA uydurma, 'Bu detay şu an sistemimde mevcut değil, dilerseniz ilgili satış uzmanımızın size net bilgi vermesini sağlayabilirim' şeklinde yanıt ver.\n`;
      }
    }

    // Webhook URL'i belirle
    const host = request.headers.get('host') || 'oikoscrm.com';
    const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
    const serverUrl = `${protocol}://${host}/api/webhooks/vapi`;

    const { makeOutboundCall, getTurkishNameTitle } = await import('@/lib/vapi');

    if (action === 'batch') {
      // Batch call - multiple numbers
      const { phoneNumbers } = body;
      const results = [];

      for (const item of phoneNumbers) {
        try {
          const result = await makeOutboundCall({
            phoneNumber: item.number,
            systemPrompt,
            firstMessage: customFirstMessage,
            voiceId: customVoiceId,
            serverUrl,
            metadata: {
              tenant_id: profile.tenant_id,
              type: 'batch_call'
            }
          });
          results.push({ success: result.success, number: item.number, callId: result.callId, error: result.error });

          // Rate limit koruması
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

    // CRM context: müşteri bilgisi ekle
    let cleanPhone = phoneNumber.replace('+', '');
    if (cleanPhone.startsWith('90')) cleanPhone = cleanPhone.substring(2);

    const { data: customers } = await adminSupabase.from('customers')
      .select('id, full_name, phone')
      .eq('tenant_id', profile.tenant_id)
      .ilike('phone', `%${cleanPhone}%`)
      .limit(1);

    const crmCustomer = customers?.[0];
    let crmContext = `Müşteri Adı: ${crmCustomer?.full_name || customerName || 'Bilinmiyor'}\n`;

    if (crmCustomer) {
      const { data: activities } = await adminSupabase.from('activities')
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

    const finalPrompt = `${systemPrompt}\n\n=== CRM BİLGİSİ ===\n${crmContext}`;

    const nameWithTitle = getTurkishNameTitle(crmCustomer?.full_name || customerName);
    const resolvedFirstMessage = customFirstMessage || (nameWithTitle ? `Merhaba ${nameWithTitle}, size Novo İnşaat'tan ulaşıyorum. Ben Çiçek, nasılsınız?` : "Merhaba, size Novo İnşaat'tan ulaşıyorum. Ben Çiçek, nasılsınız?");

    const result = await makeOutboundCall({
      phoneNumber,
      systemPrompt: finalPrompt,
      firstMessage: resolvedFirstMessage,
      voiceId: customVoiceId,
      serverUrl,
      metadata: {
        tenant_id: profile.tenant_id,
        customer_id: crmCustomer?.id,
        type: 'manual_call'
      }
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ id: result.callId, callId: result.callId, success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
