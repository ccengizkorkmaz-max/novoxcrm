export interface AISolutionData {
    slug: string;
    title: string;
    metaTitle: string;
    metaDescription: string;
    heroHeadline: string;
    heroSubheadline: string;
    icon: string;
    gradient: string;
    features: { title: string; description: string; icon: string }[];
    benefits: string[];
    useCases: { title: string; description: string }[];
    stats: { value: string; label: string }[];
    faq: { question: string; answer: string }[];
}

export const aiSolutions: AISolutionData[] = [
    {
        slug: 'ai-satis-asistani',
        title: 'AI Satış Asistanı',
        metaTitle: 'Yapay Zeka ile Konut Satışı & AI Satış Asistanı | CRM',
        metaDescription: 'Yapay zeka ile konut satışı süreçlerinizi hızlandırın. Akıllı satış asistanı, otomatik müşteri skorlama ve lead önceliklendirme ile dönüşümleri %40 artırın.',
        heroHeadline: 'Satış Ekibinizin Yanında 7/24 Çalışan AI Asistan',
        heroSubheadline: 'Yapay zeka, danışmanlarınıza hangi müşteriyi ne zaman araması gerektiğini söyler. Lead önceliklendirme, risk analizi ve günlük briefing ile hiçbir fırsat kaçmaz.',
        icon: 'Brain',
        gradient: 'from-violet-500 to-purple-600',
        features: [
            { title: 'Günlük AI Briefing', description: 'Her sabah danışmanınıza "bugün kimlerle ilgilenmen gerekiyor" listesini otomatik hazırlar. Öncelik sırası, risk seviyesi ve önerilen aksiyon ile.', icon: 'Sunrise' },
            { title: 'Akıllı Lead Önceliklendirme', description: 'Müşteri davranışlarını analiz ederek hangi lead\'in satışa en yakın olduğunu belirler. Sıcak, ılık ve soğuk segmentasyonu otomatik yapılır.', icon: 'Target' },
            { title: 'Risk Analizi & Erken Uyarı', description: 'Uzun süredir takip edilmeyen müşteriler, gecikmiş ödemeler ve kaçırılabilecek fırsatlar için proaktif uyarılar gönderir.', icon: 'AlertTriangle' },
        ],
        benefits: [
            'Satış dönüşüm oranında %40 artış',
            'Danışman başına günlük 2 saat zaman tasarrufu',
            'Takip edilmeyen müşteri oranı %0\'a iner',
            'Yönetici dashboard\'unda anlık performans görünümü',
        ],
        useCases: [
            { title: 'Lansman Döneminde Lead Yönetimi', description: 'Proje lansmanlarında binlerce lead aynı anda sisteme akar. AI asistan, bu leadleri otomatik skorlayarak en sıcak olanları öncelikli olarak danışmanlara atar.' },
            { title: 'Satış Sonrası Takip', description: 'Teklif verdikten sonra 3-5 gün içinde geri dönüş yapmayan müşteriler için otomatik hatırlatma ve yeniden iletişim senaryoları oluşturur.' },
            { title: 'Performans Optimizasyonu', description: 'Hangi danışmanın hangi müşteri profilinde daha başarılı olduğunu analiz eder ve lead dağılımını optimize eder.' },
        ],
        stats: [
            { value: '%40', label: 'Dönüşüm Artışı' },
            { value: '2 saat', label: 'Günlük Zaman Tasarrufu' },
            { value: '%0', label: 'Kaçırılan Lead Oranı' },
            { value: '7/24', label: 'Kesintisiz Çalışma' },
        ],
        faq: [
            { question: 'AI Satış Asistanı nedir?', answer: 'AI Satış Asistanı, gayrimenkul satış sürecinde danışmanlara yardımcı olan yapay zeka destekli bir araçtır. Lead önceliklendirme, takip hatırlatmaları, risk analizi ve günlük briefing gibi görevleri otomatik olarak yapar.' },
            { question: 'AI asistan danışmanın yerini alır mı?', answer: 'Hayır, AI asistan danışmanın yerini almaz, onu güçlendirir. Rutini otomatize ederek danışmanın müşteriye daha fazla zaman ayırmasını sağlar.' },
            { question: 'AI Satış Asistanı hangi verileri kullanır?', answer: 'Müşteri etkileşim geçmişi, görüşme notları, teklif durumları, ödeme davranışları ve sektörel benchmark verilerini kullanarak akıllı öneriler sunar.' },
        ]
    },
    {
        slug: 'ai-sesli-arama',
        title: 'AI Sesli Arama Sistemi',
        metaTitle: 'AI Call Center & AI Sesli Arama | Gayrimenkul Soğuk Arama Robotu',
        metaDescription: 'Yapay zeka destekli AI Call Center sistemi. Gayrimenkul projeleriniz için 7/24 Türkçe konuşan yapay zeka sesli arama robotu ve Vapi entegrasyonu.',
        heroHeadline: 'AI Agent\'ınız Müşterilerinizi Sizin Yerinize Arar',
        heroSubheadline: 'Doğal Türkçe konuşan yapay zeka sesli arama sistemi ile leadlerinize otomatik ulaşın. İlgilenen müşterileri satış ekibine yönlendirin, ilgilenmeyenleri kayıt altına alın.',
        icon: 'Phone',
        gradient: 'from-blue-500 to-cyan-600',
        features: [
            { title: 'Doğal Türkçe Konuşma', description: 'ElevenLabs teknolojisi ile gerçek bir insan gibi konuşan AI agent. Müşteriler yapay zeka ile konuştuğunu fark etmez.', icon: 'Mic' },
            { title: 'Akıllı Senaryo Yönetimi', description: 'İtiraz yönetimi, soru-cevap ve yönlendirme senaryolarını önceden tanımlayın. AI agent duruma göre doğal tepkiler verir.', icon: 'GitBranch' },
            { title: 'Otomatik Transkript & Kayıt', description: 'Her arama otomatik olarak kaydedilir ve yazıya dökülür. Arama sonuçları CRM\'e anında işlenir.', icon: 'FileText' },
        ],
        benefits: [
            'Günde yüzlerce arama kapasitesi — yorulmadan, durmadan',
            'Danışman zamanı yüksek potansiyelli müşterilere ayrılır',
            'Her arama kaydedilir ve analiz edilir',
            'İlgilenen müşteriler anında satış ekibine yönlendirilir',
        ],
        useCases: [
            { title: 'Soğuk Arama Kampanyaları', description: 'Yeni bir projenin lansmanında binlerce potansiyel müşteriyi AI agent otomatik olarak arar. İlgilenenleri sıcak lead olarak satış ekibine aktarır.' },
            { title: 'Eski Lead Reaktivasyonu', description: '6 ay önce ilgilenip vazgeçen müşterileri yeni fiyat listeleri veya kampanyalarla tekrar aramak için AI agent kullanın.' },
            { title: 'Randevu Hatırlatma', description: 'Satış ofisi ziyaret randevusu olan müşterilere otomatik hatırlatma aramaları yapın.' },
        ],
        stats: [
            { value: '500+', label: 'Günlük Arama Kapasitesi' },
            { value: '%85', label: 'Doğal Konuşma Skoru' },
            { value: '24/7', label: 'Kesintisiz Çalışma' },
            { value: '%35', label: 'Lead Dönüşüm Artışı' },
        ],
        faq: [
            { question: 'AI sesli arama nasıl çalışır?', answer: 'Sistem, belirlediğiniz müşteri listesini otomatik olarak arar, Türkçe doğal dilde konuşma yapar, itirazları yönetir ve sonuçları CRM\'e kaydeder. Tüm süreç tam otomatiktir.' },
            { question: 'Müşteriler yapay zeka ile konuştuğunu anlar mı?', answer: 'ElevenLabs ve Vapi teknolojisi sayesinde AI agent son derece doğal bir Türkçe ile konuşur. Test aramalarında müşterilerin büyük çoğunluğu farkı ayırt edememiştir.' },
            { question: 'AI sesli arama yasal mı?', answer: 'Evet, KVKK ve ilgili mevzuata uygun olarak kullanılır. Aramanın AI tarafından yapıldığı gerektiğinde belirtilir ve kayıtlar güvenli sunucularda saklanır.' },
        ]
    },
    {
        slug: 'ai-whatsapp-agent',
        title: 'AI WhatsApp Agent',
        metaTitle: 'AI WhatsApp Chatbot | Gayrimenkul WhatsApp Otomasyonu',
        metaDescription: 'Gayrimenkul satışı için AI WhatsApp chatbot. 7/24 müşteri sorularını yanıtlayın, lead yakalayın ve otomatik proje tanıtımı yapın.',
        heroHeadline: 'WhatsApp\'ta 7/24 Satış Yapan AI Agent',
        heroSubheadline: 'Müşterileriniz WhatsApp\'tan yazdığında AI agent anında yanıt verir. Proje bilgisi paylaşır, randevu oluşturur ve lead bilgilerini CRM\'e kaydeder.',
        icon: 'MessageCircle',
        gradient: 'from-green-500 to-emerald-600',
        features: [
            { title: '7/24 Anında Yanıt', description: 'Mesai saatleri dışında bile müşterilerinize saniyeler içinde yanıt verin. AI agent proje detaylarını, fiyat aralığını ve uygun daireleri paylaşır.', icon: 'Clock' },
            { title: 'Akıllı Lead Yakalama', description: 'Sohbet sırasında müşterinin adını, telefonunu ve ilgilendiği daire tipini otomatik olarak CRM\'e kaydeder.', icon: 'UserPlus' },
            { title: 'Dijital Katalog Gönderimi', description: 'Müşterinin ilgisine göre otomatik olarak proje kataloğu, ödeme planı ve sanal tur linkleri gönderir.', icon: 'FileImage' },
        ],
        benefits: [
            'Mesai dışı %100 müşteri yanıt oranı',
            'Otomatik lead yakalama ve CRM entegrasyonu',
            'Danışman yükünü %60 azaltma',
            'Anlık dijital katalog ve ödeme planı paylaşımı',
        ],
        useCases: [
            { title: 'Reklam Lead Karşılama', description: 'Facebook/Instagram reklamlarından gelen leadlere saniyeler içinde WhatsApp üzerinden otomatik hoş geldin mesajı ve proje bilgisi gönderin.' },
            { title: 'Mesai Dışı Müşteri Hizmeti', description: 'Gece veya hafta sonu WhatsApp\'tan yazan müşterileri kaybetmeyin. AI agent tüm soruları yanıtlar ve randevu oluşturur.' },
            { title: 'Toplu Kampanya Bildirimi', description: 'Yeni fiyat listesi veya kampanya duyurularını mevcut müşteri tabanınıza WhatsApp üzerinden otomatik gönderin.' },
        ],
        stats: [
            { value: '3 sn', label: 'Ortalama Yanıt Süresi' },
            { value: '%100', label: 'Mesai Dışı Yanıt Oranı' },
            { value: '%60', label: 'Danışman Yük Azaltma' },
            { value: '7/24', label: 'Kesintisiz Hizmet' },
        ],
        faq: [
            { question: 'AI WhatsApp chatbot nasıl kurulur?', answer: 'WhatsApp Business API entegrasyonu ile kurulur. Proje bilgileri, SSS ve satış senaryoları sisteme tanımlanır. Kurulum genellikle 1-2 gün sürer.' },
            { question: 'Bot mu yoksa gerçek kişi mi yazıyor anlaşılır mı?', answer: 'AI agent çok doğal bir dilde yanıt verir. Gerektiğinde konuşmayı gerçek danışmana aktarma (handoff) özelliği vardır.' },
            { question: 'WhatsApp chatbot KVKK\'ya uygun mu?', answer: 'Evet, tüm veri işleme süreçleri KVKK\'ya uygun olarak yürütülür. Müşteri onayı alınır ve veriler güvenli sunucularda saklanır.' },
        ]
    },
    {
        slug: 'ai-lead-qualification',
        title: 'AI Lead Skorlama',
        metaTitle: 'AI Lead Skorlama | Gayrimenkul Lead Qualification Sistemi',
        metaDescription: 'Yapay zeka ile otomatik lead skorlama ve kalifikasyon. Gayrimenkul leadlerinizi sıcak-ılık-soğuk olarak sınıflandırın, satış ekibinizin zamanını optimize edin.',
        heroHeadline: 'Her Lead\'in Gerçek Potansiyelini Bilin',
        heroSubheadline: 'AI, her müşteri adayının davranışlarını analiz eder ve 0-100 arası bir skor verir. Satış ekibiniz en yüksek skorlu leadlere öncelik vererek zamanını en verimli kullanır.',
        icon: 'Target',
        gradient: 'from-amber-500 to-orange-600',
        features: [
            { title: 'Davranışsal Skorlama', description: 'Müşterinin site ziyareti, WhatsApp etkileşimi, telefon görüşmesi ve e-posta açma oranlarını analiz ederek dinamik bir skor oluşturur.', icon: 'BarChart3' },
            { title: 'Otomatik Segmentasyon', description: 'Leadleri otomatik olarak Sıcak (80-100), Ilık (40-79) ve Soğuk (0-39) segmentlerine ayırır. Her segment için farklı takip stratejisi önerir.', icon: 'Layers' },
            { title: 'Prediktif Analiz', description: 'Geçmiş satış verilerini analiz ederek hangi lead profılinin satışa dönüşme olasılığının en yüksek olduğunu tahmin eder.', icon: 'TrendingUp' },
        ],
        benefits: [
            'Satış ekibinin zamanını %50 daha verimli kullanması',
            'Yüksek potansiyelli leadlere öncelik verme',
            'Soğuk leadler için otomatik nurturing akışları',
            'Satış tahmini doğruluğunda %35 artış',
        ],
        useCases: [
            { title: 'Yüksek Hacimli Lansman', description: 'Proje lansmanında binlerce lead geldiğinde AI skoru en yüksek olanları anında tespit eder ve danışmanlara öncelikli olarak atar.' },
            { title: 'Uzun Satış Döngüsü', description: 'Gayrimenkulde karar süreci 3-6 ay sürebilir. AI, bu süreçte müşterinin ilgi seviyesindeki değişimleri anlık takip eder.' },
            { title: 'Pazarlama ROI Optimizasyonu', description: 'Hangi reklam kanalından gelen leadlerin daha yüksek skorlara sahip olduğunu analiz ederek pazarlama bütçesini optimize eder.' },
        ],
        stats: [
            { value: '%50', label: 'Zaman Verimliliği Artışı' },
            { value: '0-100', label: 'Hassas Skor Aralığı' },
            { value: '%35', label: 'Tahmin Doğruluğu Artışı' },
            { value: 'Anlık', label: 'Gerçek Zamanlı Güncelleme' },
        ],
        faq: [
            { question: 'Lead skorlama nasıl çalışır?', answer: 'AI sistemi müşterinin tüm etkileşimlerini (arama, mesaj, site ziyareti, teklif talebi) analiz ederek 0-100 arası dinamik bir skor verir. Skor, her yeni etkileşimle güncellenir.' },
            { question: 'Lead skorlama doğru sonuç veriyor mu?', answer: 'Sistem, geçmiş satış verilerinden öğrenerek sürekli iyileşir. İlk aydan itibaren anlamlı sonuçlar verir, 3 ay sonra tahmin doğruluğu %85\'in üzerine çıkar.' },
            { question: 'Soğuk leadlere ne oluyor?', answer: 'Soğuk leadler otomatik nurturing akışlarına alınır. Periyodik olarak yeni kampanya bilgileri, fiyat güncellemeleri gönderilerek yeniden ısıtılmaya çalışılır.' },
        ]
    },
    {
        slug: 'ai-broker-matching',
        title: 'AI Broker Eşleştirme',
        metaTitle: 'AI Broker Eşleştirme | Gayrimenkul Broker Yönetim Sistemi',
        metaDescription: 'Yapay zeka ile müşteri-broker eşleştirme. Doğru müşteriyi doğru brokera yönlendirin, komisyon verimliliğini artırın.',
        heroHeadline: 'Doğru Müşteriyi Doğru Broker\'a AI Yönlendirsin',
        heroSubheadline: 'AI, her broker\'ın uzmanlık alanını ve başarı geçmişini analiz ederek gelen leadleri en uygun broker\'a otomatik atar. Hem müşteri memnuniyeti hem satış hızı artar.',
        icon: 'Network',
        gradient: 'from-pink-500 to-rose-600',
        features: [
            { title: 'Profil Bazlı Eşleştirme', description: 'Müşterinin bütçesi, tercih ettiği bölge ve daire tipi ile broker\'ın uzmanlık alanını eşleştirerek en optimal atamayı yapar.', icon: 'Handshake' },
            { title: 'Performans Bazlı Dağılım', description: 'Brokerların geçmiş satış performansı, dönüşüm oranları ve müşteri memnuniyet skorlarına göre lead dağılımını optimize eder.', icon: 'Award' },
            { title: 'Çakışma Önleme', description: 'Aynı müşterinin birden fazla brokera atanmasını engelleyen akıllı deduplikasyon sistemi. Telefon numarası bazlı koruma.', icon: 'ShieldCheck' },
        ],
        benefits: [
            'Broker başına satış dönüşümünde %25 artış',
            'Müşteri çakışması riskinin %100 ortadan kalkması',
            'Broker memnuniyeti ve sadakatinde artış',
            'Adil ve şeffaf lead dağılım sistemi',
        ],
        useCases: [
            { title: 'Büyük Broker Ağı Yönetimi', description: '50+ broker ile çalışan inşaat firmalarında lead dağılımı kaotik hale gelebilir. AI, her lead\'i otomatik olarak en uygun brokera yönlendirir.' },
            { title: 'Bölge Bazlı Yetkinlik', description: 'Kadıköy\'deki projeniz için Anadolu yakasında güçlü bir ağı olan brokerlara, Beylikdüzü projeniz için Avrupa yakası uzmanlarına yönlendirme yapar.' },
            { title: 'Yeni Broker Onboarding', description: 'Yeni sisteme dahil olan brokerlara düşük riskli leadler atayarak performanslarını test eder ve kademeli olarak lead kalitesini artırır.' },
        ],
        stats: [
            { value: '%25', label: 'Satış Dönüşüm Artışı' },
            { value: '%100', label: 'Çakışma Önleme' },
            { value: '<1 dk', label: 'Otomatik Atama Süresi' },
            { value: '%90', label: 'Broker Memnuniyeti' },
        ],
        faq: [
            { question: 'AI broker eşleştirme nasıl çalışır?', answer: 'Sistem, gelen lead\'in özelliklerini (bütçe, bölge, daire tipi) broker\'ın uzmanlık profili, geçmiş performansı ve mevcut yükü ile karşılaştırarak en optimal eşleşmeyi yapar.' },
            { question: 'Mevcut broker atamalarımı etkileyecek mi?', answer: 'Hayır, mevcut atamalar korunur. AI sistemi, yeni gelen leadler için öneriler sunar. Manuel atama yapma imkanı her zaman mevcuttur.' },
            { question: 'Broker\'lar bu sistemi nasıl görüyor?', answer: 'Brokerlar kendi portallarında atanan leadleri, performans istatistiklerini ve uzmanlık alanı etiketlerini görebilir. Sistem şeffaf ve adaletli olduğu için broker memnuniyetini artırır.' },
        ]
    },
    {
        slug: 'ai-outreach-otomasyonu',
        title: 'AI Outreach Otomasyonu',
        metaTitle: 'AI Outreach Otomasyonu | Gayrimenkul Satış Otomasyonu',
        metaDescription: 'AI sesli arama → WhatsApp → SMS → E-posta. Gayrimenkul satışında otomatik çok kanallı iletişim zinciri ile her müşteriye ulaşın.',
        heroHeadline: 'Çok Kanallı Otomatik Satış İletişim Motoru',
        heroSubheadline: 'AI agent önce arar, ilgileniyorsa WhatsApp\'tan detay gönderir, cevap gelmezse SMS atar, ardından e-posta ile takip eder. Tüm süreç tamamen otomatik.',
        icon: 'Workflow',
        gradient: 'from-indigo-500 to-blue-600',
        features: [
            { title: 'Otomatik İletişim Zinciri', description: 'Sesli Arama → WhatsApp → SMS → E-posta sırasıyla çalışan akıllı bir iletişim motoru. Her adımda müşterinin tepkisine göre sonraki adım belirlenir.', icon: 'GitBranch' },
            { title: 'A/B Test Senaryoları', description: 'Farklı mesaj tonları, arama saatleri ve iletişim sıralarını test ederek en yüksek dönüşüm oranını yakalayın.', icon: 'FlaskConical' },
            { title: 'Performans Analizi', description: 'Her iletişim adımının dönüşüm oranını, yanıt süresini ve müşteri tepkisini detaylı raporlarla analiz edin.', icon: 'BarChart3' },
        ],
        benefits: [
            'Tek bir müşteriye 4 farklı kanaldan ulaşma',
            'İletişim sürecinin %100 otomasyonu',
            'Her adımda müşteri tepkisine göre akıllı yönlendirme',
            'Kampanya bazlı A/B test imkanı',
        ],
        useCases: [
            { title: 'Proje Lansman Kampanyası', description: 'Yeni projenin duyurusunu 10.000 kişilik listeye otomatik olarak çok kanallı kampanya ile yapın. İlgilenenler otomatik satış hattına alınır.' },
            { title: 'Fiyat Güncellemesi', description: 'Fiyat listesi değiştiğinde ilgili müşteri segmentine otomatik bildirim gönderin. Tepki verenleri sıcak lead olarak işaretleyin.' },
            { title: 'Eski Müşteri Reaktivasyonu', description: '6+ ay önce ilgilenip vazgeçen müşterilere çok kanallı yeniden iletişim kampanyası başlatın.' },
        ],
        stats: [
            { value: '4 kanal', label: 'Çok Kanallı İletişim' },
            { value: '%100', label: 'Otomasyon Oranı' },
            { value: '10.000+', label: 'Kampanya Başına Ulaşım' },
            { value: '%45', label: 'Yanıt Oranı Artışı' },
        ],
        faq: [
            { question: 'Outreach otomasyonu ne demek?', answer: 'Outreach, müşterilere proaktif olarak ulaşma anlamına gelir. Otomasyon ile bu süreç AI tarafından çok kanallı olarak (arama, WhatsApp, SMS, e-posta) otomatik yürütülür.' },
            { question: 'Müşteriler rahatsız olmaz mı?', answer: 'Sistem, müşterinin tepkisine göre iletişim sıklığını ve kanalını ayarlar. İlgilenmediğini belirten müşteriler otomatik olarak listeden çıkarılır.' },
            { question: 'Outreach kampanyası nasıl kurulur?', answer: 'Hedef müşteri listesini seçin, mesaj şablonlarını belirleyin, iletişim zinciri sırasını ayarlayın ve kampanyayı başlatın. Tüm süreç birkaç tıklama ile kurulur.' },
        ]
    },
    {
        slug: 'ai-musteri-analizi',
        title: 'AI Müşteri Analizi',
        metaTitle: 'AI Müşteri Analizi | Gayrimenkul Müşteri Segmentasyonu',
        metaDescription: 'Yapay zeka ile gayrimenkul müşteri analizi ve segmentasyonu. Alım davranışlarını, bütçe profillerini ve tercihlerini AI ile analiz edin.',
        heroHeadline: 'Müşterilerinizi AI Gözüyle Tanıyın',
        heroSubheadline: 'Yapay zeka, müşterilerinizin alım davranışlarını, bütçe profillerini ve tercihlerini analiz ederek kişiselleştirilmiş satış stratejileri önerir.',
        icon: 'Users',
        gradient: 'from-teal-500 to-cyan-600',
        features: [
            { title: 'Davranış Analizi', description: 'Müşterinin hangi dairelere baktığını, hangi fiyat aralığında arama yaptığını ve hangi saatlerde aktif olduğunu analiz eder.', icon: 'Activity' },
            { title: 'Segmentasyon Motoru', description: 'Yatırımcı, son kullanıcı, lüks segment, orta gelir gibi kategorilere otomatik segmentasyon. Her segmente özel iletişim stratejisi.', icon: 'PieChart' },
            { title: 'Churn Tahmini', description: 'Satın alma sürecinden vazgeçme riski olan müşterileri önceden tespit eder ve erken müdahale önerileri sunar.', icon: 'AlertCircle' },
        ],
        benefits: [
            'Müşteri başına kişiselleştirilmiş satış yaklaşımı',
            'Yatırımcı vs son kullanıcı otomatik tespiti',
            'Vazgeçme riski olan müşterilerin erken tespiti',
            'Pazarlama kampanyalarında %30 daha yüksek ROI',
        ],
        useCases: [
            { title: 'Kişiselleştirilmiş Portföy Sunumu', description: 'AI, müşterinin bütçesine ve tercihlerine göre en uygun 3-5 daireyi otomatik belirler ve danışmana önerir.' },
            { title: 'Yatırımcı Tespiti', description: 'Birden fazla daire ile ilgilenen, kısa sürede karar veren ve fiyat hassasiyeti düşük profilleri otomatik tespit eder.' },
            { title: 'Kampanya Hedefleme', description: 'Hangi müşteri segmentinin hangi kampanyaya en çok tepki vereceğini tahmin ederek hedefli pazarlama yapar.' },
        ],
        stats: [
            { value: '%30', label: 'Pazarlama ROI Artışı' },
            { value: '5+', label: 'Otomatik Segment' },
            { value: 'Anlık', label: 'Profil Güncelleme' },
            { value: '%85', label: 'Churn Tahmin Doğruluğu' },
        ],
        faq: [
            { question: 'AI müşteri analizi ne işe yarar?', answer: 'AI müşteri analizi, her müşterinin alım davranışlarını, tercihlerini ve potansiyelini otomatik olarak analiz eder. Böylece danışmanlar her müşteriye en doğru yaklaşımı uygulayabilir.' },
            { question: 'Hangi veriler analiz edilir?', answer: 'Müşteri etkileşimleri (arama, mesaj, site ziyareti), teklif geçmişi, bütçe bilgisi, konum tercihleri ve daire tipi ilgileri analiz edilir.' },
            { question: 'Verilerim güvende mi?', answer: 'Evet, tüm veriler KVKK\'ya uygun olarak işlenir ve 256-bit SSL ile korunan bulut sunucularda saklanır. Veri erişimi rol bazlı yetkilendirme ile kontrol edilir.' },
        ]
    },
    {
        slug: 'ai-satis-copilot',
        title: 'AI Satış Co-Pilot',
        metaTitle: 'AI Satış Co-Pilot | Gayrimenkul Danışmanı İçin AI Asistan',
        metaDescription: 'Gayrimenkul danışmanları için AI co-pilot. Gerçek zamanlı satış koçluğu, itiraz yönetimi önerileri ve anlaşma kapama stratejileri.',
        heroHeadline: 'Her Danışmanın Yanında Bir AI Koç',
        heroSubheadline: 'AI Co-Pilot, satış görüşmesi sırasında danışmana gerçek zamanlı öneriler sunar. İtiraz yönetimi, fiyat müzakeresi ve anlaşma kapama stratejileri.',
        icon: 'Sparkles',
        gradient: 'from-yellow-500 to-amber-600',
        features: [
            { title: 'Gerçek Zamanlı Koçluk', description: 'Görüşme sırasında müşterinin sorularına ve itirazlarına karşı danışmana anlık öneri kartları sunar.', icon: 'Lightbulb' },
            { title: 'Anlaşma Kapama Stratejileri', description: 'Müşterinin profili ve görüşme geçmişine göre en etkili kapanış tekniklerini önerir. "FOMO", "Değer Odaklı" veya "Referans" stratejileri.', icon: 'Trophy' },
            { title: 'Satış Sonrası Aksiyon Planı', description: 'Her görüşmeden sonra yapılması gereken aksiyonları (takip araması, evrak gönderimi, teklif hazırlama) otomatik listeye alır.', icon: 'ClipboardCheck' },
        ],
        benefits: [
            'Deneyimsiz danışmanların performansını hızla yükseltme',
            'Standart satış metodolojisi uygulama',
            'Her görüşmeden sonra otomatik aksiyon planı',
            'İtiraz yönetiminde %40 iyileşme',
        ],
        useCases: [
            { title: 'Yeni Danışman Eğitimi', description: 'İşe yeni başlayan danışmanlar, AI Co-Pilot sayesinde deneyimli bir mentor gibi rehberlik alarak ilk haftadan verimli satış yapabilir.' },
            { title: 'Zor Müşteri Yönetimi', description: 'Aşırı talepkar veya kararsız müşterilerde AI, danışmana duruma özel itiraz yönetimi ve ikna stratejileri önerir.' },
            { title: 'Satış Standardizasyonu', description: 'Tüm ekibin aynı standart satış metodolojisini uygulamasını sağlayarak kalite tutarlılığını artırır.' },
        ],
        stats: [
            { value: '%40', label: 'İtiraz Yönetimi İyileşme' },
            { value: 'Anlık', label: 'Gerçek Zamanlı Öneri' },
            { value: '%30', label: 'Yeni Danışman Hızlanma' },
            { value: '50+', label: 'Hazır Satış Senaryosu' },
        ],
        faq: [
            { question: 'AI Co-Pilot nedir?', answer: 'AI Co-Pilot, satış danışmanlarına görüşme sırasında ve sonrasında yapay zeka destekli koçluk sağlayan bir araçtır. İtiraz yönetimi, kapanış stratejileri ve aksiyon planı önerir.' },
            { question: 'Co-Pilot müşteriye görünür mü?', answer: 'Hayır, AI Co-Pilot tamamen danışman tarafında çalışır. Müşteri hiçbir şekilde AI asistanın varlığından haberdar olmaz.' },
            { question: 'Co-Pilot hangi cihazlarda çalışır?', answer: 'Web tabanlı olduğu için bilgisayar, tablet ve telefondan erişilebilir. Satış ofisinde veya sahada her yerde kullanılabilir.' },
        ]
    },
    {
        slug: 'ai-emlak-agent',
        title: 'AI Emlak Agent',
        metaTitle: 'Yapay Zeka Emlak Danışmanı | AI Emlak Agent | NovoxCRM',
        metaDescription: 'Emlak acenteleri ve brokerlar için 7/24 çalışan yapay zeka emlak danışmanı. Otomatik portföy eşleştirme, randevu planlama ve lead yönetimi.',
        heroHeadline: '7/24 Çalışan Yapay Zeka Emlak Danışmanınız',
        heroSubheadline: 'Müşterilerinizle WhatsApp ve sesli aramalar üzerinden konuşan, portföy kriterlerini eşleştiren ve randevu alan akıllı emlak agentı.',
        icon: 'UserCheck',
        gradient: 'from-purple-500 to-indigo-600',
        features: [
            { title: 'Otomatik Portföy Eşleştirme', description: 'Müşterinin istediği bütçe, m² ve konum kriterlerine en uygun ilanları veri tabanından saniyeler içinde bulup gönderir.', icon: 'Target' },
            { title: 'Akıllı Randevu Planlama', description: 'Müşterinin uygun olduğu gün ve saate göre danışmanın takviminde otomatik yer ayırır ve her iki tarafa hatırlatır.', icon: 'Calendar' },
            { title: '7/24 Müşteri Karşılama', description: 'Gece veya tatil günlerinde bile gelen talepleri yanıtsız bırakmaz, ilk temasla lead bilgilerini doğrular.', icon: 'Clock' }
        ],
        benefits: [
            'Portföy satış ve kiralama hızında %35 artış',
            'Gece gelen müşteri taleplerini anında yakalama',
            'Danışmanların rutin sekreterlik işlerinde %50 zaman tasarrufu',
            'Müşteri veri tabanının her an güncel kalması'
        ],
        useCases: [
            { title: 'Reklam Leadlerini Karşılama', description: 'İlan portalından gelen e-posta veya formları anında işleyerek müşteriye WhatsApp üzerinden portföy detaylarını otomatik iletir.' },
            { title: 'İlan Eşleştirme Otomasyonu', description: 'Yeni bir portföy girildiğinde, o mülk kriterlerine uygun kayıtlı tüm eski müşterileri bulup otomatik WhatsApp bilgilendirmesi yapar.' },
            { title: 'Ziyaret Randevuları Kurgulama', description: 'Proje veya daire görmek isteyen alıcılarla danışmanların takvimini çakışma olmadan eşleştirip randevu oluşturur.' }
        ],
        stats: [
            { value: '3 sn', label: 'Ortalama Yanıt Süresi' },
            { value: '%100', label: 'Mesai Dışı Yanıt Oranı' },
            { value: '%35', label: 'Portföy Satış Hız Artışı' },
            { value: '24/7', label: 'Kesintisiz Hizmet' }
        ],
        faq: [
            { question: 'AI Emlak Agent nasıl çalışır?', answer: 'Sistem, web siteniz, ilan portalları veya WhatsApp üzerinden gelen müşteri taleplerini yapay zeka ile analiz eder, kriterleri belirler ve portföy havuzunuzla otomatik eşleştirerek yanıtlar.' },
            { question: 'İlanları nereden çeker?', answer: 'Kendi CRM panelinizdeki portföy havuzundan ve entegre olduğunuz ilan portallarından güncel mülk listelerini çekerek müşterilere sunar.' },
            { question: 'KVKK uyumlu mu?', answer: 'Evet. Müşteriye ilk mesajda KVKK onay metni sunulur. Onay vermeyen müşterilere veri işleme yapılmaz, kayıtlar güvenli sunucularda tutulur.' }
        ]
    },
    {
        slug: 'voice-ai-real-estate',
        title: 'Voice AI Real Estate',
        metaTitle: 'Gayrimenkul Sesli Yapay Zeka Sistemleri | Voice AI Real Estate | NovoxCRM',
        metaDescription: 'Gayrimenkul sektörüne özel sesli yapay zeka arama robotu. Vapi + ElevenLabs entegrasyonu ile doğal Türkçe konuşan akıllı arama asistanı.',
        heroHeadline: 'Gayrimenkul Arama Süreçlerinde Doğal Sesli Yapay Zeka',
        heroSubheadline: 'Sesli yapay zeka ile soğuk aramaları, randevu hatırlatmalarını ve eski lead reaktivasyonunu insan doğallığında otomatikleştirin.',
        icon: 'Mic',
        gradient: 'from-blue-500 to-indigo-600',
        features: [
            { title: 'İnsan Doğallığında Türkçe Ses', description: 'Vapi ve ElevenLabs iş birliğiyle üretilen, nefes alma ve tonlama detaylarına sahip son derece doğal Türkçe ses tonu.', icon: 'Phone' },
            { title: 'Akıllı İtiraz Yönetimi', description: 'Müşterinin "Bütçeme uymuyor" veya "Sonra görüşelim" gibi itirazlarına karşı önceden belirlenmiş akıllı ikna senaryolarını uygular.', icon: 'GitBranch' },
            { title: 'CRM Entegre Transkript', description: 'Yapılan her aramanın ses kaydı, transkripti ve özet analizi (ilgileniyor, ilgilenmiyor, meşgul) anında CRM kartına işlenir.', icon: 'FileText' }
        ],
        benefits: [
            'Günde 1000+ arama yapabilen limitsiz çağrı kapasitesi',
            'Manuel arama maliyetlerinde %70 tasarruf',
            'Müşteri takibinde gecikmelerin tamamen sıfırlanması',
            'Yüksek potansiyelli leadlerin anında danışmana yönlendirilmesi'
        ],
        useCases: [
            { title: 'Soğuk Arama Kampanyaları', description: 'Yeni lansman projeleriniz için geniş veri listelerini yorulmadan arar, sadece ilgilenenleri sıcak lead olarak satış ekibinize aktarır.' },
            { title: 'Randevu & Ziyaret Hatırlatma', description: 'Yarın satış ofisini ziyaret edecek olan müşterileri otomatik arayarak randevuyu teyit eder.' },
            { title: 'Portföy Güncelleme Duyuruları', description: 'Fiyat listesi değişen veya yeni etabı satışa çıkan projeler için eski veritabanını arayıp reaktivasyon sağlar.' }
        ],
        stats: [
            { value: '1000+', label: 'Günlük Arama Kapasitesi' },
            { value: '%90', label: 'Doğal Türkçe Skoru' },
            { value: '0 ms', label: 'Yapay Zeka Yanıt Gecikmesi' },
            { value: '%70', label: 'Operasyonel Maliyet Tasarrufu' }
        ],
        faq: [
            { question: 'Sesli yapay zeka hangi dilleri konuşur?', answer: 'Ana odak noktası doğal Türkçe olmakla birlikte, isteğe göre İngilizce, Arapça ve Rusça dillerinde de konuşma yapabilmektedir.' },
            { question: 'Telefon numarası entegrasyonu nasıl olur?', answer: 'Kendi kurumsal numaranızı Twilio veya yerel operatör sip hatları üzerinden sisteme bağlayabilir, aramaların kendi numaranızdan çıkmasını sağlayabilirsiniz.' },
            { question: 'Sistemin kurulumu ne kadar sürer?', answer: 'Arama senaryolarının kurgulanması ve test aramalarının tamamlanması genellikle 2-3 iş günü içinde tamamlanmaktadır.' }
        ]
    }
];
