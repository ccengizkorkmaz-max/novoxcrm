const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// 1. JSON KEY KONTROLÜ
const keyFilePath = path.join(__dirname, '../google-indexer-key.json');
if (!fs.existsSync(keyFilePath)) {
    console.error("HATA: google-indexer-key.json dosyası bulunamadı.");
    console.error("Lütfen Google Cloud'dan aldığınız hizmet hesabı (Service Account) JSON dosyasını ana dizine 'google-indexer-key.json' adıyla ekleyin.");
    console.error("Detaylı rehber: https://developers.google.com/search/apis/indexing-api/v3/prereqs");
    process.exit(1);
}

// 2. EN ETKİLİ 40 SAYFAYI (URL) BELİRLEME
// Ana dönüşüm sağlayan sayfalar (Marketing & Ana Yapı)
const coreUrls = [
    'https://novoxcrm.com',
    'https://novoxcrm.com/solutions',
    'https://novoxcrm.com/solutions/gayrimenkul-crm',
    'https://novoxcrm.com/solutions/insaat-crm',
    'https://novoxcrm.com/wiki',
    'https://novoxcrm.com/bir-bakista-novocrm',
    'https://novoxcrm.com/system-details',
    'https://novoxcrm.com/broker/apply'
];

// Seçilmiş en kritik Wiki makaleleri (SEO Dönüşüm, Yüksek Aranan Kelimeler)
const topWikiSlugs = [
    // Uzman elinden çıkan en değerli makaleler (wiki-data.ts)
    'gayrimenkul-satisinda-excel-neden-yetersiz',
    'b2b-broker-aglari-ve-proje-satisi',
    'musteri-portalinin-satis-sonrasindaki-onemi',
    'modern-gayrimenkul-crm-ozellikleri',
    'gayrimenkul-crm-nedir-neden-zorunlu',
    'insaat-crm-secerken-yapilan-hatalar',
    'konut-projelerinde-satis-takibi-dijitallestirme',
    'gayrimenkul-crm-mi-erp-mi',
    'broker-yonetimi-ve-crm-onemi',
    'konut-projelerinde-stok-ve-daire-takibi',
    'gayrimenkul-satis-sureclerinde-crm-etkisi',
    'insaat-projelerinde-odeme-plani-ve-sozlesme-takibi',
    'turkiyede-gayrimenkul-firmalari-icin-en-iyi-crm-ozellikleri',
    'gayrimenkul-firmalari-icin-crm-alternatifleri-karsilastirma',
    // Hacmi çok yüksek özel türetilen makaleler (wiki-articles-gen.ts)
    'insaat-crm-nedir',
    'gayrimenkul-crm-secim-rehberi',
    'konut-projesi-satis-yazilimi-ozellikleri',
    'emlak-takip-sistemi-neden-gerekli',
    'gayrimenkul-gelistirme-yazilimi-kapsamli-rehber',
    'insaat-satis-otomasyonu-rehberi',
    'satis-hunisi-pipeline-yonetimi-gayrimenkul',
    'aday-musteri-takibi-lead-tracking-rehberi',
    'teklif-hazirlama-programi-otomatik-pdf',
    'satis-hizi-analizi-conversion-rate',
    'rezervasyon-yonetimi-gayrimenkul',
    'sozlesme-yonetimi-gayrimenkul-crm',
    'musteri-yolculugu-customer-journey-gayrimenkul',
    'dijital-kat-plani-ve-stok-durumu-yonetimi',
    'serefiye-hesaplama-yontemleri-rehber'
];

// Toplam URL Havuzunu Birleştir ve sadece ilk 40 tanesini al
let urlsToSubmit = [...coreUrls, ...topWikiSlugs.map(slug => `https://novoxcrm.com/wiki/${slug}`)];
urlsToSubmit = urlsToSubmit.slice(0, 40);

// API Yetkilendirme (Auth)
const auth = new google.auth.GoogleAuth({
    keyFile: keyFilePath,
    scopes: ['https://www.googleapis.com/auth/indexing'],
});

async function submitUrls() {
    console.log(`Toplam ${urlsToSubmit.length} Stratejik URL Google Indexing API'ye gönderiliyor...\n`);
    
    // API client
    let authClient;
    try {
        authClient = await auth.getClient();
    } catch (e) {
        console.error("Yetkilendirme Hatası: Lütfen JSON anahtar dosyasının geçerli olduğundan ve Google Cloud'da Indexing API'nin aktif edildiğinden emin olun.");
        console.error(e.message);
        process.exit(1);
    }
    
    const indexing = google.indexing({
        version: 'v3',
        auth: authClient,
    });

    let successCount = 0;
    
    for (const url of urlsToSubmit) {
        try {
            const response = await indexing.urlNotifications.publish({
                requestBody: {
                    url: url,
                    type: 'URL_UPDATED', // Googlebot'a "sayfa yenilendi/keşfedildi hemen gel" pingi atar
                },
            });
            console.log(`[BAŞARILI] ${url}`);
            successCount++;
        } catch (error) {
            console.error(`[HATA] ${url} ->`, error.response?.data?.error?.message || error.message);
        }
        
        // (Rate limit koruması) Her istek arasında saniyenin yarısı kadar beklet
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\nİşlem Tamamlandı: ${successCount}/${urlsToSubmit.length} URL başarıyla Google Sırasına Eklendi!`);
}

submitUrls();
