export interface SectorData {
    slug: string;
    title: string;
    metaTitle: string;
    metaDescription: string;
    heroHeadline: string;
    heroSubheadline: string;
    features: { title: string; description: string; icon: string }[];
    benefits: string[];
}

export const sectors: SectorData[] = [
    {
        slug: 'ticari-gayrimenkul-crm',
        title: 'Ticari Gayrimenkul CRM',
        metaTitle: 'Ticari Gayrimenkul CRM Programı | NovoxCRM',
        metaDescription: 'Plaza, dükkan, ofis ve depo satış/kiralama süreçleri için özel geliştirilmiş ticari gayrimenkul CRM programı. Kurumsal müşteri takibi ve ROI analizi.',
        heroHeadline: 'Ticari Gayrimenkul İçin Yeni Nesil CRM',
        heroSubheadline: 'B2B satış süreçleri, metrekare bazlı getiri analizleri ve ticari portföy yönetimi hiç bu kadar kolay olmamıştı.',
        features: [
            { title: 'B2B Şirket Profilleri', description: 'Şirketlerin hiyerarşik yapısını, satın alma yetkililerini ve geçmiş görüşmeleri tek ekranda görün.', icon: 'Building2' },
            { title: 'ROI & Amortisman Analizi', description: 'Ticari portföylerin metrekare birim fiyatlarını ve kira çarpanlarını otomatik hesaplayın.', icon: 'LineChart' },
            { title: 'Teklif Otomasyonu', description: 'Kurumsal müşterilerinize saniyeler içinde PDF formatında profesyonel teklifler gönderin.', icon: 'FileText' }
        ],
        benefits: [
            'Kurumsal hafıza oluşturma',
            'Sözleşme yenileme hatırlatıcıları',
            'Ticari mülk yatırım analizi'
        ]
    },
    {
        slug: 'luks-konut-crm',
        title: 'Lüks Konut CRM',
        metaTitle: 'Lüks Konut Satışı İçin Gayrimenkul CRM | Oikos CRM',
        metaDescription: 'Lüks konut, yalı ve villa satışlarında üst düzey müşteri deneyimi sunmak için yapay zeka destekli gayrimenkul CRM yazılımı.',
        heroHeadline: 'Lüks Konut Satışında Kusursuz Müşteri Deneyimi',
        heroSubheadline: 'A+ gelir grubundaki müşterilerinizi VIP standartlarında yönetin. Gizlilik, hız ve kişiselleştirilmiş portföy sunumları.',
        features: [
            { title: 'VIP Müşteri Segmentasyonu', description: 'Yatırımcı portföyünüzü ilgi alanlarına ve bütçe aralıklarına göre etiketleyin.', icon: 'Star' },
            { title: 'Gizli Portföy Yönetimi', description: 'Halka açık olmayan (Off-market) lüks portföyleri sadece yetkili danışmanlar arasında paylaşın.', icon: 'Lock' },
            { title: 'Özel Sunum Linkleri', description: 'Müşterinize özel, şifreli ve markanıza ait özel domain ile portföy sunumları oluşturun.', icon: 'Link' }
        ],
        benefits: [
            'Müşteri mahremiyetinin en üst düzeyde korunması',
            'Uluslararası yatırımcılar için çoklu dil desteği',
            'Kişiye özel concierge tadında hizmet yönetimi'
        ]
    },
    {
        slug: 'arsa-arazi-crm',
        title: 'Arsa ve Arazi CRM',
        metaTitle: 'Arsa Ofisleri İçin En İyi CRM Yazılımı 2026',
        metaDescription: 'Parsel takibi, imar durumu güncellemeleri ve kooperatif yönetimi için Türkiye\'nin en iyi arsa ve arazi CRM programı.',
        heroHeadline: 'Arsa Ofislerinin Dijital Dönüşümü',
        heroSubheadline: 'Parsel satışları, tarla ve arsa yatırımları için coğrafi bilgi sistemi entegreli müşteri yönetim platformu.',
        features: [
            { title: 'Parsel ve Ada Yönetimi', description: 'Toplu arsa projelerinizdeki satılmış ve boş parselleri renk kodlarıyla harita üzerinde görün.', icon: 'Map' },
            { title: 'İmar Durumu Takibi', description: 'Arsaların emsal, gabari ve güncel imar değişikliklerini müşteri kayıtlarına işleyin.', icon: 'FileCheck' },
            { title: 'Toplu Satış & Kooperatif', description: 'Çok hisseli tapu işlemleri ve kooperatif üye yönetimini tek bir sistemden yapın.', icon: 'Users' }
        ],
        benefits: [
            'Yatırımcılara toplu SMS ve WhatsApp bilgilendirmesi',
            'Hızlı parsel rezervasyon ve opsiyon sistemi',
            'Gelecek değerleme öngörüleri'
        ]
    },
    {
        slug: 'insaat-proje-crm',
        title: 'İnşaat Proje Satış CRM',
        metaTitle: 'İnşaat Firmaları İçin Proje Satış CRM Yazılımı',
        metaDescription: 'Müteahhitler ve inşaat geliştiricileri için stok, ödeme planı ve broker yönetimini otomatikleştiren yapay zeka destekli proje satış CRM.',
        heroHeadline: 'İnşaat Projeleri İçin Uçtan Uca Satış Platformu',
        heroSubheadline: 'Topraktan satıştan anahtar teslime kadar tüm süreci, stok durumunu ve ödeme planlarını dijitalleştirin.',
        features: [
            { title: 'İnteraktif Stok Lejantı', description: 'Projelerinizin blok ve daire planlarını sisteme yükleyin, satış oldukça renkler otomatik değişsin.', icon: 'Building' },
            { title: 'Dinamik Ödeme Planı Motoru', description: 'Müşteriye özel peşinat, ara ödeme ve balon ödeme seçenekleriyle otomatik taksitlendirme.', icon: 'Calculator' },
            { title: 'Acente & Broker Portalı', description: 'Alt acentelerinizin sisteme girip güncel stoğu görmesini ve hakedişlerini takip etmesini sağlayın.', icon: 'Network' }
        ],
        benefits: [
            'Çifte satış (mükerrer) riskinin %100 ortadan kalkması',
            'Finans ve tahsilat süreçlerinin otomatikleşmesi',
            'Şantiye ve merkez ofis arasında kesintisiz iletişim'
        ]
    },
    {
        slug: 'turizm-otel-crm',
        title: 'Turizm & Otel Gayrimenkul CRM',
        metaTitle: 'Turizm ve Otel Yatırımları İçin Gayrimenkul CRM | NovoxCRM',
        metaDescription: 'Apart otel, devre mülk ve turizm gayrimenkul satışlarında müşteri takibi, yatırımcı portföy yönetimi ve getiri analizi için CRM yazılımı.',
        heroHeadline: 'Turizm Gayrimenkulünde Satış Yönetimi',
        heroSubheadline: 'Apart otel, devre mülk ve tatil köyü projelerinde yatırımcı ilişkilerini profesyonelce yönetin.',
        features: [
            { title: 'Yatırımcı Getiri Simülasyonu', description: 'Kira getirisi, doluluk oranı ve ROI projeksiyonu ile yatırımcılara somut veriler sunun.', icon: 'TrendingUp' },
            { title: 'Devre Mülk Takvimi', description: 'Haftalık kullanım hakları, rotasyon ve bakım dönemlerini sistem üzerinden yönetin.', icon: 'Calendar' },
            { title: 'Uluslararası Yatırımcı Takibi', description: 'Çok dilli iletişim, döviz bazlı fiyatlama ve uluslararası ödeme takibi.', icon: 'Globe' }
        ],
        benefits: [
            'Yatırımcılara otomatik getiri raporları',
            'Çoklu proje ve lokasyon yönetimi',
            'Turizm sezonu bazlı satış analizi'
        ]
    },
    {
        slug: 'kentsel-donusum-crm',
        title: 'Kentsel Dönüşüm CRM',
        metaTitle: 'Kentsel Dönüşüm Projeleri İçin CRM Yazılımı | NovoxCRM',
        metaDescription: 'Kentsel dönüşüm projelerinde hak sahipleri takibi, kat karşılığı anlaşma yönetimi ve yeni ünitelerle eşleştirme için CRM platformu.',
        heroHeadline: 'Kentsel Dönüşüm Projelerinde Dijital Kontrol',
        heroSubheadline: 'Hak sahipleri, yıkım-yapım süreçleri ve yeni ünitelerle eşleştirmeyi tek platformdan yönetin.',
        features: [
            { title: 'Hak Sahibi Yönetimi', description: 'Her hak sahibinin mevcut m², anlaşma durumu ve yeni ünite eşleştirmesini takip edin.', icon: 'Users' },
            { title: 'Anlaşma Süreç Takibi', description: 'Kat karşılığı inşaat anlaşmaları, noter onayları ve tapu devir süreçlerini izleyin.', icon: 'FileCheck' },
            { title: 'Yeni Proje Stok Yönetimi', description: 'Dönüşüm sonrası üretilen yeni ünitelerin satış ve dağıtım sürecini yönetin.', icon: 'Building' }
        ],
        benefits: [
            'Hak sahipleri ile şeffaf iletişim',
            'Hukuki süreç takibi ve belge yönetimi',
            'Dönüşüm projelerinde çakışma önleme'
        ]
    },
    {
        slug: 'gyo-portfoy-crm',
        title: 'GYO & Portföy Yönetim CRM',
        metaTitle: 'GYO ve Gayrimenkul Portföy Yönetimi CRM | NovoxCRM',
        metaDescription: 'Gayrimenkul yatırım ortaklıkları ve portföy yönetim şirketleri için çoklu proje, yatırımcı ilişkileri ve finansal raporlama CRM platformu.',
        heroHeadline: 'Gayrimenkul Portföyünüzü Tek Panelden Yönetin',
        heroSubheadline: 'Çoklu proje yönetimi, yatırımcı raporlama ve portföy performans analizi.',
        features: [
            { title: 'Çoklu Proje Dashboard', description: 'Tüm projelerinizin satış durumu, tahsilat ve stok bilgisini tek ekrandan görün.', icon: 'LayoutDashboard' },
            { title: 'Yatırımcı İlişkileri', description: 'Ortakların ve yatırımcıların portföy değeri, getiri ve kar payı bilgilerini yönetin.', icon: 'Briefcase' },
            { title: 'Konsolide Raporlama', description: 'Proje bazlı, bölge bazlı ve segment bazlı konsolide finansal raporlar üretin.', icon: 'BarChart3' }
        ],
        benefits: [
            'Yönetim kurulu sunumları için hazır raporlar',
            'Proje performans karşılaştırma',
            'Yatırımcı getiri takibi ve dağıtım yönetimi'
        ]
    },
    {
        slug: 'yabanci-yatirimci-crm',
        title: 'Yabancı Yatırımcı CRM',
        metaTitle: 'Yabancı Yatırımcılara Gayrimenkul Satışı İçin CRM | NovoxCRM',
        metaDescription: 'Yabancı uyruklu müşterilere gayrimenkul satışında çok dilli CRM, vatandaşlık takibi, döviz yönetimi ve uluslararası pazarlama otomasyonu.',
        heroHeadline: 'Uluslararası Gayrimenkul Satışında CRM',
        heroSubheadline: 'Yabancı yatırımcılarla çok dilli iletişim, vatandaşlık süreç takibi ve döviz bazlı ödeme yönetimi.',
        features: [
            { title: 'Çok Dilli İletişim', description: 'İngilizce, Arapça, Rusça ve Farsça dahil otomatik çeviri destekli müşteri iletişimi.', icon: 'Globe' },
            { title: 'Vatandaşlık Süreç Takibi', description: 'Yatırım yoluyla vatandaşlık başvuru sürecini adım adım izleyin ve müşteriye raporlayın.', icon: 'Shield' },
            { title: 'Döviz & Kur Yönetimi', description: 'USD, EUR, AED bazlı fiyatlama, kur farkı hesaplama ve havale takibi.', icon: 'DollarSign' }
        ],
        benefits: [
            'Uluslararası pazarlama entegrasyonları',
            'Tapu ve ikamet izni süreç takibi',
            'Çok para birimli ödeme planı yönetimi'
        ]
    },
    {
        slug: 'toplu-konut-toki-crm',
        title: 'Toplu Konut & TOKİ CRM',
        metaTitle: 'Toplu Konut ve TOKİ Projeleri İçin CRM Yazılımı | NovoxCRM',
        metaDescription: 'Yüksek hacimli toplu konut ve TOKİ projelerinde binlerce ünitenin satış, ödeme ve tahsilat takibi için CRM platformu.',
        heroHeadline: 'Toplu Konut Projelerinde Ölçeklenebilir Satış Yönetimi',
        heroSubheadline: '1.000+ üniteli projelerde satış, ödeme planı ve hak sahibi yönetimini profesyonelce yürütün.',
        features: [
            { title: 'Yüksek Hacim Stok Yönetimi', description: 'Binlerce üniteyi blok, kat ve tip bazında hiyerarşik yapıda yönetin.', icon: 'Building2' },
            { title: 'Toplu Ödeme Planı', description: 'Standart ödeme planlarını toplu atama ile yüzlerce müşteriye anında uygulayın.', icon: 'Calculator' },
            { title: 'Kura ve Çekiliş Modülü', description: 'Hak sahipleri için dijital kura ve çekiliş süreçlerini şeffaf şekilde yönetin.', icon: 'Shuffle' }
        ],
        benefits: [
            'Toplu SMS ve bilgilendirme kampanyaları',
            'Devlet destekli proje raporlama',
            'Yüksek hacimli tahsilat takibi'
        ]
    },
    {
        slug: 'avm-perakende-crm',
        title: 'AVM & Perakende Gayrimenkul CRM',
        metaTitle: 'AVM ve Perakende Gayrimenkul Kiralama CRM | NovoxCRM',
        metaDescription: 'Alışveriş merkezleri ve perakende gayrimenkul kiralama süreçlerinde kiracı takibi, sözleşme yönetimi ve doluluk analizi için CRM platformu.',
        heroHeadline: 'AVM Kiralama Süreçlerini Dijitalleştirin',
        heroSubheadline: 'Kiracı yönetimi, sözleşme takibi, doluluk oranı ve gelir optimizasyonu tek platformda.',
        features: [
            { title: 'Kiracı Portföy Yönetimi', description: 'Her kiracının sözleşme süresi, kira bedeli, ortak gider payı ve performansını takip edin.', icon: 'Store' },
            { title: 'Doluluk & Gelir Analizi', description: 'AVM doluluk oranı, metrekare bazlı kira getirisi ve boşluk maliyetini raporlayın.', icon: 'PieChart' },
            { title: 'Sözleşme Yenileme Takibi', description: 'Süresi dolan sözleşmeleri otomatik hatırlatma ile yenileme sürecine alın.', icon: 'RefreshCw' }
        ],
        benefits: [
            'Kiracı memnuniyet takibi',
            'Kira artış ve endeksleme otomasyonu',
            'Boş alan pazarlama ve eşleştirme'
        ]
    }
];
