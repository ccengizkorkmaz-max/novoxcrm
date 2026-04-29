/**
 * Vapi ile arama yap + canlı diyaloğu takip et
 * 
 * Kullanım:
 *   node scratch/call_and_watch.cjs +905322109040 "Müşteri Adı"
 */

const VAPI_API_KEY = '56495e99-0cdc-41d4-8bd8-964b50ac908d';
const PHONE_NUMBER_ID = '332d8dc6-ba02-404a-bb4d-44866957a2fa';

const CUSTOMER_NUMBER = process.argv[2] || '+905322109040';
const CUSTOMER_NAME = process.argv[3] || 'Müşteri';

const VOICE_ID = 'EJGs6dWlD5VrB3llhBqB'; // Çiçek
const MODEL_ID = 'eleven_multilingual_v2';

const SYSTEM_PROMPT = `Sen Novo Gayrimenkul'ün satış danışmanısın. Adın Çiçek.

PROJELER - Proje adlarını TAM VE DOĞRU söyle:
1. "İzmir Novo Vista" (İ-z-m-i-r N-o-v-o V-i-s-t-a, iki ayrı kelime) - İzmir'de prestijli konut projesi
2. "Querencia" - Kuzey Kıbrıs İskele'de lüks rezidans, 85.000 GBP'den başlıyor
3. "La Vista" - Long Beach'te deniz manzaralı daireler, 75.000 GBP'den başlıyor
4. "Courtyard Platinum" - Lefkoşa yakınında kira garantili yatırım
5. "Grand Sapphire" - Otel konseptli rezidans, yıllık %8-10 kira getirisi

ÖNEMLI: Proje adlarını değiştirme, kısaltma veya birleştirme. Asla "Novovista" veya "Novavista" deme, her zaman "Novo Vista" de.

KONUŞMA KURALLARI:
- Türkçe konuş, doğal ve samimi ol
- Her seferinde SADECE bir soru sor, cevabı bekle
- Müşteri konuşurken ASLA kesme
- Kısa ve net konuş, uzun monolog yapma
- Müşteri ismini UYDURMA, ismini bilmiyorsan "Siz" diye hitap et
- Amacın randevu veya WhatsApp numarası almak

SOHBET AKIŞI:
1. Müşteri uygun mu → zaten soruldu, cevabı dinle
2. Yatırım mı, konut mu diye sor
3. Bütçeyi öğren
4. En uygun projeyi öner
5. Randevu veya WhatsApp numarası al`;

const FIRST_MESSAGE = `Merhaba! Ben Çiçek, Novo Gayrimenkul'den arıyorum. İzmir Novo Vista projemiz hakkında sizinle kısa bir konuşma yapmak isterim, uygun musunuz?`;

async function startCall() {
  console.log(`\n📞 Arama başlatılıyor...`);
  console.log(`   Numara: ${CUSTOMER_NUMBER}`);
  console.log(`   Ses: Çiçek (doğal ayar)`);
  console.log('─'.repeat(60));

  const body = {
    phoneNumberId: PHONE_NUMBER_ID,
    customer: { number: CUSTOMER_NUMBER, name: CUSTOMER_NAME },
    name: `Çiçek → ${CUSTOMER_NAME} (${new Date().toLocaleTimeString('tr-TR')})`,
    assistant: {
      name: 'Çiçek - Novo Gayrimenkul',
      firstMessage: FIRST_MESSAGE,
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        temperature: 0.7,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }],
      },
      voice: {
        provider: '11labs',
        voiceId: VOICE_ID,
        model: MODEL_ID,
        stability: 0.30,
        similarityBoost: 0.60,
        style: 0.45,
        useSpeakerBoost: true,
      },
      transcriber: {
        provider: 'deepgram',
        model: 'nova-3',
        language: 'tr',
      },
      startSpeakingPlan: {
        waitSeconds: 1.4,
        smartEndpointingEnabled: true,
      },
      stopSpeakingPlan: {
        voiceSeconds: 0.3,
        backoffSeconds: 1.5,
      },
    },
  };

  const res = await fetch('https://api.vapi.ai/call', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (data.error || data.message) {
    console.error(`❌ HATA: ${data.message || data.error}`);
    process.exit(1);
  }

  console.log(`✅ Arama başlatıldı! Call ID: ${data.id}\n`);
  return data.id;
}

async function watchCall(callId) {
  let lastMessageCount = 0;
  let lastStatus = '';
  let checks = 0;
  const MAX_CHECKS = 120; // 4 dakika max

  console.log('🔴 CANLI DİYALOG');
  console.log('═'.repeat(60));

  while (checks < MAX_CHECKS) {
    checks++;
    await new Promise(r => setTimeout(r, 2000)); // 2 saniyede bir kontrol

    try {
      const res = await fetch(`https://api.vapi.ai/call/${callId}`, {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` },
      });
      const call = await res.json();

      // Status değişimi
      if (call.status !== lastStatus) {
        lastStatus = call.status;
        const statusEmoji = {
          'queued': '⏳',
          'ringing': '🔔',
          'in-progress': '🟢',
          'forwarding': '↗️',
          'ended': '🔴',
        }[call.status] || '❓';
        console.log(`\n${statusEmoji} Status: ${call.status.toUpperCase()}`);
        if (call.status === 'in-progress') {
          console.log('═'.repeat(60));
        }
      }

      // Transcript mesajları
      if (call.messages && call.messages.length > lastMessageCount) {
        const newMessages = call.messages.slice(lastMessageCount);
        for (const msg of newMessages) {
          if (msg.role === 'assistant' || msg.role === 'bot') {
            console.log(`\n🤖 Çiçek: ${msg.message || msg.content || ''}`);
          } else if (msg.role === 'user') {
            console.log(`\n👤 Müşteri: ${msg.message || msg.content || ''}`);
          } else if (msg.role === 'system' && msg.message) {
            // system mesajları (ör. tool calls) gösterme
          }
        }
        lastMessageCount = call.messages.length;
      }

      // Transcript (alternatif format)
      if (call.transcript && !call.messages) {
        process.stdout.write('.');
      }

      // Arama bitti mi?
      if (call.status === 'ended') {
        console.log('\n' + '═'.repeat(60));
        console.log('📊 ARAMA ÖZETİ');
        console.log('─'.repeat(60));
        console.log(`  Süre        : ${call.duration ? call.duration + 's' : 'N/A'}`);
        console.log(`  Bitiş nedeni: ${call.endedReason || 'N/A'}`);
        
        if (call.analysis) {
          if (call.analysis.summary) console.log(`  Özet        : ${call.analysis.summary}`);
          if (call.analysis.successEvaluation) console.log(`  Başarı      : ${call.analysis.successEvaluation}`);
        }

        // Tam transcript
        if (call.transcript) {
          console.log('\n📝 TAM TRANSKRIPT:');
          console.log('─'.repeat(60));
          console.log(call.transcript);
        }

        // Artifact (kayıt URL'si)
        if (call.recordingUrl) {
          console.log(`\n🎙️ Kayıt: ${call.recordingUrl}`);
        }
        if (call.stereoRecordingUrl) {
          console.log(`🎙️ Stereo Kayıt: ${call.stereoRecordingUrl}`);
        }

        break;
      }
    } catch (err) {
      // Sessizce devam et
    }
  }

  if (checks >= MAX_CHECKS) {
    console.log('\n⏰ Zaman aşımı — izleme durduruluyor.');
  }
}

// ─── Main ────────────────────────────────────────────────────
(async () => {
  const callId = await startCall();
  await watchCall(callId);
})();
