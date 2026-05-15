export interface ComparisonData {
    slug: string
    title: string
    metaTitle: string
    metaDescription: string
    competitor: string
    competitorDescription: string
    features: { name: string; oikos: string; competitor: string }[]
    verdict: string
    faq: { question: string; answer: string }[]
}

export const comparisons: ComparisonData[] = [
    {
        slug: 'oikos-crm-vs-emor',
        title: 'Oikos CRM vs e-MOR: Hangi Gayrimenkul CRM Daha İyi?',
        metaTitle: 'Oikos CRM vs e-MOR Karşılaştırma 2026 | Gayrimenkul CRM',
        metaDescription: 'Oikos CRM ve e-MOR gayrimenkul CRM yazılımlarının detaylı karşılaştırması. Özellikler, fiyat, kullanım kolaylığı ve entegrasyonlar.',
        competitor: 'e-MOR',
        competitorDescription: 'e-MOR, konut üreticileri ve gayrimenkul geliştirme şirketleri için ERP entegrasyonlu kurumsal bir CRM çözümüdür.',
        features: [
            { name: 'Modern Arayüz', oikos: '✅ Next.js tabanlı modern UI', competitor: '⚠️ Eski nesil arayüz' },
            { name: 'WhatsApp Entegrasyonu', oikos: '✅ Yerleşik AI chatbot', competitor: '❌ Yok' },
            { name: 'Broker Portalı', oikos: '✅ Tam özellikli', competitor: '✅ Mevcut' },
            { name: 'Stok Yönetimi', oikos: '✅ İnteraktif lejant', competitor: '✅ ERP entegreli' },
            { name: 'Ödeme Planı', oikos: '✅ Otomatik hesaplama', competitor: '✅ ERP bağlantılı' },
            { name: 'Yapay Zeka', oikos: '✅ AI sesli arama + chatbot', competitor: '❌ Yok' },
            { name: 'Mobil Uyumluluk', oikos: '✅ PWA + responsive', competitor: '⚠️ Sınırlı' },
            { name: 'Kurulum Süresi', oikos: '✅ Dakikalar', competitor: '⚠️ Haftalar (ERP entegrasyon)' },
            { name: 'Fiyatlandırma', oikos: '✅ Uygun', competitor: '⚠️ Kurumsal segment (yüksek)' },
        ],
        verdict: 'Oikos CRM, modern arayüzü, AI entegrasyonu ve hızlı kurulumu ile küçük-orta ölçekli inşaat firmalarına ideal. e-MOR ise büyük holdingler için ERP entegrasyonu gereken durumlarda tercih edilebilir.',
        faq: [
            { question: 'e-MOR alternatifi var mı?', answer: 'Evet, Oikos CRM modern arayüzü ve AI özellikleriyle e-MOR\'un güçlü bir alternatifidir. Daha hızlı kurulum ve uygun fiyatla aynı temel özellikleri sunar.' },
            { question: 'e-MOR\'dan Oikos CRM\'e geçiş zor mu?', answer: 'Hayır, veri aktarımı desteğimizle geçiş süreci genellikle 1-2 hafta içinde tamamlanır.' },
        ]
    },
    {
        slug: 'oikos-crm-vs-yapisoft',
        title: 'Oikos CRM vs Yapısoft: İnşaat CRM Karşılaştırması',
        metaTitle: 'Oikos CRM vs Yapısoft (SalesOffice) Karşılaştırma 2026',
        metaDescription: 'Oikos CRM ve Yapısoft SalesOffice inşaat CRM karşılaştırması. Proje satış takibi, broker yönetimi ve fiyat analizi.',
        competitor: 'Yapısoft (SalesOffice)',
        competitorDescription: 'Yapısoft, SalesOffice ve emlapp ürünleriyle inşaat ve emlak sektörüne hizmet veren köklü bir yazılım firmasıdır.',
        features: [
            { name: 'Proje Bazlı Satış', oikos: '✅ Tam özellikli', competitor: '✅ Tam özellikli' },
            { name: 'WhatsApp Entegrasyonu', oikos: '✅ AI chatbot + toplu mesaj', competitor: '❌ Yok' },
            { name: 'AI Sesli Arama', oikos: '✅ Otomatik outbound', competitor: '❌ Yok' },
            { name: 'Çoklu Dil Desteği', oikos: '✅ Türkçe + İngilizce', competitor: '✅ Çoklu dil' },
            { name: 'Broker Portalı', oikos: '✅ Web tabanlı', competitor: '✅ Mevcut' },
            { name: 'Bulut Tabanlı', oikos: '✅ %100 bulut', competitor: '⚠️ Hibrit' },
            { name: 'Entegrasyonlar', oikos: '✅ WhatsApp, Vapi, Make.com', competitor: '⚠️ Sınırlı' },
            { name: 'Fiyatlandırma', oikos: '✅ Şeffaf', competitor: '⚠️ Teklif bazlı' },
        ],
        verdict: 'Oikos CRM, AI ve otomasyon yetenekleriyle Yapısoft\'tan ayrışır. Yapısoft köklü bir çözüm olsa da modern AI özellikleri sunmamaktadır.',
        faq: [
            { question: 'Yapısoft alternatifi arıyorum, ne önerirsiniz?', answer: 'Oikos CRM, Yapısoft\'un tüm temel özelliklerini sunarken WhatsApp AI chatbot ve sesli arama gibi modern otomasyon araçlarını da ekler.' },
            { question: 'SalesOffice\'den Oikos CRM\'e geçiş yapabilir miyim?', answer: 'Evet, CSV/Excel veri aktarımı ile mevcut müşteri ve proje verilerinizi kolayca taşıyabilirsiniz.' },
        ]
    },
    {
        slug: 'crm-vs-excel-gayrimenkul',
        title: 'CRM mi Excel mi? Gayrimenkul Satışında Doğru Tercih',
        metaTitle: 'CRM vs Excel Gayrimenkul | Hangisi Daha İyi? 2026',
        metaDescription: 'Gayrimenkul satışında CRM mi yoksa Excel mi kullanmalı? Maliyet, verimlilik ve risk analizi ile doğru kararı verin.',
        competitor: 'Microsoft Excel',
        competitorDescription: 'Excel, gayrimenkul sektöründe hala en yaygın kullanılan araç olmaya devam ediyor. Ancak ciddi sınırlamaları var.',
        features: [
            { name: 'Gerçek Zamanlı Stok', oikos: '✅ Anlık güncelleme', competitor: '❌ Dosya bazlı, eski kalır' },
            { name: 'Çoklu Kullanıcı', oikos: '✅ Sınırsız eşzamanlı', competitor: '⚠️ Dosya çakışması riski' },
            { name: 'Otomatik Hatırlatma', oikos: '✅ SMS, WhatsApp, e-posta', competitor: '❌ Manuel takip' },
            { name: 'Müşteri Geçmişi', oikos: '✅ Timeline + notlar', competitor: '⚠️ Sayfalar arası kaybolur' },
            { name: 'Raporlama', oikos: '✅ Anlık dashboard', competitor: '⚠️ Saatlerce formül yazma' },
            { name: 'Veri Güvenliği', oikos: '✅ Şifreli + rol bazlı', competitor: '❌ USB\'ye kopyalanabilir' },
            { name: 'Broker Yönetimi', oikos: '✅ Portal + hakediş', competitor: '❌ İmkansız' },
            { name: 'Ödeme Planı', oikos: '✅ Otomatik hesaplama', competitor: '⚠️ Hata riski yüksek' },
            { name: 'Maliyet', oikos: '⚠️ Aylık abonelik', competitor: '✅ Ücretsiz (ama gizli maliyetler)' },
        ],
        verdict: 'Excel "ücretsiz" görünse de, kaybettiği zaman ve fırsat maliyeti CRM aboneliğinden çok daha yüksektir. 5+ çalışanlı her firma CRM kullanmalıdır.',
        faq: [
            { question: 'Gayrimenkul satışında Excel yerine ne kullanmalıyım?', answer: 'Gayrimenkul sektörüne özel geliştirilmiş CRM yazılımları kullanmalısınız. Bu sistemler stok takibi, ödeme planı ve müşteri yönetimini otomatikleştirir.' },
            { question: 'Excel\'den CRM\'e geçiş zor mu?', answer: 'Hayır, mevcut Excel verileriniz CSV formatında dışa aktarılıp CRM\'e içe aktarılabilir. Süreç genellikle 1-2 gün sürer.' },
        ]
    },
    {
        slug: 'oikos-crm-vs-salesforce',
        title: 'Oikos CRM vs Salesforce: Gayrimenkul İçin Hangisi?',
        metaTitle: 'Oikos CRM vs Salesforce Gayrimenkul CRM 2026',
        metaDescription: 'Salesforce gayrimenkul için uygun mu? Oikos CRM ile sektörel karşılaştırma. Fiyat, özellik ve kullanım kolaylığı analizi.',
        competitor: 'Salesforce',
        competitorDescription: 'Salesforce, dünyanın en büyük CRM platformudur. Ancak gayrimenkul sektörüne özel değildir ve yüksek özelleştirme maliyeti gerektirir.',
        features: [
            { name: 'Sektörel Hazırlık', oikos: '✅ Gayrimenkul için hazır', competitor: '⚠️ Genel amaçlı, özelleştirme gerekir' },
            { name: 'Daire/Stok Yönetimi', oikos: '✅ Yerleşik modül', competitor: '❌ Custom development gerekir' },
            { name: 'Ödeme Planı', oikos: '✅ Otomatik', competitor: '❌ Özel geliştirme' },
            { name: 'Broker Portalı', oikos: '✅ Hazır', competitor: '❌ Community Cloud ek maliyet' },
            { name: 'Türkçe Destek', oikos: '✅ %100 Türkçe', competitor: '⚠️ Sınırlı Türkçe' },
            { name: 'Kurulum Maliyeti', oikos: '✅ Düşük', competitor: '❌ $50.000+ danışmanlık' },
            { name: 'Aylık Maliyet', oikos: '✅ Uygun', competitor: '❌ $150+/kullanıcı/ay' },
        ],
        verdict: 'Salesforce güçlü ama gayrimenkul için fazla genel ve pahalıdır. Oikos CRM, sektöre özel hazır modülleriyle çok daha hızlı ve ekonomik bir çözümdür.',
        faq: [
            { question: 'Salesforce gayrimenkul için uygun mu?', answer: 'Salesforce genel amaçlı bir CRM\'dir. Gayrimenkul sektörüne uyarlamak için yüksek maliyetli özelleştirme ve danışmanlık gerekir.' },
            { question: 'Salesforce\'tan Oikos CRM\'e geçiş yapabilir miyim?', answer: 'Evet, Salesforce verilerinizi dışa aktarıp Oikos CRM\'e aktarabilirsiniz. Geçiş desteği sunuyoruz.' },
        ]
    },
    {
        slug: 'en-iyi-gayrimenkul-crm-2026',
        title: 'En İyi 10 Gayrimenkul CRM Yazılımı 2026 Karşılaştırması',
        metaTitle: 'En İyi 10 Gayrimenkul CRM Yazılımı 2026 | Karşılaştırma',
        metaDescription: '2026 yılının en iyi gayrimenkul CRM yazılımlarını karşılaştırdık. Oikos CRM, e-MOR, Yapısoft, Fizbot ve diğerleri.',
        competitor: 'Tüm Rakipler',
        competitorDescription: 'Türkiye gayrimenkul sektöründe kullanılan tüm CRM yazılımlarının özellik bazlı kapsamlı karşılaştırması. Hangi CRM hangi özellikleri sunuyor?',
        features: [
            { name: 'AI Sesli Arama (Outbound)', oikos: '✅ Vapi entegreli otomatik arama', competitor: '❌ Hiçbir rakipte yok' },
            { name: 'WhatsApp AI Chatbot', oikos: '✅ 7/24 otomatik yanıt + lead yakalama', competitor: '❌ Hiçbir rakipte yok' },
            { name: 'AI Satış Co-Pilot', oikos: '✅ Günlük briefing + risk analizi', competitor: '❌ Hiçbir rakipte yok' },
            { name: 'AI Mülk Eşleştirme', oikos: '✅ Müşteri profiline göre otomatik öneri', competitor: '❌ Hiçbir rakipte yok' },
            { name: 'Voice-to-Data (Sesli Not)', oikos: '✅ Ses kaydı → CRM kaydı dönüşümü', competitor: '❌ Hiçbir rakipte yok' },
            { name: 'Broker Portalı', oikos: '✅ Tam özellikli web portal', competitor: '⚠️ e-MOR ve Yapısoft\'ta kısmi' },
            { name: 'Komisyon & Hakediş', oikos: '✅ Otomatik hesaplama + onay akışı', competitor: '⚠️ Sadece e-MOR\'da kısmi' },
            { name: 'Proje Bazlı Stok Yönetimi', oikos: '✅ İnteraktif lejant + blok bazlı', competitor: '✅ e-MOR, Yapısoft\'ta da mevcut' },
            { name: 'Ödeme Planı Motoru', oikos: '✅ Esnek + otomatik taksitlendirme', competitor: '✅ e-MOR, Yapısoft\'ta da mevcut' },
            { name: 'Outreach Otomasyon Motoru', oikos: '✅ AI sesli arama → WhatsApp → SMS otomatik zincir', competitor: '❌ Dünyada bile eşi yok' },
            { name: 'Lead Otomatik Yakalama', oikos: '✅ Facebook Ads + Web form + Make.com', competitor: '⚠️ Fizbot ve HubSpot\'ta kısmi' },
            { name: 'Çoklu Dil (TR + EN)', oikos: '✅ Tam i18n desteği', competitor: '⚠️ Yapısoft ve Zoho\'da mevcut' },
            { name: 'White-Label Altyapı', oikos: '✅ Kendi markanızla kullanın', competitor: '❌ Hiçbir rakipte yok' },
            { name: 'Müşteri Self-Servis Portal', oikos: '✅ Ödeme takibi + evrak paylaşımı', competitor: '❌ Hiçbir rakipte yok' },
            { name: '%100 Bulut + Mobil', oikos: '✅ PWA + responsive tüm cihazlar', competitor: '⚠️ Çoğu hibrit veya masaüstü' },
            { name: 'Sektörel Hazırlık', oikos: '✅ Gayrimenkul için sıfırdan inşa', competitor: '⚠️ Zoho, HubSpot, Salesforce genel amaçlı' },
            { name: 'Fiyat/Performans', oikos: '✅ En kapsamlı özellik seti, uygun fiyat', competitor: '⚠️ e-MOR ve Salesforce çok pahalı' },
            { name: 'Dijital Pazarlama Otomasyonu', oikos: '✅ Kampanya yönetimi + ROI analizi + lead akışı', competitor: '❌ Sektörel CRM\'lerde yok' },
        ],
        verdict: 'Oikos CRM, 18 kritik özellikten 18\'inde tam destek sunan tek gayrimenkul CRM yazılımıdır. AI sesli arama, WhatsApp chatbot, outreach otomasyon motoru, dijital pazarlama otomasyonu ve white-label gibi özellikler sadece Oikos CRM\'de bulunmaktadır. Rakipler temel CRM özelliklerini sunarken, Oikos CRM yapay zeka ve otomasyon ile sektörü yeniden tanımlıyor.',
        faq: [
            { question: 'En iyi gayrimenkul CRM hangisi?', answer: '2026 itibarıyla Oikos CRM, AI sesli arama, WhatsApp chatbot ve sektöre özel 35+ modülüyle en kapsamlı gayrimenkul CRM yazılımıdır. 18 kritik özelliğin tamamını sunan tek çözümdür.' },
            { question: 'Gayrimenkul CRM fiyatları ne kadar?', answer: 'Fiyatlar kullanıcı sayısı ve modüllere göre değişir. Oikos CRM, rakiplerinin sunmadığı AI özelliklerini bile daha uygun fiyata sunar. Ücretsiz demo ile başlayabilirsiniz.' },
            { question: 'Hangi CRM inşaat firmalarına uygun?', answer: 'İnşaat firmalarının proje bazlı satış takibi, daire envanteri, ödeme planı motoru ve broker portalı gibi sektörel özelliklere ihtiyacı var. Bu özelliklerin tamamını Oikos CRM, e-MOR ve Yapısoft sunuyor, ancak AI özelliklerini yalnızca Oikos CRM sunuyor.' },
            { question: 'e-MOR mu Oikos CRM mi?', answer: 'e-MOR köklü bir çözüm olsa da AI entegrasyonu, WhatsApp chatbot ve modern arayüz konularında Oikos CRM çok daha ileridedir. e-MOR kurumsal ERP entegrasyonu gereken holdingler için uygun olabilir.' },
            { question: 'Salesforce veya HubSpot gayrimenkul için kullanılabilir mi?', answer: 'Genel amaçlı CRM\'ler gayrimenkul sektörüne uyarlanabilir ancak daire stok yönetimi, ödeme planı ve broker portalı gibi sektörel modüller için yüksek maliyetli özelleştirme gerekir.' },
        ]
    },
]
