// ElevenLabs Voice Library'deki sesleri listele
const API_KEY = 'sk_f4e32161efcc2c63a39fd635d0f1241eac0241b1f4e67f03';

fetch('https://api.elevenlabs.io/v1/voices', {
  headers: { 'xi-api-key': API_KEY }
})
.then(r => r.json())
.then(data => {
  console.log(`\n🎤 ElevenLabs Ses Kütüphanesi (${data.voices?.length || 0} ses)\n`);
  console.log('─'.repeat(90));
  
  if (!data.voices) {
    console.log('Ses bulunamadı:', data);
    return;
  }
  
  data.voices.forEach((v, i) => {
    const labels = v.labels ? Object.entries(v.labels).map(([k,val]) => `${k}:${val}`).join(', ') : '';
    const category = v.category || 'unknown';
    console.log(`\n${i+1}. ${v.name}`);
    console.log(`   ID       : ${v.voice_id}`);
    console.log(`   Kategori : ${category}`);
    console.log(`   Dil      : ${labels}`);
    console.log(`   Önizleme : ${v.preview_url ? '✅ var' : '❌ yok'}`);
  });
  
  console.log('\n' + '─'.repeat(90));
  console.log(`\nToplam: ${data.voices.length} ses`);
})
.catch(e => console.error('HATA:', e.message));
