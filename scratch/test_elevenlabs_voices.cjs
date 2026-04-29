// ElevenLabs Türkçe ses testi — her sesi aynı cümleyle test eder
// Ses dosyaları scratch/voice_samples/ altına kaydedilir
const fs = require('fs');
const path = require('path');

const API_KEY = 'sk_f4e32161efcc2c63a39fd635d0f1241eac0241b1f4e67f03';

// Test cümlesi — gerçek cold call açılışı
const TEST_TEXT = `Merhaba! Ben Mert, Novo Gayrimenkul'den arıyorum. İzmir Novo Vista projemiz hakkında sizinle konuşmak isterim, uygun musunuz?`;

// Türkçe sesler
const TURKISH_VOICES = [
  { id: 'EJGs6dWlD5VrB3llhBqB', name: 'Cicek' },
  { id: 'gyxPK6bLXQAkBSCeAKvk', name: 'Sultan' },
  { id: 'uvU9jrgGLWNPeNA4NgNT', name: 'Irem' },
  { id: 'NbxPoSbxk2KEIE26f6NL', name: 'Muge' },
  { id: 'fXhoW006nc5Wf8xkGVSy', name: 'Yunus' },
  { id: 'z2ObNnp0E5ZGeTlSXkX0', name: 'Mert_Aksoy' },
];

// Test edilecek modeller
const MODELS = [
  'eleven_multilingual_v2',
  'eleven_turbo_v2_5',
];

const outDir = path.join(__dirname, 'voice_samples');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function generateSample(voice, modelId) {
  const modelShort = modelId.replace('eleven_', '').replace('_', '');
  const filename = `${voice.name}_${modelShort}.mp3`;
  const filepath = path.join(outDir, filename);

  // Skip if already generated
  if (fs.existsSync(filepath)) {
    console.log(`⏭️  ${filename} zaten var, atlaniyor...`);
    return;
  }

  console.log(`🎙️  ${voice.name} (${modelId}) oluşturuluyor...`);

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice.id}`, {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: TEST_TEXT,
        model_id: modelId,
        voice_settings: {
          stability: 0.50,
          similarity_boost: 0.70,
          style: 0.20,
          use_speaker_boost: true,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`   ❌ HATA (${res.status}): ${err}`);
      return;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filepath, buffer);
    console.log(`   ✅ Kaydedildi: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error(`   ❌ ${voice.name}: ${err.message}`);
  }
}

async function main() {
  console.log('\n🔊 ElevenLabs Türkçe Ses Testi');
  console.log('─'.repeat(60));
  console.log(`📝 Test cümlesi: "${TEST_TEXT}"`);
  console.log(`📂 Çıktı klasörü: ${outDir}`);
  console.log('─'.repeat(60) + '\n');

  for (const model of MODELS) {
    console.log(`\n━━━ Model: ${model} ━━━\n`);
    for (const voice of TURKISH_VOICES) {
      await generateSample(voice, model);
      // Rate limit koruması
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log('✅ Tüm sesler oluşturuldu!');
  console.log(`📂 Dosyalar: ${outDir}`);
  
  // Dosya listesi
  const files = fs.readdirSync(outDir).filter(f => f.endsWith('.mp3'));
  console.log(`\n📋 Oluşturulan ${files.length} dosya:`);
  files.forEach(f => {
    const size = (fs.statSync(path.join(outDir, f)).size / 1024).toFixed(1);
    console.log(`   🎵 ${f} (${size} KB)`);
  });
}

main();
