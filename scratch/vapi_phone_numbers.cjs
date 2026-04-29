// Vapi'nin mevcut telefon numaralarını listele + yeni ücretsiz numara oluştur
const VAPI_API_KEY = '56495e99-0cdc-41d4-8bd8-964b50ac908d';

async function listPhoneNumbers() {
  console.log('\n📱 Mevcut Vapi telefon numaraları:\n');
  
  const res = await fetch('https://api.vapi.ai/phone-number', {
    headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` },
  });
  const numbers = await res.json();
  
  if (Array.isArray(numbers)) {
    numbers.forEach((n, i) => {
      console.log(`  ${i+1}. ${n.number || n.sipUri || 'N/A'}`);
      console.log(`     ID      : ${n.id}`);
      console.log(`     Provider: ${n.provider}`);
      console.log(`     Name    : ${n.name || 'N/A'}`);
      console.log('');
    });
    console.log(`Toplam: ${numbers.length} numara`);
  } else {
    console.log('Yanıt:', JSON.stringify(numbers, null, 2));
  }
}

async function createFreeNumber() {
  console.log('\n🆕 Ücretsiz Vapi numarası oluşturuluyor...\n');
  
  const res = await fetch('https://api.vapi.ai/phone-number', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      provider: 'vapi',
      // Vapi free number — no extra config needed
    }),
  });
  
  const data = await res.json();
  
  if (data.error || data.message) {
    console.error(`❌ HATA: ${data.message || JSON.stringify(data)}`);
    return;
  }
  
  console.log(`✅ Ücretsiz numara oluşturuldu!`);
  console.log(`   Numara : ${data.number}`);
  console.log(`   ID     : ${data.id}`);
  console.log(`   Provider: ${data.provider}`);
  console.log(`\n💡 Bu numara ile herhangi bir numarayı arayabilirsiniz!`);
}

const action = process.argv[2] || 'list';

if (action === 'create') {
  createFreeNumber();
} else {
  listPhoneNumbers();
}
