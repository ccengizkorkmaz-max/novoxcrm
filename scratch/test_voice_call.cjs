/**
 * Vapi ses testi — doğallık ayarları ince ayarlanmış
 * 
 * Kullanım:
 *   node scratch/test_voice_call.cjs                       → Sesleri listele
 *   node scratch/test_voice_call.cjs 5                     → Yunus (multilingual, doğal ayar)
 *   node scratch/test_voice_call.cjs 5 turbo               → Yunus (turbo, doğal ayar)
 *   node scratch/test_voice_call.cjs 5 turbo robot         → Yunus (turbo, eski robotik ayar — karşılaştırma)
 */

const VAPI_API_KEY = '56495e99-0cdc-41d4-8bd8-964b50ac908d';
const PHONE_NUMBER_ID = '332d8dc6-ba02-404a-bb4d-44866957a2fa';
const CUSTOMER_NUMBER = '+905335914389';

const TURKISH_VOICES = [
  { id: 'EJGs6dWlD5VrB3llhBqB', name: 'Çiçek', desc: 'Kadın, genç, enerjik, social media tarzı' },
  { id: 'gyxPK6bLXQAkBSCeAKvk', name: 'Sultan', desc: 'Kadın, orta yaş, İstanbul aksanı, anlatıcı' },
  { id: 'uvU9jrgGLWNPeNA4NgNT', name: 'İrem', desc: 'Kadın, orta yaş, İstanbul aksanı, otoriter' },
  { id: 'NbxPoSbxk2KEIE26f6NL', name: 'Müge', desc: 'Kadın, orta yaş, İstanbul aksanı, dengeli/derin' },
  { id: 'fXhoW006nc5Wf8xkGVSy', name: 'Yunus', desc: 'Erkek, orta yaş, İstanbul aksanı, yumuşak/doğal' },
  { id: 'z2ObNnp0E5ZGeTlSXkX0', name: 'Mert Aksoy', desc: 'Erkek, orta yaş, İstanbul aksanı, ciddi (mevcut)' },
];

// Ses profilleri
const VOICE_PRESETS = {
  // Daha doğal/insani — düşük stability = ses tonu değişimi, yüksek style = ifade
  natural: {
    stability: 0.30,
    similarityBoost: 0.60,
    style: 0.45,
    useSpeakerBoost: true,
    label: '🧑 Doğal (düşük stability, yüksek style)',
  },
  // Eski ayar — karşılaştırma için
  robot: {
    stability: 0.50,
    similarityBoost: 0.70,
    style: 0.20,
    useSpeakerBoost: true,
    label: '🤖 Standart (önceki ayar)',
  },
};

const SYSTEM_PROMPT = `Sen Novo Gayrimenkul'ün satış danışmanısın. Adın Çiçek.

Bu bir SES TESTİ aramasıdır. Şu şekilde davran:

1. Açılış cümleni söyle: "Merhaba! Ben Çiçek, Novo Gayrimenkul'den arıyorum. İzmir Novo Vista projemiz hakkında sizinle konuşmak isterim."
2. Sonra kısa bir tanıtım yap: "Projemiz İzmir'in en prestijli lokasyonunda, deniz manzaralı dairelerden oluşuyor. Fiyatlar 3 milyon TL'den başlıyor."
3. Müşteriye sor: "Yatırım amaçlı mı yoksa oturum amaçlı mı düşünüyorsunuz?"
4. Müşterinin cevabına göre doğal şekilde konuş.
5. Kıbrıs projelerinden de bahset: Querencia, La Vista, Courtyard Platinum, Grand Sapphire.

KONUŞMA KURALLARI:
- Türkçe konuş, doğal ve samimi ol, sanki gerçek bir arkadaşınla konuşuyormuş gibi
- "Eee", "şey", "yani" gibi doğal dolgu kelimeleri kullan (ama abartma)
- Her seferinde SADECE bir soru sor
- Kısa ve net konuş, uzun monolog yapma
- Proje isimlerini doğru telaffuz et: "İzmir Novo Vista" (iki ayrı kelime)
- Samimi ama profesyonel ol`;

async function callWithVoice(voice, modelId, preset) {
  const firstMessage = `Merhaba! Ben Çiçek, Novo Gayrimenkul'den arıyorum. İzmir Novo Vista projemiz hakkında sizinle kısa bir konuşma yapmak isterim, uygun musunuz?`;

  const body = {
    phoneNumberId: PHONE_NUMBER_ID,
    customer: {
      number: CUSTOMER_NUMBER,
      name: 'Cengiz Bey',
    },
    name: `Ses Testi - ${voice.name} (${modelId.includes('turbo') ? 'turbo' : 'multi'}) [${preset === 'natural' ? 'doğal' : 'standart'}]`,
    assistant: {
      name: `Test - ${voice.name}`,
      firstMessage,
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        temperature: 0.7,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }],
      },
      voice: {
        provider: '11labs',
        voiceId: voice.id,
        model: modelId,
        ...VOICE_PRESETS[preset],
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

  // label'ı body'den sil (Vapi'ye gönderilmemeli)
  delete body.assistant.voice.label;

  console.log(`\n📞 ${voice.name} ile aranıyor...`);
  console.log(`   Model  : ${modelId}`);
  console.log(`   Preset : ${VOICE_PRESETS[preset].label}`);
  console.log(`   Stability: ${VOICE_PRESETS[preset].stability} | Style: ${VOICE_PRESETS[preset].style}`);
  console.log(`   Numara : ${CUSTOMER_NUMBER}`);

  try {
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
      console.error(`   ❌ HATA: ${data.message || data.error}`);
      return null;
    }

    console.log(`   ✅ Arama başlatıldı!`);
    console.log(`   🆔 Call ID: ${data.id}`);
    return data.id;
  } catch (err) {
    console.error(`   ❌ ${err.message}`);
    return null;
  }
}

// ─── Main ────────────────────────────────────────────────────
const arg1 = process.argv[2];
const arg2 = process.argv[3];
const arg3 = process.argv[4];

if (!arg1) {
  console.log('\n🎤 Test edilebilir Türkçe sesler:\n');
  console.log('─'.repeat(70));
  TURKISH_VOICES.forEach((v, i) => {
    console.log(`  ${i + 1}. ${v.name.padEnd(14)} → ${v.desc}`);
  });
  console.log('─'.repeat(70));
  console.log('\nKullanım:');
  console.log('  node scratch/test_voice_call.cjs <no|isim> [turbo] [robot]');
  console.log('\nÖrnekler:');
  console.log('  node scratch/test_voice_call.cjs 5              → Yunus, doğal ayar');
  console.log('  node scratch/test_voice_call.cjs 5 turbo        → Yunus, turbo model');
  console.log('  node scratch/test_voice_call.cjs 5 turbo robot  → Yunus, turbo, eski ayar');
  process.exit(0);
}

// Ses seçimi
let selectedVoice;
const num = parseInt(arg1);
if (!isNaN(num) && num >= 1 && num <= TURKISH_VOICES.length) {
  selectedVoice = TURKISH_VOICES[num - 1];
} else {
  const search = arg1.toLowerCase();
  selectedVoice = TURKISH_VOICES.find(v => v.name.toLowerCase().includes(search));
}

if (!selectedVoice) {
  console.error(`❌ Ses bulunamadı: "${arg1}"`);
  process.exit(1);
}

// Model seçimi
const allArgs = [arg2, arg3].filter(Boolean).map(a => a.toLowerCase());
const modelId = allArgs.includes('turbo') ? 'eleven_turbo_v2_5' : 'eleven_multilingual_v2';
const preset = allArgs.includes('robot') ? 'robot' : 'natural';

console.log(`\n🎯 Seçilen: ${selectedVoice.name} | ${modelId} | ${preset}`);

callWithVoice(selectedVoice, modelId, preset);
