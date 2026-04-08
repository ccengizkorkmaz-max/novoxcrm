const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// 1. JSON KEY KONTROLÜ
const keyFilePath = path.join(__dirname, '../google-indexer-key.json');
if (!fs.existsSync(keyFilePath)) {
    console.error("HATA: google-indexer-key.json dosyası bulunamadı.");
    process.exit(1);
}

// 2. BATCH 2 - İlk scriptte gönderilmemiş URL'ler (41-80 arası)
// Daha önce gönderilmiş (batch1): core URLs + ilk 32 wiki slug
// Şimdi: wiki-articles-gen.ts'deki batch1'e GİRMEYEN yeni slug'lar

const batch2WikiSlugs = [
    // wiki-articles-gen.ts - batch1'de olmayan slug'lar
    'excel-musteri-takibi-zorluklar-cozum',
    'facebook-form-crm-otomatik-aktarim',
    'mukerrer-musteri-kaydi-engelleme',
    'satilan-daire-bos-gorunme-hatasi',
    'crm-erp-entegrasyonu-basarisizlik-nedenleri',
    'senet-vadesi-kacirma-otomatik-tahsilat',
    'satis-ekibi-crm-kullanim-direnci-cozum',
    'personel-ayrilinca-musteri-verisi-koruma',
    'kvkk-veri-maskeleme-loglama-gayrimenkul',
    'gayrimenkul-dijital-envanter-yonetimi',
    'broker-komisyon-hakedis-yonetimi',
    'yabanciya-konut-satisi-surec-yonetimi',
    'kisiye-ozel-odeme-plani-simulasyonu',
    'konut-satisinda-lead-skorlama-metodolojisi',
    'musteri-getir-referral-kampanya-yonetimi',
    'konut-satisinda-dijital-imza-e-imza',
    'sanal-tur-matterport-crm-entegrasyonu',
    'tapu-harci-doner-sermaye-otomatik-hesaplama',
    'satis-ofisi-gunluk-rapor-hazirlik',
    'insaat-satislari-neden-duser-analiz',
    'kurumsal-hafiza-nasil-olusturulur',
    'nakit-akis-tablosu-olusturma-rehberi',
    'satis-iptalleri-fesih-minimize-etme',
    'musteri-adayi-basi-maliyet-cpl-dusurme',
    'dijital-donusum-yol-haritasi-gayrimenkul',
    'kagitsiz-ofis-paperless-gayrimenkul',
    'veri-kaybi-data-loss-onleme-rehberi',
    'emlak-portfoy-yonetim-yazilimi',
    'konut-satis-pazarlama-crm-entegrasyonu',
    'potansiyel-musteri-yonetimi-stratejileri',
    'otomatik-teklif-olusturma-gayrimenkul',
    'opsiyonlama-takibi-dijital-sistem',
    // Ek sayfalar (marketing & solutions)
    'payment-plan-calculator',
    'privacy-policy',
    'ebooks/gayrimenkul-projelerinde-dijital-donusum-rehberi',
    'bir-bakista-novoxcrm',
    // İngilizce versiyonlar (en/ prefix'li ana sayfalar)
];

// Ek core URL'ler (daha önce gönderilmemiş olanlar)
const extraCoreUrls = [
    'https://novoxcrm.com/payment-plan-calculator',
    'https://novoxcrm.com/privacy-policy',
    'https://novoxcrm.com/ebooks/gayrimenkul-projelerinde-dijital-donusum-rehberi',
    'https://novoxcrm.com/bir-bakista-novoxcrm',
];

// Wiki URL'lerini oluştur
const wikiUrls = batch2WikiSlugs
    .filter(s => !['payment-plan-calculator','privacy-policy','ebooks/gayrimenkul-projelerinde-dijital-donusum-rehberi','bir-bakista-novoxcrm'].includes(s))
    .map(slug => `https://novoxcrm.com/wiki/${slug}`);

// Toplam URL Havuzunu Birleştir ve sadece 40 al
let urlsToSubmit = [...extraCoreUrls, ...wikiUrls].slice(0, 40);

console.log(`\n📋 BATCH 2 - Gönderilecek URL'ler (${urlsToSubmit.length} adet):`);
urlsToSubmit.forEach((url, i) => console.log(`  ${i + 1}. ${url}`));
console.log('');

// API Yetkilendirme (Auth)
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

    const indexing = google.indexing({
        version: 'v3',
        auth: authClient,
    });

    let successCount = 0;
    let failCount = 0;

    for (const url of urlsToSubmit) {
        try {
            await indexing.urlNotifications.publish({
                requestBody: {
                    url: url,
                    type: 'URL_UPDATED',
                },
            });
            console.log(`✅ [BAŞARILI] ${url}`);
            successCount++;
        } catch (error) {
            const errMsg = error.response?.data?.error?.message || error.message;
            console.error(`❌ [HATA] ${url} -> ${errMsg}`);
            failCount++;
        }

        // Rate limit koruması - 500ms bekleme
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 SONUÇ: ${successCount} başarılı / ${failCount} hatalı / ${urlsToSubmit.length} toplam`);
    console.log(`${'='.repeat(60)}\n`);
}

submitUrls();
