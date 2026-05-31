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
    },
    {
        slug: 'prefabrik-konut-crm',
        title: 'Prefabrik Konut CRM',
        metaTitle: 'Prefabrik Konut Satış CRM Programı | NovoxCRM',
        metaDescription: 'Prefabrik ev, çelik konut üreticileri ve satıcıları için özel geliştirilmiş satış, sipariş ve stok takip CRM yazılımı.',
        heroHeadline: 'Prefabrik Konut Üretim ve Satış Süreçleri Kontrol Altında',
        heroSubheadline: 'Müşteri taleplerinden şantiye montaj aşamasına kadar tüm prefabrik konut sipariş ve satış adımlarını tek ekrandan yönetin.',
        features: [
            { title: 'Sipariş & Konfigürasyon', description: 'Prefabrik ev modelleri için ek modül, yalıtım ve çatı tipi tercihlerini sipariş kartına işleyin.', icon: 'FileText' },
            { title: 'Üretim & Montaj Takibi', description: 'Üretim bandından sevkiyata ve sahada montaj aşamasına kadar sipariş durumunu anlık takip edin.', icon: 'Building' },
            { title: 'Maliyet & Hakediş', description: 'Malzeme giderlerini, taşeron montaj ekiplerinin hakedişlerini otomatik hesaplayın.', icon: 'Calculator' }
        ],
        benefits: [
            'Konfigüre edilebilir sipariş formları',
            'Şantiye ve fabrika arası anlık durum takibi',
            'Hassas malzeme maliyet analizi'
        ]
    },
    {
        slug: 'tiny-house-crm',
        title: 'Tiny House Emlak CRM',
        metaTitle: 'Tiny House Satış ve Kiralama CRM Programı | NovoxCRM',
        metaDescription: 'Mobil ev, karavan ve tiny house üreticileri/acenteleri için müşteri takibi, sipariş özelleştirme ve lojistik yönetim yazılımı.',
        heroHeadline: 'Tiny House Satış ve Sipariş Otomasyonu',
        heroSubheadline: 'Minimalist yaşam çözümleri üreten veya pazarlayan firmalar için özel tasarlanmış müşteri ilişkileri ve sipariş yönetim platformu.',
        features: [
            { title: 'Mobil Ev Özelleştirici', description: 'Müşterilerin şasi tipi, dış kaplama ve iç donanım tercihlerini sisteme kaydedin ve anlık teklif üretin.', icon: 'FileCheck' },
            { title: 'Lojistik & Teslimat Takibi', description: 'Çekme karavan ve tiny house ünitelerinin teslimat rotalarını ve nakliye aşamalarını yönetin.', icon: 'Map' },
            { title: 'Kiralama & Rezervasyon', description: 'Tiny house tatil köyleri için rezervasyon takvimi ve doluluk yönetimi modülü.', icon: 'Calendar' }
        ],
        benefits: [
            'Sipariş özelleştirmelerine göre dinamik fiyatlandırma',
            'Teslimat ve plaka/ruhsat süreç takibi',
            'Turizm amaçlı kiralama entegrasyonu'
        ]
    },
    {
        slug: 'villa-satis-crm',
        title: 'Lüks Villa & Müstakil Ev Satış CRM',
        metaTitle: 'Lüks Villa ve Müstakil Ev Satış CRM Yazılımı | NovoxCRM',
        metaDescription: 'Villa projeleri, malikaneler ve müstakil gayrimenkul satışları için özel portföy sunumları, VIP müşteri takibi ve tapu süreç yönetimi.',
        heroHeadline: 'Villa Satışlarında Prestijli Müşteri Yönetimi',
        heroSubheadline: 'Müstakil yaşam projelerinizde A+ alıcı gruplarına yönelik özel sunum şablonları ve VIP müşteri takip otomasyonu.',
        features: [
            { title: 'Özel Villa Portföyü', description: 'Bahçe büyüklüğü, havuz tipi, oda/banyo sayısı ve şerefiye bilgilerini içeren zengin villa profilleri.', icon: 'Building2' },
            { title: 'VIP Görüşme Notları', description: 'Yüksek bütçeli alıcıların tüm özel taleplerini ve görüşme geçmişini şifreli ve güvenli şekilde saklayın.', icon: 'Lock' },
            { title: 'Harita Bazlı Konumlandırma', description: 'Villaların çevre yerleşim yerlerine uzaklığını, manzara açılarını harita üzerinden müşteriye sunun.', icon: 'Map' }
        ],
        benefits: [
            'A+ segment alıcılar için kişiselleştirilmiş yaklaşım',
            'Gelişmiş veri gizliliği ve rol bazlı erişim',
            'Detaylı mülk özellikleri eşleştirme motoru'
        ]
    },
    {
        slug: 'ogrenci-yurdu-crm',
        title: 'Öğrenci Yurdu & Paylaşımlı Konut CRM',
        metaTitle: 'Öğrenci Yurdu ve Paylaşımlı Konut Yönetim CRM',
        metaDescription: 'Özel öğrenci yurtları ve paylaşımlı konut projeleri için oda/yatak envanter takibi, kayıt yönetimi ve otomatik ödeme takip yazılımı.',
        heroHeadline: 'Yurt ve Paylaşımlı Konut Yönetiminde Yeni Nesil Çözüm',
        heroSubheadline: 'Binlerce oda ve yatak kapasitesini yönetin. Öğrenci kayıtları, veli sözleşmeleri ve aylık taksit ödemelerini otomatikleştirin.',
        features: [
            { title: 'Oda & Yatak Envanteri', description: 'Odaların doluluk durumunu, yatak kapasitesini ve oda tiplerini (1, 2, 4 kişilik) anlık izleyin.', icon: 'Building' },
            { title: 'Veli & Öğrenci Kaydı', description: 'Öğrenci ve veli kimlik bilgilerini, okul kayıtlarını ve sözleşmeleri tek dosyada saklayın.', icon: 'Users' },
            { title: 'Taksit & Depozito Takibi', description: 'Aylık yurt taksitlerini, depozito iadelerini ve gecikmiş ödemeleri otomatik SMS/WhatsApp ile hatırlatın.', icon: 'Calculator' }
        ],
        benefits: [
            'Oda bazında gerçek zamanlı doluluk analizi',
            'Otomatik senet ve sözleşme şablonları',
            'Veli ödeme hatırlatma otomasyonları'
        ]
    },
    {
        slug: 'sanayi-sitesi-crm',
        title: 'Sanayi Sitesi ve Kooperatif CRM',
        metaTitle: 'Sanayi Siteleri ve Sanayi Kooperatifleri CRM | NovoxCRM',
        metaDescription: 'Organize sanayi bölgeleri, sanayi siteleri ve küçük sanayi kooperatifleri için üye takibi, arsa aidat ve ödeme yönetim yazılımı.',
        heroHeadline: 'Sanayi Projelerinde Dijital Kooperatif Yönetimi',
        heroSubheadline: 'Sanayi dükkanlarının inşası, üye ödemeleri, kura çekilişleri ve altyapı tahsis süreçlerini tek platformdan takip edin.',
        features: [
            { title: 'Dükkan & Atölye Stok Kartı', description: 'Sanayi sitelerindeki dükkanların metrekare, elektrik gücü, yükseklik ve giriş kapısı özelliklerini kaydedin.', icon: 'Building2' },
            { title: 'Üye Aidat & Ödeme Takibi', description: 'Kooperatif üyelerinin aylık aidatlarını, inşaat payı ödemelerini ve borç bakiyelerini izleyin.', icon: 'Calculator' },
            { title: 'Resmi Kura & Tahsis Modülü', description: 'Dükkanların üyelere kura yoluyla tahsis edilmesi ve noter onay süreçlerinin takibi.', icon: 'Shuffle' }
        ],
        benefits: [
            'Kooperatif üyeleri ile şeffaf finansal durum paylaşımı',
            'Sanayi tesislerine özel teknik kriter filtreleri',
            'Toplu resmi bildirim ve WhatsApp duyuruları'
        ]
    },
    {
        slug: 'gayrimenkul-finansman-crm',
        title: 'Gayrimenkul Finansman & Senet Yönetim CRM',
        metaTitle: 'Gayrimenkul Finansman ve Senet Takip Programı | NovoxCRM',
        metaDescription: 'Firmadan senetli veya banka kredili konut satışlarında ödeme planları, vade takipleri, ciro ve tahsilat süreçlerini yöneten finansal CRM yazılımı.',
        heroHeadline: 'Gayrimenkul Vadeli Satışlarında Kusursuz Finansal Takip',
        heroSubheadline: 'Müşterilerinize sunduğunuz şirket içi vadeli ödeme planlarını, senet basımlarını ve tahsilat akışlarını hata payı olmadan yönetin.',
        features: [
            { title: 'Senet & Çek Basım Motoru', description: 'Satış sözleşmesine uygun olarak vadeli senetleri otomatik hazırlayın ve pdf olarak yazdırın.', icon: 'FileText' },
            { title: 'Gecikme & İhtar Otomasyonu', description: 'Vadesi geçen ödemeler için otomatik faiz hesaplayın, SMS/WhatsApp ile ihtar bildirimleri gönderin.', icon: 'Calculator' },
            { title: 'Nakit Akış Projeksiyonu', description: 'Gelecek aylarda tahsil edilecek taksit tutarlarını ve ciro tahminlerini anlık dashboardlarda raporlayın.', icon: 'LineChart' }
        ],
        benefits: [
            'Manuel senet takip hatalarının tamamen sonlanması',
            'Tahsilat performansında %35 artış',
            'Gelecek dönem finansal planlama kolaylığı'
        ]
    },
    {
        slug: 'ofis-kiralama-crm',
        title: 'Plaza ve Paylaşımlı Ofis CRM',
        metaTitle: 'Plaza ve Paylaşımlı Ofis Kiralama CRM Programı | NovoxCRM',
        metaDescription: 'Hazır ofis, coworking alanları ve plaza kiralama süreçlerinde kiracı takibi, sözleşme yenileme ve toplantı odası rezervasyon CRM yazılımı.',
        heroHeadline: 'Paylaşımlı Ofis ve Coworking Operasyonlarında Dijital Hız',
        heroSubheadline: 'Ofis doluluk oranlarını optimize edin. Kiracı sözleşmelerini, aylık faturaları ve üyelik paketlerini tek noktadan yönetin.',
        features: [
            { title: 'Ofis & Masa Enventari', description: 'Sabit masa, gezgin masa ve özel ofislerin anlık doluluk/rezervasyon durumlarını takip edin.', icon: 'LayoutDashboard' },
            { title: 'Aylık Üyelik Faturaları', description: 'Ofis kiracılarına her ay otomatik olarak kira, elektrik, internet ve ek hizmet faturaları yansıtın.', icon: 'Calculator' },
            { title: 'Sözleşme Yenileme Motoru', description: '30 gün kala sözleşmesi bitecek kiracıları listeleyin ve otomatik teklifler gönderin.', icon: 'RefreshCw' }
        ],
        benefits: [
            'Plaza doluluk ve gelir optimizasyonu',
            'Kiracılara otomatik dijital faturalandırma',
            'Esnek üyelik paketleri yönetimi'
        ]
    },
    {
        slug: 'devremulk-crm',
        title: 'Devre Mülk & Termal Tesis CRM',
        metaTitle: 'Devre Mülk ve Termal Tesis Satış CRM Programı | NovoxCRM',
        metaDescription: 'Devre mülk satış ofisleri için dönemlik takvim yönetimi, hisse takipleri ve üye ilişkileri yönetim yazılımı.',
        heroHeadline: 'Devre Mülk Satış ve Dönem Yönetim Sistemi',
        heroSubheadline: 'Termal tesis ve devre tatil projelerinizde haftalık/aylık zaman dilimlerini, üye hisselerini ve aidat ödemelerini koordine edin.',
        features: [
            { title: 'Dönemlik Hisse Takvimi', description: 'Yılın 52 haftasını renk kodlu takvim üzerinde ünitelerle eşleştirin ve hisse satış durumunu izleyin.', icon: 'Calendar' },
            { title: 'Yıllık Bakım Aidatı', description: 'Devre mülk sahiplerine yıllık tesis bakım, temizlik ve işletim aidatlarını yansıtın ve tahsil edin.', icon: 'Calculator' },
            { title: 'Müşteri Dönem Değişimi', description: 'Üyeler arası dönem takas (exchange) taleplerini ve onay süreçlerini sistemden yönetin.', icon: 'Shuffle' }
        ],
        benefits: [
            'Hatalı veya mükerrer dönem satışı riskinin sıfırlanması',
            'Yıllık aidat tahsilatlarının kolaylaşması',
            'Üye memnuniyetini artıran takas yönetim sistemi'
        ]
    },
    {
        slug: 'depolama-crm',
        title: 'Lojistik Depo & Antrepo CRM',
        metaTitle: 'Lojistik Depo ve Antrepo Kiralama CRM Yazılımı | NovoxCRM',
        metaDescription: 'Depolama tesisleri, antrepolar ve soğuk hava depoları için metrekare/hacim bazlı kiralama ve müşteri ilişkileri takip programı.',
        heroHeadline: 'Depo ve Antrepo Kiralamalarında Uçtan Uca Takip',
        heroSubheadline: 'Depolama alanlarının metrekare veya metreküp hacim bazlı doluluk oranlarını izleyin, kurumsal kiracı sözleşmelerini yönetin.',
        features: [
            { title: 'Hacim Bazlı Alan Yönetimi', description: 'Depo alanlarını koridor, raf veya serbest metrekare bazında bölerek doluluk durumlarını görselleştirin.', icon: 'Building' },
            { title: 'Enflasyon Endeksli Sözleşme', description: 'TÜFE veya döviz bazlı otomatik kira artış oranlarını kurumsal sözleşmelere uygulayın.', icon: 'FileCheck' },
            { title: 'Teknik Detay Kartları', description: 'Deponun yükseklik, zemin taşıma kapasitesi, kapı genişliği ve yangın söndürme altyapı özelliklerini kaydedin.', icon: 'FileText' }
        ],
        benefits: [
            'Büyük ölçekli kurumsal depo kiralama yönetimi',
            'Kira artış ve endeksleme işlemlerinin otomatikleşmesi',
            'Depolama kapasite kullanım optimizasyonu'
        ]
    },
    {
        slug: 'yurt-disi-mulk-crm',
        title: 'Yurt Dışı Gayrimenkul Yatırım CRM',
        metaTitle: 'Yurt Dışı Gayrimenkul Satışı İçin CRM Programı | NovoxCRM',
        metaDescription: 'İngiltere, Dubai, Karadağ, Yunanistan gibi ülkelerde gayrimenkul satan acenteler için çok dövizli, yabancı mevzuat uyumlu CRM yazılımı.',
        heroHeadline: 'Uluslararası Gayrimenkul Portföyü ve Satış Yönetimi',
        heroSubheadline: 'Yurt dışı projelerinizi yerli ve yabancı alıcılara sunun. Döviz bazlı ödemeleri ve vatandaşlık/altın vize süreçlerini takip edin.',
        features: [
            { title: 'Çok Dövizli Fiyat Listesi', description: 'Aynı projeyi GBP, USD, EUR ve AED cinsinden fiyatlandırın, anlık kurlarla güncelleyin.', icon: 'DollarSign' },
            { title: 'Golden Visa Süreç Takibi', description: 'Yatırımcıların oturum izni, tapu transferi ve resmi evrak onay aşamalarını adım adım izleyin.', icon: 'Shield' },
            { title: 'Global Broker Ortaklığı', description: 'Yurt dışındaki yerel acentelerle ortak satış ağları kurun ve komisyon paylaşımını yönetin.', icon: 'Network' }
        ],
        benefits: [
            'Uluslararası standartlarda dövizli hakediş yönetimi',
            'Yatırımcı vize süreçlerinin şeffaf takibi',
            'Global portföy dağıtım otomasyonu'
        ]
    },
    {
        slug: 'tarla-bag-bahce-crm',
        title: 'Tarla, Bağ ve Bahçe Emlak CRM',
        metaTitle: 'Tarla ve Arazi Satış Ofisleri İçin CRM Programı | NovoxCRM',
        metaDescription: 'Tarla, bağ, bahçe ve zeytinlik gibi tarım arazilerinin satışı, hisse takipleri ve imar durumu güncellemeleri için gayrimenkul CRM yazılımı.',
        heroHeadline: 'Tarım Arazileri ve Tarla Satışlarında Dijital Kontrol',
        heroSubheadline: 'Hisseli tapu süreçleri, tarımsal nitelikli araziler ve kooperatif zeytinlik projelerindeki üye kayıtlarını tek sistemle takip edin.',
        features: [
            { title: 'Hisseli Tapu & Pay Takibi', description: 'Arazilerdeki çok ortaklı hisse oranlarını ve mal sahiplerinin iletişim bilgilerini kaydedin.', icon: 'Users' },
            { title: 'Toprak Nitelik Kartları', description: 'Arazinin imar durumu, sulama imkanı, yol cephesi ve toprak analizi verilerini sisteme işleyin.', icon: 'Map' },
            { title: 'Parselasyon & Satış Durumu', description: 'Büyük arazilerin bölünerek yapılan parsel satış süreçlerini harita üzerinde izleyin.', icon: 'Building2' }
        ],
        benefits: [
            'Hissedar çakışmalarının engellenmesi',
            'Arazinin coğrafi ve tarımsal özelliklerine göre filtrelenmesi',
            'Yatırımcılara toplu arsa/tarla WhatsApp katalog gönderimi'
        ]
    },
    {
        slug: 'kooperatif-konut-crm',
        title: 'Konut Yapı Kooperatifi CRM',
        metaTitle: 'Konut Yapı Kooperatifleri İçin CRM Yazılımı | NovoxCRM',
        metaDescription: 'Konut yapı kooperatiflerinde üye kayıtları, hisse takipleri, aylık ödemeler ve inşaat ilerleme raporları için özel CRM programı.',
        heroHeadline: 'Konut Kooperatiflerinde Güvenli ve Şeffaf Yönetim',
        heroSubheadline: 'Üyelerinizin ödemelerini, inşaat hakedişlerini ve daire tahsis kurallarını tek bir dijital veri tabanında toplayın.',
        features: [
            { title: 'Kooperatif Üye Defteri', description: 'Resmi kooperatif üyelik kayıtlarını, hisse devirlerini ve noter evraklarını dijitalde saklayın.', icon: 'FileText' },
            { title: 'Şerefiye Puanlama Motoru', description: 'İnşaat bitiminde dairelerin cephe, kat ve büyüklüklerine göre şerefiye farklarını hesaplayın.', icon: 'Calculator' },
            { title: 'Aylık Aidat ve Ödeme Planı', description: 'Üyelerin aidat ödemelerini, gecikme faizlerini ve ara ödeme makbuzlarını otomatikleştirin.', icon: 'DollarSign' }
        ],
        benefits: [
            'Üyeler arasında tam şeffaflık ve güven ortamı',
            'Hassas şerefiye hesaplama modülü',
            'Hisse devir ve üyelik iptal süreçlerinin kolaylaşması'
        ]
    },
    {
        slug: 'prefabrik-villa-crm',
        title: 'Prefabrik ve Çelik Villa CRM',
        metaTitle: 'Prefabrik ve Çelik Villa Üreticileri İçin CRM | NovoxCRM',
        metaDescription: 'Çelik konstrüksiyon ve prefabrik villa üreticileri için sipariş konfigürasyonu, teklif hazırlama, proje ve fabrika takip yazılımı.',
        heroHeadline: 'Çelik Villa Satış ve Fabrika Sipariş Otomasyonu',
        heroSubheadline: 'Müşterilerinizin özel villa siparişlerini konfigüre edin, fabrika üretim süreçlerini ve şantiye zemin beton montaj adımlarını takip edin.',
        features: [
            { title: 'Çelik Villa Tasarım Formu', description: 'Oda sayısı, veranda tipi, çelik kalınlığı ve iç dekorasyon opsiyonlarını siparişe ekleyin.', icon: 'FileCheck' },
            { title: 'Şantiye & Fabrika İletişimi', description: 'Fabrikadaki çelik karkas üretimi ile sahadaki temel beton döküm durumunu eşleştirin.', icon: 'Building' },
            { title: 'Hızlı Fiyat Teklifi (PDF)', description: 'Seçilen opsiyonlara göre anında maliyet hesabı yapıp müşteriye PDF teklif iletin.', icon: 'FileText' }
        ],
        benefits: [
            'Sipariş detaylarına göre dinamik üretim reçeteleri',
            'Proje teslim sürelerinde %30 hızlanma',
            'Hata payı sıfır olan tekliflendirme süreçleri'
        ]
    },
    {
        slug: 'franchise-broker-crm',
        title: 'Franchise Emlak Ofisi Broker CRM',
        metaTitle: 'Franchise Emlak Ofisleri İçin Broker CRM | NovoxCRM',
        metaDescription: 'Global veya yerli franchise emlak ofisi brokerları için danışman performans takibi, portföy paylaşımı ve ciro paylaşım yazılımı.',
        heroHeadline: 'Emlak Ofisi Brokerları İçin Lider CRM Altyapısı',
        heroSubheadline: 'Emlak danışmanlarınızın aktivitelerini izleyin, ciro paylaşım modellerini ve ofis içi portföy havuzunu profesyonelce yönetin.',
        features: [
            { title: 'Danışman KPI Dashboard', description: 'Hangi danışmanın kaç ilan girdiğini, kaç müşteri aradığını ve ne kadar ciro ürettiğini izleyin.', icon: 'LayoutDashboard' },
            { title: 'Ofis Ciro Bölüşüm Motoru', description: 'Broker ve danışman arasındaki yüzde oranlarına göre komisyon paylaşımlarını otomatik hesaplayın.', icon: 'Calculator' },
            { title: 'Ortak Portföy Havuzu', description: 'Ofis içindeki tüm tekil yetki belgeli portföyleri güvenle paylaşın ve eşleştirin.', icon: 'Briefcase' }
        ],
        benefits: [
            'Danışman performansında şeffaf KPI ölçümü',
            'Hatasız ve hızlı komisyon bordrolama',
            'Ofis içi ortak portföy satış hızının artması'
        ]
    },
    {
        slug: 'kentsel-donusum-mutaahhitlik-crm',
        title: 'Kentsel Dönüşüm Müteahhitlik CRM',
        metaTitle: 'Kentsel Dönüşüm Yapan Müteahhitler İçin CRM | NovoxCRM',
        metaDescription: 'Kentsel dönüşüm müteahhitleri için kat karşılığı oran hesapları, hak sahipleri sözleşmeleri ve kira yardımı takip yazılımı.',
        heroHeadline: 'Kentsel Dönüşüm Müteahhitlik Süreçlerinde Dijital Yönetim',
        heroSubheadline: 'Hak sahipleri ile yapılan görüşmeleri, kat karşılığı anlaşma oranlarını ve tahliye/kira yardımı süreçlerini tek yerden takip edin.',
        features: [
            { title: 'Hak Sahibi Kat Karşılığı Oranı', description: 'Mevcut m² haklarına göre yeni projeden verilecek daire ve şerefiye oranlarını hesaplayın.', icon: 'Calculator' },
            { title: 'Tahliye & Kira Yardım Takibi', description: 'Kentsel dönüşüm kira desteği alan hak sahiplerinin aylık ödemelerini ve tahliye tarihlerini yönetin.', icon: 'FileText' },
            { title: 'İnşaat Paylaşım Lejantı', description: 'Müteahhit payı ve hak sahibi payı olarak ayrılan stok durumunu kat planında görün.', icon: 'Building' }
        ],
        benefits: [
            'Hak sahipleri ile hukuki uyuşmazlık riskinin azaltılması',
            'Yasal başvuru evraklarının dijital arşivlenmesi',
            'Müteahhit satılık daire stoğunun net takibi'
        ]
    },
    {
        slug: 'residence-yonetimi-crm',
        title: 'Rezidans ve Toplu Konut İşletim CRM',
        metaTitle: 'Rezidans Yönetim ve Gayrimenkul İşletim CRM | NovoxCRM',
        metaDescription: 'Rezidans projeleri ve toplu konut sitelerinde mülk yönetimi, kiracı ilişkileri, aidat tahsilatları ve teknik servis entegrasyonlu CRM yazılımı.',
        heroHeadline: 'Lüks Rezidans ve Toplu Konut İşletmesinde Dijital Hız',
        heroSubheadline: 'Mülk sahipleri ve kiracılarla iletişimi güçlendirin. Aidat, ortak gider ve rezidans concierge hizmetlerini koordine edin.',
        features: [
            { title: 'Mülk Sahibi & Kiracı Portalı', description: 'Kullanıcıların aidat borçlarını görmesi, kredi kartıyla ödeme yapması ve evrak yüklemesi için portal.', icon: 'Users' },
            { title: 'Teknik Servis & Talep Yönetimi', description: 'Sakinlerin arıza, temizlik veya concierge taleplerini sistemden alıp ilgili ekiplere atayın.', icon: 'RefreshCw' },
            { title: 'Ortak Alan Rezervasyon', description: 'Havuz, spor salonu ve toplantı odalarının kullanım saatlerini rezervasyon sistemi ile yönetin.', icon: 'Calendar' }
        ],
        benefits: [
            'Site sakinlerinin memnuniyetinde ciddi artış',
            'Kredi kartıyla anında aidat tahsilatı',
            'Teknik servis müdahale sürelerinin kısalması'
        ]
    },
    {
        slug: 'gayrimenkul-yatirim-fonu-crm',
        title: 'GYF Gayrimenkul Yatırım Fonu CRM',
        metaTitle: 'Gayrimenkul Yatırım Fonları İçin CRM Yazılımı | NovoxCRM',
        metaDescription: 'Gayrimenkul yatırım fonları (GYF) için fon katılımcıları portföy yönetimi, değerleme raporları ve kar payı dağıtım takip yazılımı.',
        heroHeadline: 'Gayrimenkul Yatırım Fonu Katılımcı ve Varlık Yönetimi',
        heroSubheadline: 'Fon portföyündeki gayrimenkullerin değerlemelerini, katılımcıların hisse paylarını ve temettü dağıtımlarını izleyin.',
        features: [
            { title: 'Katılımcı Hisse Defteri', description: 'Fona katılan yatırımcıların hisse adetlerini, giriş tarihlerini ve kimlik kayıtlarını yönetin.', icon: 'Briefcase' },
            { title: 'Gayrimenkul Varlık Değerleme', description: 'Fona ait mülklerin yıllık SPK lisanslı değerleme raporlarını ve amortisman takibini yapın.', icon: 'LineChart' },
            { title: 'Kar Payı Dağıtım Hesaplayıcı', description: 'Elde edilen kira veya satış karlarının hisse oranlarına göre katılımcılara dağıtım hesabı.', icon: 'Calculator' }
        ],
        benefits: [
            'SPK mevzuatına uygun raporlama altyapısı',
            'Yatırımcılara düzenli getiri bilgilendirme e-postaları',
            'Fon varlık değer artış analizleri'
        ]
    },
    {
        slug: 'arsa-ofisi-crm',
        title: 'Arsa Geliştirme ve Parselasyon CRM',
        metaTitle: 'Arsa Ofisleri ve Arazi Geliştirme CRM Yazılımı | NovoxCRM',
        metaDescription: 'Büyük arsa projelerinde parselasyon takipleri, imar planı değişiklikleri ve toplu parsel satış süreçleri için arazi geliştirme CRM yazılımı.',
        heroHeadline: 'Arsa Projelerinde Profesyonel Parselasyon ve Satış',
        heroSubheadline: 'Ham araziden imarlı parsele kadar tüm süreci izleyin. Satış ofisinizdeki parsel envanterini anlık güncelleyin.',
        features: [
            { title: 'Görsel Parselasyon Lejantı', description: 'Arazinin harita planını yükleyin. Satılan, rezerve olan ve boş parselleri renk kodlu lejantta görün.', icon: 'Map' },
            { title: 'İmar & Emsal Kayıtları', description: 'Her parselin emsal oranı, gabari değeri ve güncel imar durum detaylarını takip edin.', icon: 'FileCheck' },
            { title: 'Toplu Parsel Opsiyonlama', description: 'Kurumsal alıcılar veya kooperatifler için çoklu parselleri tek tıkla opsiyonlayın.', icon: 'Building2' }
        ],
        benefits: [
            'Parsel mükerrer satış (çifte satış) riskinin engellenmesi',
            'Yatırımcılara güncel boş parsel listesi sunumu',
            'Hızlı arazi değerleme öngörüleri'
        ]
    },
    {
        slug: 'luxury-broker-crm',
        title: 'A+ Segment Lüks Konut Broker CRM',
        metaTitle: 'Lüks Konut Emlak Danışmanları İçin CRM Yazılımı | NovoxCRM',
        metaDescription: 'A+ gelir grubuna lüks konut, yalı ve köşk satan bağımsız brokerlar için gizlilik odaklı, özel portföy pazarlama CRM yazılımı.',
        heroHeadline: 'Lüks Gayrimenkul Satışında Mutlak Gizlilik ve Hız',
        heroSubheadline: 'VIP yatırımcı tabanınızı yönetin. Halka açık olmayan lüks portföyleri şifreli özel linklerle müşterilerinize sunun.',
        features: [
            { title: 'Off-Market Portföy Modülü', description: 'Sahibinin isteği üzerine internette yayınlanmayan lüks mülkleri güvenli veri tabanında saklayın.', icon: 'Lock' },
            { title: 'Kişiselleştirilmiş Sunum Linki', description: 'Müşterinize özel, şifreli ve sadece onun görebileceği web sunum sayfaları oluşturun.', icon: 'Link' },
            { title: 'Yatırımcı Talep Eşleştirme', description: 'Lüks konut arayan VIP müşterilerin kriterlerini (yalı dairesi, tarihi eser vb.) portföylerle eşleştirin.', icon: 'Star' }
        ],
        benefits: [
            'Müşteri mahremiyetinin en üst düzeyde korunması',
            'Premium kalitede kişiye özel dijital kataloglar',
            'VIP alıcı davranış analizleri'
        ]
    },
    {
        slug: 'b2b-gayrimenkul-crm',
        title: 'Kurumsal B2B Portföy Yönetim CRM',
        metaTitle: 'Kurumsal Gayrimenkul Portföy Yönetimi CRM | NovoxCRM',
        metaDescription: 'Holdingler, bankalar ve kurumsal firmaların gayrimenkul portföylerini, kiralama süreçlerini ve kurumsal kiracılarla ilişkilerini yöneten B2B CRM.',
        heroHeadline: 'Kurumsal Gayrimenkul Varlıklarında Akıllı Yönetim',
        heroSubheadline: 'Şirket aktifindeki gayrimenkullerin rayiç bedellerini, kurumsal kiralama sözleşmelerini ve amortisman durumlarını tek sistemden izleyin.',
        features: [
            { title: 'Kurumsal Kiracı Şirket Profili', description: 'Kiracı şirketlerin hiyerarşik yapılarını, finans yetkililerini ve sözleşme geçmişlerini kaydedin.', icon: 'Briefcase' },
            { title: 'Varlık Amortisman Analizi', description: 'Gayrimenkullerin yıllık değer artışlarını ve vergi matrahı amortismanlarını hesaplayın.', icon: 'LineChart' },
            { title: 'Toplu Kiralama Sözleşmeleri', description: 'Çoklu mülk kiralayan kurumsal müşteriler için konsolide sözleşme ve faturalama süreçleri.', icon: 'FileText' }
        ],
        benefits: [
            'Kurumsal mülk portföyünde şeffaf raporlama',
            'Sözleşme yenileme ve endeksleme otomasyonları',
            'Yönetim kuruluna anlık finansal varlık sunum raporları'
        ]
    }
];
