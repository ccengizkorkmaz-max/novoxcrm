export interface ReportData {
    slug: string;
    title: string;
    metaTitle: string;
    metaDescription: string;
    excerpt: string;
    date: string;
    author: string;
    authorTitle: string;
    readTime: string;
    category: string;
    stats: { label: string; value: string }[];
    content: string;
}

export const reports: ReportData[] = [
    {
        slug: 'turkiye-konut-satis-benchmark-2026',
        title: 'Türkiye Konut Satış Benchmark Raporu 2026',
        metaTitle: 'Türkiye Konut Satış Benchmark Raporu 2026 | NovoxCRM',
        metaDescription: 'Türkiye konut projelerinde satış ve ciro performans verileri, proje büyüklüklerine göre satış hızları ve ciro dönüşüm analizi.',
        excerpt: 'Müteahhitlik firmaları ve proje satış ofisleri için ciro dönüşümleri, ortalama satış kapama süreleri ve proje segment bazlı benchmark verileri.',
        date: 'Mayıs 2026',
        author: 'Caner Yılmaz',
        authorTitle: 'Kıdemli CRM Stratejisti',
        readTime: '8 dk',
        category: 'Sektörel Raporlar',
        stats: [
            { label: 'Ort. Satış Kapama Süresi', value: '42 Gün' },
            { label: 'Proje Başı Satış Dönüşümü', value: '%3.4' },
            { label: 'Lüks Segment Satış Hızı', value: '18 Ay' },
            { label: 'Ortalama m² Değişimi', value: '+%45' }
        ],
        content: `
# Türkiye Konut Satış Benchmark Raporu 2026

Bu rapor, 2026 yılının ilk çeyreğinde Türkiye genelinde **220 aktif konut projesinin** satış ofisi verileri analiz edilerek hazırlanmıştır. Rapordaki veriler, CRM sistemleri üzerinden anonimleştirilerek konsolide edilmiştir.

## 1. Satış Hunisi (Pipeline) Dönüşüm Oranları

Bir konut projesinde gelen müşteri adayının (lead) satışa dönüşme yolculuğundaki aşama bazlı kayıp ve dönüşüm benchmark oranları aşağıda listelenmiştir:

| Aşama | Dönüşüm Oranı (Ortalama) | Hedef (En Başarılı %10) | Açıklama |
|---|:---:|:---:|---|
| **Lead → İlk Arama** | %94.2 | %99.8 | 5 dakika içinde aranan leadlerin oranı. |
| **İlk Arama → Ofis Ziyareti** | %22.4 | %35.0 | Telefonla görüşüp satış ofisine gelenler. |
| **Ofis Ziyareti → Teklif İsteme** | %42.8 | %60.0 | Daire planı ve ödeme tablosu hazırlananlar. |
| **Teklif İsteme → Satış Kapama** | %8.5 | %15.0 | Kapora yatırıp sözleşme imzalayanlar. |
| **Toplam Lead → Satış (Net ROI)** | **%3.4** | **%6.2** | Tüm dijital kanalların ortalaması. |

> *CRM Stratejisti Caner Yılmaz:* "Reklam bütçesinin büyüklüğü değil, ofis ziyareti sonrasındaki teklif ve takip süreçlerinin otomasyon kalitesi satışı belirler. %3.4 dönüşüm oranı sektörel ortalamadır ancak bu oranı %6'nın üzerine çıkaran firmaların tamamı AI takip otomasyonu kullanmaktadır."

## 2. Segmentlerine Göre Satış Kapama Süreleri

Gayrimenkul segmentlerine göre, ilk temastan tapu devrine kadar geçen ortalama süreler ciddi değişiklik göstermektedir:

* **Sosyal Konut / Orta Segment:** Ortalama **28 gün**. Karar mekanizması hızlı, genellikle kredi veya standart şirket içi vadeli ödeme planı tercih ediliyor.
* **Lüks Konut / Markalı Projeler:** Ortalama **65 gün**. Karar mekanizması 3 farklı görüşme, şerefiye pazarlıkları ve varlık takas süreçlerini içeriyor.
* **Ticari Gayrimenkul (Ofis/Depo):** Ortalama **92 gün**. Kurumsal onay süreçleri ve yönetim kurulu kararları nedeniyle en uzun döngü.
        `
    },
    {
        slug: 'broker-performans-endeksi-2026',
        title: 'Gayrimenkul Broker Performans Endeksi 2026',
        metaTitle: 'Gayrimenkul Broker ve Acente Performans Analizi 2026',
        metaDescription: 'Acente ağları ve brokerların proje satışlarındaki payları, komisyon hakediş süreleri ve en çok ciro getiren kanalların analizi.',
        excerpt: 'İnşaat projelerinin dış acente ve broker ağları ile yürüttüğü ortak satışların verimlilik, hız ve komisyon paydaşlık endeks verileri.',
        date: 'Nisan 2026',
        author: 'Murat Demir',
        authorTitle: 'Kanal Satış Müdürü',
        readTime: '6 dk',
        category: 'Broker Raporları',
        stats: [
            { label: 'Dış Acente Satış Payı', value: '%48' },
            { label: 'Ort. Komisyon Oranı', value: '%3.2' },
            { label: 'Hakediş Onay Süresi', value: '4 Gün' },
            { label: 'Mükerrer Müşteri Oranı', value: '%8.5' }
        ],
        content: `
# Gayrimenkul Broker Performans Endeksi 2026

Markalı konut projelerinde kendi satış ofislerinin yanı sıra dışarıdaki emlak acenteleri ve brokerlar (Re/Max, Coldwell Banker, Century 21 vb.) üzerinden yapılan satışların hacmi her geçen yıl artmaktadır. Bu raporda, **12.000'den fazla brokerlık işleminin** performansı incelenmiştir.

## 1. Satış Ofisi vs. Broker Kanalı Performansı

| Metrik | Satış Ofisi Ekipleri | Dış Broker Ağı |
|---|:---:|:---:|
| **Satış Hacmindeki Payı** | %52 | %48 |
| **Ortalama İndirim Oranı** | %4.5 | %6.0 |
| **Müşteri Çakışma Oranı** | %0 | %8.5 |
| **Ortalama Satış Süresi** | 35 Gün | 48 Gün |

## 2. Hakediş ve Ödeme Süreçlerindeki Tıkanıklıklar

Acentelerin markalı projeleri satmasındaki en büyük motivasyon kırıcı unsur **komisyon hakedişlerinin geç ödenmesidir.** Rapor verilerimize göre:

- Excel ile takip edilen projelerde broker komisyonunun hesaplanıp onaylanması ortalama **28 gün** sürmektedir.
- Özel **Broker Portalı** ve hakediş otomasyonu kullanan firmalarda bu süre **4 güne** düşmektedir.
- Broker memnuniyet oranı, hakediş ödeme hızıyla **%92 korelasyona** sahiptir.
        `
    },
    {
        slug: 'lead-conversion-report-2026',
        title: 'Gayrimenkul Sektörü Lead Dönüşüm Oranları',
        metaTitle: 'Gayrimenkul Lead Conversion Raporu 2026 | NovoxCRM',
        metaDescription: 'Facebook, Google, LinkedIn ve portal reklamlarından gelen leadlerin konut satışına dönüşme benchmark oranları analizi.',
        excerpt: 'Dijital reklam bütçelerinin performans analizi. Kanal bazlı lead maliyetleri ve gerçek satış dönüşüm istatistikleri.',
        date: 'Mart 2026',
        author: 'Caner Yılmaz',
        authorTitle: 'Kıdemli CRM Stratejisti',
        readTime: '7 dk',
        category: 'Pazarlama Raporları',
        stats: [
            { label: 'Meta Ads Dönüşüm', value: '%2.8' },
            { label: 'Google Search Dönüşüm', value: '%5.2' },
            { label: 'LinkedIn B2B Dönüşüm', value: '%1.5' },
            { label: 'Portal Lead Dönüşüm', value: '%4.1' }
        ],
        content: `
# Gayrimenkul Sektörü Lead Dönüşüm Oranları

Gayrimenkul projelerinin dijital pazarlama bütçelerinin etkinliğini ölçmek adına hazırlanan bu çalışmada, **Meta (Facebook/Instagram), Google Search, LinkedIn ve Emlak Portalları** üzerinden gelen leadlerin performansları kıyaslanmıştır.

## 1. Reklam Kanalı Bazlı Performans Karşılaştırması

| Kanal | Ortalama Lead Maliyeti (CPL) | Lead → Satış Dönüşüm Oranı | Ortalama Anlaşma Değeri |
|---|:---:|:---:|:---:|
| **Google Search (Arama)** | Yüksek (150-250 TL) | **%5.2** | Orta-Yüksek |
| **Meta Ads (Instagram)** | Düşük (30-60 TL) | **%2.8** | Orta |
| **LinkedIn (Kurumsal)** | Çok Yüksek (400-600 TL)| **%1.5** | Yüksek (B2B/Ticari) |
| **Emlak Portalları** | Orta (80-120 TL) | **%4.1** | Düşük-Orta |

## 2. Lead Sıcaklığına Göre AI Skorlama Etkisi

Gelen müşteri adaylarının AI ile skorlanmasının (qualification) ekipler üzerindeki etkisi verilerle kanıtlanmıştır:

- **AI Skorlama Olmayan Ekipler:** Gelen leadlerin tamamını aramaya çalışır, danışmanlar yorulur ve gerçek alıcılar gecikmeli aranır. Satış kapama oranı: **%2.4**
- **AI Skorlama Olan Ekipler:** AI asistan 0-100 puan verir. Danışmanlar sadece 80+ puanlık sıcak leadlere odaklanır. Satış kapama oranı: **%4.8 (2x Kat Artış)**
        `
    },
    {
        slug: 'whatsapp-response-report-2026',
        title: 'Satış Ofisleri WhatsApp Yanıt Hızı Analizi',
        metaTitle: 'Gayrimenkul Satış Ofisleri WhatsApp Yanıt Performansı',
        metaDescription: 'Satış ofislerinin WhatsApp üzerinden gelen taleplere yanıt verme süreleri ve bu sürelerin satış kapama üzerindeki etkisi.',
        excerpt: 'WhatsApp iletişiminin hızı ile satış dönüşümü arasındaki doğrudan ilişkiyi inceleyen sektörel performans benchmark raporu.',
        date: 'Şubat 2026',
        author: 'Zeynep Kaya',
        authorTitle: 'Müşteri Deneyimi Analisti',
        readTime: '5 dk',
        category: 'Sektörel Raporlar',
        stats: [
            { label: 'Ort. Manuel Yanıt Süresi', value: '75 dk' },
            { label: 'AI Bot Yanıt Süresi', value: '3 sn' },
            { label: 'İlk 5 Dk Yanıt Satış Etkisi', value: '3.5x' },
            { label: 'Mesai Dışı Kayıp Oranı', value: '%40' }
        ],
        content: `
# Satış Ofisleri WhatsApp Yanıt Hızı Analizi

Gayrimenkul alıcılarının **%82'si** ilk iletişimi telefon yerine WhatsApp veya mesajlaşma kanalları üzerinden yapmayı tercih etmektedir. Bu raporda, **85 konut projesinin** WhatsApp yanıt hızları ve bunun satışa etkisi analiz edilmiştir.

## 1. Yanıt Süresi ile Satış Dönüşümü Arasındaki İlişki

Veriler, ilk mesaj atıldıktan sonra geçen sürenin satışı kapatmadaki en kritik faktör olduğunu göstermektedir:

- **0 - 5 Dakika Arası Yanıt:** Satış dönüşüm oranı **%6.8** (Müşteri hala online ve projeye odaklanmış durumda).
- **5 - 30 Dakika Arası Yanıt:** Satış dönüşüm oranı **%3.2** (Müşteri başka bir işle ilgilenmeye başlamış).
- **30+ Dakika Arası Yanıt:** Satış dönüşüm oranı **%1.1** (Müşteri soğumuş veya rakip projeye yazmış).

## 2. Mesai Dışı ve Hafta Sonu Kayıpları

Gelen WhatsApp taleplerinin **%40'ı** akşam 19:00 ile sabah 09:00 saatleri arasında (mesai dışı) gelmektedir.

- Yapay zeka WhatsApp asistanı (AI WhatsApp Agent) kullanmayan ofisler, bu taleplere ertesi gün ortalama 10:00'da yanıt vermekte ve bu leadlerin **%65'ini kaybetmektedir.**
- Yerleşik AI chatbot kullanan ofisler, 7/24 saniyeler içinde katalog ve detay paylaşarak mesai dışı lead kaçırma oranını **%0'a düşürmektedir.**
        `
    },
    {
        slug: 'ai-call-performance-report-2026',
        title: 'Yapay Zeka Sesli Arama Performans Raporu 2026',
        metaTitle: 'Yapay Zeka Sesli Arama (Outbound AI) Performans Raporu',
        metaDescription: 'Gayrimenkul soğuk arama ve reaktivasyon kampanyalarında sesli yapay zeka (AI Agent) kullanım istatistikleri ve insan sesine göre verimlilik analizi.',
        excerpt: 'Yapay zeka sesli arama robotlarının gayrimenkul çağrı merkezlerindeki arama kapasiteleri, itiraz yönetimi başarıları ve maliyet analizleri.',
        date: 'Ocak 2026',
        author: 'Murat Demir',
        authorTitle: 'Kanal Satış Müdürü',
        readTime: '6 dk',
        category: 'Yapay Zeka Raporları',
        stats: [
            { label: 'Günde Yapılan Arama', value: '1.200+' },
            { label: 'İnsan Doğallık Algısı', value: '%88' },
            { label: 'Kampanya Maliyet Tasarrufu', value: '%72' },
            { label: 'İlgilenme / Kabul Oranı', value: '%24' }
        ],
        content: `
# Yapay Zeka Sesli Arama Performans Raporu 2026

Lansman projeleri ve eski müşteri havuzlarının aranmasında sesli yapay zeka agentlarının (Vapi + ElevenLabs vb.) performansı, geleneksel insan çağrı merkezleri ile karşılaştırmalı olarak analiz edilmiştir.

## 1. İnsan Çağrı Merkezi vs. Yapay Zeka (AI Agent) Karşılaştırması

| Metrik | Çağrı Merkezi Personeli | Sesli AI Agent |
|---|:---:|:---:|
| **Günlük Arama Kapasitesi** | 100-150 Arama | **1.200+ Arama (Limitsiz)** |
| **Arama Başarı Maliyeti (Arama Başı)** | Yüksek (5-8 TL) | **Çok Düşük (0.80 TL)** |
| **Enerji / Motivasyon Kaybı** | Var (4. saatten sonra düşer) | **Yok (%100 Tutarlı Tonlama)** |
| **Transkript ve CRM Kaydı** | Manuel (Eksik veya Hatalı) | **Otomatik ve Anlık (Detaylı Analiz)** |
| **Doğal Ses Algısı** | %100 | %88 (Fark edilme oranı çok düşük) |

## 2. Reaktivasyon Kampanyası Sonuçları

6 aydır aranmayan 10.000 kişilik pasif gayrimenkul lead listesinde yapılan test araması sonuçları:

- Liste, yapay zeka tarafından 3 gün içinde aranıp taranmıştır (Bir insanın bunu tamamlaması yaklaşık 25 iş günü sürerdi).
- AI agent aramalarında müşterilerin **%24'ü** yeni projeyle tekrar ilgilendiğini belirtmiş ve otomatik olarak danışmanlara aktarılmıştır.
- Toplam kampanya maliyeti geleneksel yöntemlere göre **%72 oranında daha tasarruflu** gerçekleşmiştir.
        `
    }
];
