import { NextRequest, NextResponse } from 'next/server';

const VAPI_API_KEY = '56495e99-0cdc-41d4-8bd8-964b50ac908d';
const VAPI_BASE_URL = 'https://api.vapi.ai';
const ASSISTANT_ID = '282a5b95-f9a7-43f0-b559-d469702021d7';
const PHONE_NUMBER_ID = '332d8dc6-ba02-404a-bb4d-44866957a2fa'; // Twilio - international enabled

// Project-specific first messages
const PROJECT_MESSAGES: Record<string, string> = {
  'izmir-novo-vista': "Merhaba! Ben Novo Gayrimenkul'den Irem. Izmir Novo Vista projemizi sizinle paylasmak istedim, uygun musunuz?",
  'querencia': "Merhaba! Ben Novo Gayrimenkul'den Irem. Kuzey Kibris Iskele'deki Querencia projemizi sizinle paylasmak istedim, uygun musunuz?",
  'la-vista': "Merhaba! Ben Novo Gayrimenkul'den Irem. Long Beach'teki La Vista projemizi sizinle paylasmak istedim, uygun musunuz?",
  'courtyard-platinum': "Merhaba! Ben Novo Gayrimenkul'den Irem. Courtyard Platinum projemizi sizinle paylasmak istedim, uygun musunuz?",
  'grand-sapphire': "Merhaba! Ben Novo Gayrimenkul'den Irem. Grand Sapphire projemizi sizinle paylasmak istedim, uygun musunuz?",
};


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
    
    if (action === 'projects') {
      return NextResponse.json(Object.keys(PROJECT_MESSAGES).map(key => ({
        id: key,
        name: key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        firstMessage: PROJECT_MESSAGES[key],
      })));
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
    const { phoneNumber, customerName, projectId, action } = body;
    
    // Get project-specific first message
    const firstMessage = projectId && PROJECT_MESSAGES[projectId] 
      ? PROJECT_MESSAGES[projectId]
      : undefined;
    
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
          
          // Override firstMessage if project-specific
          const itemMessage = item.projectId && PROJECT_MESSAGES[item.projectId]
            ? PROJECT_MESSAGES[item.projectId]
            : firstMessage;
            
          if (itemMessage) {
            callPayload.assistantOverrides = { firstMessage: itemMessage };
          }
          
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
    
    if (projectId) {
        crmContext += `İlgilendiği Konu/Proje: ${projectId}\n`;
    }
    // ---------------------------
    
    // Check for custom script/voice overrides from the request body
    const { customPrompt, customVoiceId, voiceSettings } = body;

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
    const overrides: any = {
        firstMessageMode: 'assistant-waits-for-user'
    };
    // if (firstMessage) overrides.firstMessage = firstMessage; // Removing hardcoded firstMessage as the LLM will generate it based on the prompt
    
    // System prompt override
    // We append the CRM context so the AI knows exactly who they are talking to
    const finalPrompt = customPrompt 
        ? `${customPrompt}\n\n=== CRM BİLGİSİ ===\n${crmContext}`
        : `Sen Novo Gayrimenkul danışmanısın. Müşteriyi arıyorsun.\n\n=== CRM BİLGİSİ ===\n${crmContext}`;

    overrides.model = {
        messages: [
            {
                role: "system",
                content: finalPrompt
            }
        ]
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
