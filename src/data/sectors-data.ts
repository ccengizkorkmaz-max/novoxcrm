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
    }
];
