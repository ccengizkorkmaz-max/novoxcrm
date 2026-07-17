export interface UseCaseData {
    slug: string;
    title: string;
    metaTitle: string;
    metaDescription: string;
    heroHeadline: string;
    heroSubheadline: string;
    icon: string;
    gradient: string;
    stats: { value: string; label: string }[];
    features: { title: string; description: string; icon: string }[];
    useCases: { title: string; description: string }[];
    benefits: string[];
    faq: { question: string; answer: string }[];
}

export const useCases: UseCaseData[] = [
    {
        slug: 'lead-yonetimi',
        title: 'Müşteri Adayı (Lead) Yönetimi',
        metaTitle: 'Gayrimenkul Lead Yönetimi ve Otomatik Dağıtım Yazılımı | NovoxCRM',
        metaDescription: 'Reklamlardan gelen müşteri adaylarını saniyeler içinde danışmanlara atayın. Gayrimenkul lead takibi, otomatik hatırlatıcılar ve yapay zeka kalifikasyonu.',
        heroHeadline: 'Müşteri Adaylarını Saniyeler İçinde Satışa Dönüştürün',
        heroSubheadline: 'Meta, Google ve web sitenizden gelen leadleri anında yakalayın, doğru danışmana adil şekilde dağıtın ve hiçbir takibi kaçırmayın.',
        icon: 'Target',
        gradient: 'from-blue-500 to-cyan-500',
        stats: [
            { value: '%40+', label: 'Dönüşüm Oranı Artışı' },
            { value: '< 2 dk', label: 'İlk Temas Süresi' },
            { value: '%100', label: 'Otomatik Dağıtım' },
            { value: '0 Kayıp', label: 'Kaçan Görüşme Oranı' }
        ],
        features: [
            { title: 'Otomatik Lead Dağıtım', description: 'Gelen müşteri adaylarını danışmanların uzmanlık alanına, bölgesine veya sıra sistemine (round-robin) göre saniyeler içinde atayın.', icon: 'Zap' },
            { title: 'Yapay Zeka Destekli Kalifikasyon', description: 'Gelen leadleri AI sesli arama ve WhatsApp asistanları ile önceden arayıp bütçe ve satın alma niyetine göre filtreleyin.', icon: 'Brain' },
            { title: 'Uçtan Uca İletişim Geçmişi', description: 'Görüşme kayıtları, WhatsApp mesajlaşmaları ve teklif süreçleri tek bir zaman tünelinde kronolojik olarak saklanır.', icon: 'Clock' }
        ],
        useCases: [
            { title: 'Lansman Döneminde Toplu Lead Girişi', description: 'Yeni başlayan projede gelen binlerce leadi dakikalar içinde ekibe dağıterek sıcak satış yapın.' },
            { title: 'Reklam Kampanyası Entegrasyonu', description: 'Meta Leads Ads ve Google Forms üzerinden gelen verileri anında CRM havuzuna aktarın.' }
        ],
        benefits: [
            'Danışmanlar arasında adil ve dengeli iş dağılımı',
            'Sıcak leadlere anında (ilk 2 dakikada) geri dönüş',
            'Geçmiş görüşmelerin ve müşteri notlarının kurumsal hafızada saklanması'
        ],
        faq: [
            { question: 'Lead dağıtımı nasıl yapılıyor?', answer: 'Sistemde tanımlayacağınız kurallar (sıralı, rastgele, bölge bazlı veya uzmanlık bazlı) doğrultusunda leadler otomatik olarak danışmanlara atanır.' },
            { question: 'Hangi reklam kanalları entegre edilebilir?', answer: 'Meta (Facebook/Instagram) Lead Ads, Google Ads, Sahibinden.com, Hepsiemlak ve web sitesi formlarınız entegre çalışır.' }
        ]
    },
    {
        slug: 'whatsapp-entegrasyonu',
        title: 'WhatsApp CRM ve Otomasyonu',
        metaTitle: 'Yapay Zeka Destekli WhatsApp CRM Entegrasyonu | NovoxCRM',
        metaDescription: 'Müşterilerinizle WhatsApp üzerinden tek tıkla görüşme başlatın. Otomatik şablonlar, toplu mesaj gönderimi ve AI WhatsApp asistanı.',
        heroHeadline: 'Müşterileriniz Neredeyse Satış Ekibiniz de Orada',
        heroSubheadline: 'WhatsApp konuşmalarını CRM kayıtlarıyla eşleştirin, şablon mesajlarla saniyeler içinde teklif iletin ve 7/24 AI asistanlarla yanıt verin.',
        icon: 'MessageCircle',
        gradient: 'from-emerald-500 to-teal-500',
        stats: [
            { value: '7/24', label: 'Kesintisiz Destek' },
            { value: '3 Kat', label: 'Daha Hızlı Geri Dönüş' },
            { value: '1 Tık', label: 'Teklif & Katalog Gönderimi' },
            { value: '%85', label: 'Okunma Oranı Artışı' }
        ],
        features: [
            { title: 'Tek Tıkla WhatsApp Başlatma', description: 'CRM ekranından çıkmadan müşteri numarasına tıklayarak doğrudan WhatsApp görüşmesi başlatın ve konuşmayı kaydedin.', icon: 'Zap' },
            { title: 'Hazır Şablonlar & Katalog', description: 'Daire detayları, ödeme planları ve teklif formlarını önceden hazırlanmış şablonlarla anında müşteriye gönderin.', icon: 'FileText' },
            { title: 'Yapay Zeka WhatsApp Ajanı', description: 'Gelen mesai dışı mesajları yapay zeka asistanı yanıtlasın, müşteri talebini alıp CRM\'de kayıt açsın.', icon: 'Brain' }
        ],
        useCases: [
            { title: 'Otomatik Randevu Hatırlatıcı', description: 'Müşteriye randevu saatinden 2 saat önce otomatik lokasyon ve saat bilgisi gönderilir.' },
            { title: 'Hızlı Teklif ve Ödeme Planı Paylaşımı', description: 'Hazırlanan ödeme planı tablosu tek tuşla PDF olarak WhatsApp\'tan iletilir.' }
        ],
        benefits: [
            'E-postalara kıyasla 5 kat daha yüksek geri dönüş oranı',
            'Tüm konuşma geçmişinin şirket panelinde yedeklenmesi',
            'Mesai saatleri dışında da müşteri taleplerinin toplanabilmesi'
        ],
        faq: [
            { question: 'Resmi WhatsApp API kullanılıyor mu?', answer: 'Evet, resmi WhatsApp Business API veya hızlı entegrasyon çözümlerimizle sisteminizi güvenle bağlayabilirsiniz.' },
            { question: 'Konuşmalar danışman bazlı kısıtlanabilir mi?', answer: 'Evet, her danışman yalnızca kendi atandığı müşterilerin WhatsApp geçmişini ve konuşmalarını görebilir.' }
        ]
    },
    {
        slug: 'stok-yonetimi',
        title: 'Stok ve Daire Lejantı Yönetimi',
        metaTitle: 'Gayrimenkul Stok Yönetimi ve İnteraktif Daire Lejantı | NovoxCRM',
        metaDescription: 'Projelerinizin blok ve daire planlarını interaktif lejant üzerinden takip edin. Satılan, rezerve olan ve boş daireleri renk kodlarıyla anlık yönetin.',
        heroHeadline: 'Daire Stoklarınızı ve Satış Durumunu Anlık Görün',
        heroSubheadline: 'Mükerrer (çifte) satış riskini sıfıra indirin. İnteraktif kat planı ve blok lejantı ile güncel stoğu tüm ekiple ve brokerlarla paylaşın.',
        icon: 'Building',
        gradient: 'from-blue-600 to-indigo-600',
        stats: [
            { value: '%100', label: 'Doğru Stok Garantisi' },
            { value: '0 Hata', label: 'Mükerrer Satış Riski' },
            { value: '1 Saniye', label: 'Fiyat Güncelleme' },
            { value: 'Anlık', label: 'Kat Planı Senkronizasyonu' }
        ],
        features: [
            { title: 'İnteraktif Kat Planı (Lejant)', description: 'Blokları, katları ve daireleri görsel şema üzerinde görün. Satış, rezervasyon ve boş durumlarını renk kodlarıyla izleyin.', icon: 'Layers' },
            { title: 'Merkezi Fiyat Listesi', description: 'Şerefiye, metrekare ve kat farklarına göre fiyatları tek bir panelden güncelleyin, tüm ekibe anında yansısın.', icon: 'Calculator' },
            { title: 'Gelişmiş Opsiyon & Rezervasyon', description: 'Müşterilere belirli sürelerle daire opsiyonlayın. Süre bittiğinde daire otomatik olarak tekrar satışa açılsın.', icon: 'Clock' }
        ],
        useCases: [
            { title: 'Lansman Günü Stok Kilitleme', description: 'Onlarca danışmanın aynı anda satış yaptığı lansmanlarda stok çakışmalarını %100 engelleyin.' },
            { title: 'Broker Portalında Güncel Stok Gösterimi', description: 'Dış acentelerin sadece izin verdiğiniz boş daireleri ve fiyatları görmesini sağlayın.' }
        ],
        benefits: [
            'Projedeki güncel finansal değerin ve kalan stok hacminin anlık takibi',
            'Satış ekipleri arasında stok çakışması veya fiyat karmaşasının önlenmesi',
            'Müşterilere anında doğru daire ve kat bilgisi sunabilme'
        ],
        faq: [
            { question: 'Toplu konut projelerinde kaç daireye kadar destekleniyor?', answer: 'Sistemimiz on binlerce bağımsız bölümü içeren devasa projeleri dahi performans kaybı yaşatmadan interaktif şekilde listeler.' },
            { question: 'Fiyat listesini Excel\'den aktarabilir miyiz?', answer: 'Evet, mevcut daire listenizi ve şerefiye fiyatlarınızı tek tıkla Excel dosyasından içe aktarabilirsiniz.' }
        ]
    },
    {
        slug: 'broker-yonetimi',
        title: 'B2B Broker ve Acente Portalı',
        metaTitle: 'Broker Yönetim Sistemi ve Acente Portalı Yazılımı | NovoxCRM',
        metaDescription: 'Dış broker ve acentelerinizi sisteme entegre edin. Stok paylaşımı, lead yönlendirme, komisyon takibi ve hakediş süreçleri.',
        heroHeadline: 'Dış Satış Ağınızı Güvenli Bir Satış Motoruna Dönüştürün',
        heroSubheadline: 'Projenizdeki satılabilir stokları harici acente ve brokerlarla paylaşın, gönderdikleri leadleri güvenle izleyin ve komisyon süreçlerini otomatiğe bağlayın.',
        icon: 'Network',
        gradient: 'from-purple-500 to-indigo-500',
        stats: [
            { value: '%60+', label: 'Dış Satış Katkısı' },
            { value: 'Sıfır', label: 'Müşteri Çakışması' },
            { value: 'Otomatik', label: 'Hakediş Hesaplama' },
            { value: '%100', label: 'Veri Güvenliği' }
        ],
        features: [
            { title: 'Broker Başvuru & Onay Portalı', description: 'Çalışmak istediğiniz acentelerin başvurularını alın, sözleşmelerini yükleyin ve sistem erişimini onaylayın.', icon: 'UserPlus' },
            { title: 'Müşteri Çakışma Önleme', description: 'Brokerların kaydettiği leadlerin sistemde daha önce kayıtlı olup olmadığını kontrol edin, hak sahipliğini netleştirin.', icon: 'ShieldCheck' },
            { title: 'Komisyon Takip Motoru', description: 'Satış tutarı üzerinden yüzde veya sabit tutar bazlı broker komisyonlarını ve ödeme vadelerini yönetin.', icon: 'Calculator' }
        ],
        useCases: [
            { title: 'Uluslararası Acente Yönetimi', description: 'Yurt dışındaki onlarca farklı acenteye kendi dillerinde stok ve fiyat listesi sunarak satışları hızlandırın.' },
            { title: 'Broker Hakediş Raporu', description: 'Hangi brokerın ne kadar satış yaptığını ve ne zaman ödeme alacağını tek ekrandan izleyin.' }
        ],
        benefits: [
            'Proje dışındaki yüzlerce serbest brokerı güvenli bir satış gücü olarak kullanma',
            'Müşteri mülkiyeti tartışmalarını engelleyen şeffaf kurallar',
            'Finans ekibi için kolaylaştırılmış fatura ve hakediş süreçleri'
        ],
        faq: [
            { question: 'Brokerlar benim tüm müşterilerimi görebilir mi?', answer: 'Hayır. Brokerlar ve acenteler sadece kendi sisteme girdikleri müşteri adaylarını görebilir; diğer verilerinize erişemezler.' },
            { question: 'Acente komisyonları nasıl hesaplanır?', answer: 'Satış sözleşmesinde tanımlanan oranlar doğrultusunda, tahsilat yapıldıkça broker komisyonları otomatik olarak vadelere bölünür.' }
        ]
    },
    {
        slug: 'odeme-plani',
        title: 'Dinamik Ödeme Planı ve Tahsilat',
        metaTitle: 'Gayrimenkul Ödeme Planı Hesaplama ve Taksit Takip Programı | NovoxCRM',
        metaDescription: 'Müşteriye özel peşinat, ara ödemeler ve balon ödemelerle dinamik ödeme planları hazırlayın. Senet takibi ve gecikmiş tahsilat yönetimi.',
        heroHeadline: 'Excel Karmaşasına Son: Dinamik Ödeme Planları',
        heroSubheadline: 'Müşterilerinizin bütçesine göre esnek taksitlendirmeler oluşturun, döviz bazlı ödemeleri takip edin ve senet tahsilatlarını otomatikleştirin.',
        icon: 'Calculator',
        gradient: 'from-amber-500 to-orange-500',
        stats: [
            { value: 'Saniyeler', label: 'Plan Oluşturma Süresi' },
            { value: 'Otomatik', label: 'Senet & PDF Yazdırma' },
            { value: '%95', label: 'Zamanında Tahsilat' },
            { value: 'Çoklu', label: 'Döviz Desteği ($, €, TL)' }
        ],
        features: [
            { title: 'Esnek Taksitlendirme Motoru', description: 'Peşinat oranı, ara ödeme tarihleri ve balon ödeme tutarlarına göre saniyeler içinde ödeme tablosu oluşturun.', icon: 'Zap' },
            { title: 'Pazarlık & Fiyat Geçmişi Takibi', description: 'Müşteriye verilen ilk tekliften nihai anlaşmaya kadar yapılan tüm fiyat revizyonlarını, iskonto oranlarını ve pazarlık geçmişini geriye dönük izleyin.', icon: 'TrendingUp' },
            { title: 'Gecikme & Vade Hatırlatıcılar', description: 'Vadesi yaklaşan taksitler ve geciken ödemeler için müşterilere SMS, e-posta veya WhatsApp üzerinden otomatik bildirim gönderin.', icon: 'Clock' },
            { title: 'Döviz Bazlı Takip & Kur Farkı', description: 'Ödemeleri USD, EUR veya TL olarak planlayın; tahsilat günündeki Merkez Bankası kuruna göre kur farklarını otomatik hesaplayın.', icon: 'DollarSign' }
        ],
        useCases: [
            { title: 'Senetli Konut Satışı Takibi', description: 'Vadelere göre basılacak senet listesini CRM\'den tek tuşla döküm alarak matbaaya gönderin veya arşivleyin.' },
            { title: 'Kişiye Özel Ödeme Kampanyaları', description: 'Müşteri bütçesine özel faizsiz ara ödemeli ödeme planları kurgulayarak satışı kapatın.' }
        ],
        benefits: [
            'Tahsilat vadelerinin ve nakit akışının şeffaf şekilde izlenmesi',
            'Geciken tahsilat oranlarında belirgin düşüş',
            'Finans ve satış departmanları arasında hatasız veri senkronizasyonu'
        ],
        faq: [
            { question: 'Kur farkı hesaplaması nasıl yapılıyor?', answer: 'TCMB (Türkiye Cumhuriyeti Merkez Bankası) API entegrasyonu sayesinde tahsilat gününün döviz kuru baz alınarak kur farkı otomatik yansıtılır.' },
            { question: 'Ödeme planı PDF olarak paylaşılabiliyor mu?', answer: 'Evet, hazırladığınız planı kurumsal logonuzla birlikte saniyeler içinde PDF olarak indirebilir ve müşteriye iletebilirsiniz.' }
        ]
    },
    {
        slug: 'musteri-portali',
        title: 'Müşteri Deneyimi ve Bilgi Portalı',
        metaTitle: 'Müşteriye Özel Gayrimenkul Deneyim Portalı | NovoxCRM',
        metaDescription: 'Müşterilerinizin kendi ödeme planlarını, senet durumlarını, sözleşmelerini ve tapu süreçlerini takip edebileceği kendin-yap (self-service) müşteri portalı.',
        heroHeadline: 'Müşterilerinize Şeffaf ve Güvenli Bir Deneyim Sunun',
        heroSubheadline: 'Her müşteriye özel açılan güvenli portal ile ödeme planlarını, taksit geçmişini ve tapu/teslimat durumlarını 7/24 izlemelerini sağlayın.',
        icon: 'Users',
        gradient: 'from-teal-500 to-emerald-600',
        stats: [
            { value: '%80', label: 'Daha Az Telefon Trafiği' },
            { value: '%100', label: 'Şeffaf Ödeme Takibi' },
            { value: '7/24', label: 'Self-Service Erişim' },
            { value: 'Sıfır', label: 'Hatalı Bilgilendirme' }
        ],
        features: [
            { title: 'Kişiye Özel Güvenli Giriş', description: 'Her müşteriye özel üretilen SMS/e-posta onaylı şifresiz giriş linkleri ile yüksek güvenlikli erişim.', icon: 'ShieldCheck' },
            { title: 'Canlı Ödeme & Taksit İzleme', description: 'Müşteriler ödedikleri taksitleri, kalan senetlerini ve yaklaşan ödemelerini canlı olarak portal üzerinden takip eder.', icon: 'Activity' },
            { title: 'Belge & Sözleşme Deposu', description: 'Satış sözleşmesi, kat planı, teknik şartname ve tapu evrakları gibi tüm resmi belgeler müşterinin kendi ekranında saklanır.', icon: 'FileText' }
        ],
        useCases: [
            { title: 'Taksit ve Senet Hatırlatma', description: 'Müşteri yaklaşan ödemesini portal üzerinden görerek gecikme yaşamadan bütçesini planlar.' },
            { title: 'Teslimat ve Kusur Bildirimi', description: 'Daire teslim aşamasında müşteri tespit ettiği eksiklikleri doğrudan portaldan fotoğraf yükleyerek bildirebilir.' }
        ],
        benefits: [
            'Müşteri temsilcilerinin telefon ve mesaj trafiğini %80 oranında azaltma',
            'Finansal süreçlerde tam şeffaflık sağlayarak güven bağı oluşturma',
            'Evrak ve sözleşme kayıplarının tamamen önüne geçilmesi'
        ],
        faq: [
            { question: 'Müşteri portalı güvenli mi?', answer: 'Evet, portal tamamen şifreli olup her müşteri sadece kendi sözleşmesini ve ödemelerini görebilir; diğer daire veya kişisel verilere erişmesi imkansızdır.' },
            { question: 'Ödeme planı güncellendiğinde buraya yansır mı?', answer: 'Evet, CRM üzerinde yaptığınız her revizyon veya tahsilat girişi anında müşterinin portal ekranına yansır.' }
        ]
    }
];
