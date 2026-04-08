const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// JSON KEY KONTROLÜ
const keyFilePath = path.join(__dirname, '../google-indexer-key.json');
if (!fs.existsSync(keyFilePath)) {
    console.error("HATA: google-indexer-key.json dosyası bulunamadı.");
    process.exit(1);
}

// BATCH 3 - Batch1 ve Batch2'de GÖNDERİLMEMİŞ kalan slug'lar
// Batch1 (ilk 40): core URLs + 32 wiki slug (insaat-crm-nedir ... serefiye-hesaplama-yontemleri-rehber)
// Batch2 (36): excel-musteri-takibi-zorluklar-cozum ... opsiyonlama-takibi-dijital-sistem + 4 core

const batch3Slugs = [
    // Sorun Çözme kategorisi - Batch2'de olmayan yeniler
    'hatali-odeme-plani-olusturma-sorun-cozum',
    'tapu-takip-surecleri-dijital-yonetim',
    'crm-mobil-uygulama-senkronizasyon-sorunu',
    'satis-ofisi-merkez-ofis-iletisim-kopuklugu',
    'm2-birim-fiyati-hesaplama-hatalari',
    'yanlis-satis-sozlesmesi-riskleri-onlemler',
    // Sektörel Çözümler
    'konut-kredisi-uygunluk-sorgulama-sistemi',
    'gayrimenkul-senet-basim-ve-takip-programi',
    'kdv-muafiyetli-konut-satisi-takibi',
    'rol-tabanli-veri-erisim-kisitlamasi-crm',
    'santiye-satis-ofisi-veri-senkronizasyonu',
    // Strateji & Dönüşüm
    'gayrimenkul-en-iyi-reklam-mecralari-2026',
    'konut-tesliminde-yasanan-sikayet-yonetimi',
    'gayrimenkul-satisinda-vergi-avantajlari-2026',
    'satis-ofisi-performans-kriterleri-kpi',
    'musteri-verisi-guveli-saklama-yontemleri',
    'proje-lansman-iletisim-stratejisi',
    'satis-danismani-onboarding-egitim-sureci',
    'excel-den-kurtulus-senaryosu-operasyonel-verimlilik',
    // Derinlemesine makaleler
    'gayrimenkul-satisinda-veri-maskeleme-hayati-onem',
    'lead-skorlama-hangi-musteri-gercekten-daire-alir',
    'konut-satisinda-senet-ve-tahsilat-yonetimi-finansal-risk',
    'acente-broker-yonetiminde-seffaflik-ve-hakedis-otomasyonu',
    'proje-satis-ofisi-ve-merkez-arasindaki-veri-koprusu',
    'yabanciya-konut-satisinda-surec-takibi-ve-regulasyon-uyumu',
    'teslimat-sonrasi-teknik-servis-musteri-sadakati',
    'gayrimenkul-sektoru-icin-dijital-donusum-roi-hesaplama',
];

const urlsToSubmit = batch3Slugs.map(slug => `https://novoxcrm.com/wiki/${slug}`);

console.log(`\n📋 BATCH 3 - Gönderilecek URL'ler (${urlsToSubmit.length} adet):`);
urlsToSubmit.forEach((url, i) => console.log(`  ${i + 1}. ${url}`));
console.log('');

// API Yetkilendirme
const auth = new google.auth.GoogleAuth({
    keyFile: keyFilePath,
    scopes: ['https://www.googleapis.com/auth/indexing'],
});

async function submitUrls() {
    console.log(`Toplam ${urlsToSubmit.length} URL Google Indexing API'ye gönderiliyor...\n`);

    let authClient;
    try {
        authClient = await auth.getClient();
    } catch (e) {
        console.error("Yetkilendirme Hatası:", e.message);
        process.exit(1);
    }

    const indexing = google.indexing({ version: 'v3', auth: authClient });

    let successCount = 0;
    let failCount = 0;

    for (const url of urlsToSubmit) {
        try {
            await indexing.urlNotifications.publish({
                requestBody: { url, type: 'URL_UPDATED' },
            });
            console.log(`✅ [BAŞARILI] ${url}`);
            successCount++;
        } catch (error) {
            const errMsg = error.response?.data?.error?.message || error.message;
            console.error(`❌ [HATA] ${url} -> ${errMsg}`);
            failCount++;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 BATCH 3 SONUÇ: ${successCount} başarılı / ${failCount} hatalı / ${urlsToSubmit.length} toplam`);
    console.log(`${'='.repeat(60)}`);
    console.log(`\n🏁 Tüm Batch'ler Tamamlandı:`);
    console.log(`   Batch 1: 40 URL ✅`);
    console.log(`   Batch 2: 36 URL ✅`);
    console.log(`   Batch 3: ${successCount} URL ✅`);
    console.log(`   TOPLAM : ${76 + successCount} URL Google'a gönderildi!\n`);
}

submitUrls();
