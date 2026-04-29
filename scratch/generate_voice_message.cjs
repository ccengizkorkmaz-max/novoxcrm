// Çiçek sesiyle WhatsApp sesli mesaj oluştur
// Kullanım: node scratch/generate_voice_message.cjs "Mesaj metni" [dosya_adi]
const fs = require('fs');
const path = require('path');

const API_KEY = 'sk_f4e32161efcc2c63a39fd635d0f1241eac0241b1f4e67f03';
const VOICE_ID = 'EJGs6dWlD5VrB3llhBqB'; // Çiçek
const MODEL_ID = 'eleven_multilingual_v2';

const DEFAULT_MESSAGE = `Merhaba! Ben Çiçek, Novo Gayrimenkul'den arıyorum. İzmir Novo Vista projemiz hakkında sizinle kısa bir bilgi paylaşmak istedim. Projemiz İzmir'in en prestijli lokasyonunda, deniz manzaralı dairelerden oluşuyor. Eğer ilgilenirseniz, size detaylı bilgi vermekten memnuniyet duyarım. Bana bu numaradan yazabilirsiniz. İyi günler dilerim!`;

const messageText = process.argv[2] || DEFAULT_MESSAGE;
const fileName = process.argv[3] || 'whatsapp_mesaj';

const outDir = path.join(__dirname, 'voice_samples');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function generate() {
  const filepath = path.join(outDir, `${fileName}.mp3`);
  
  console.log('\n🎙️  Çiçek sesiyle mesaj oluşturuluyor...');
  console.log('─'.repeat(60));
  console.log(`📝 Metin: "${messageText}"`);
  console.log(`📂 Dosya: ${filepath}`);
  console.log('─'.repeat(60));

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text: messageText,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.30,
        similarity_boost: 0.60,
        style: 0.45,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`❌ HATA (${res.status}): ${err}`);
    return;
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(filepath, buffer);
  
  console.log(`\n✅ Ses dosyası oluşturuldu!`);
  console.log(`📁 Dosya: ${filepath}`);
  console.log(`📊 Boyut: ${(buffer.length / 1024).toFixed(1)} KB`);
  console.log(`\n💡 Bu dosyayı WhatsApp'tan müşteriye gönderebilirsiniz.`);
}

generate().catch(e => console.error('HATA:', e.message));
