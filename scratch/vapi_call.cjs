// Kullanim: node scratch/vapi_call.cjs +905XXXXXXXXX "Musteri Adi"
const number = process.argv[2] || '+905335914389';
const name = process.argv[3] || 'Test';

const body = JSON.stringify({
  assistantId: '282a5b95-f9a7-43f0-b559-d469702021d7',
  phoneNumberId: '332d8dc6-ba02-404a-bb4d-44866957a2fa',
  customer: { number, name },
  name: `Novo Call - ${name}`,
});

fetch('https://api.vapi.ai/call', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer 56495e99-0cdc-41d4-8bd8-964b50ac908d',
    'Content-Type': 'application/json',
  },
  body,
})
.then(r => r.json())
.then(d => {
  if (d.error || d.message) {
    console.error('HATA:', d.message || d.error);
  } else {
    console.log(`✅ Arama baslatildi!`);
    console.log(`📞 Numara : ${number}`);
    console.log(`🆔 Call ID: ${d.id}`);
    console.log(`📊 Status : ${d.status}`);
  }
})
.catch(e => console.error('HATA:', e.message));
