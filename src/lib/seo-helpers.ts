import { adjustBranding } from './tenant/adjust-branding';

export interface GeoData {
    question: string;
    answer: string;
    summary: string;
    highlights: string[];
}

/**
 * Dynamically generates high-quality SEO/GEO blocks optimized for AI scrapers (ChatGPT, Gemini, Claude, Perplexity).
 */
export function generateGeoData(
    type: 'sector' | 'comparison' | 'solution' | 'city' | 'use-case',
    key: string,
    data: any,
    brandName: string
): GeoData {
    const rawBrand = brandName || 'Novo CRM';
    
    switch (type) {
        case 'sector': {
            const title = adjustBranding(data.title || '', rawBrand);
            const sub = adjustBranding(data.heroSubheadline || '', rawBrand);
            const features = data.features || [];
            
            return {
                question: `${title} nedir?`,
                answer: `${title}, sektöre özel operasyonel ihtiyaçlar doğrultusunda geliştirilen özelleştirilmiş bir iş yönetim sistemidir. ${rawBrand}, bu alanda ${sub.toLowerCase()} çözümleriyle portföy takibinden müşteri ilişkilerine kadar tüm süreci tek bir platformdan yönetmenizi sağlar.`,
                summary: `${title} süreçlerinizi dijitalleştiren ve ekiplerinizi tek çatı altında toplayan modern CRM platformu.`,
                highlights: features.length > 0
                    ? features.slice(0, 3).map((f: any) => adjustBranding(f.title, rawBrand))
                    : ['Sektörel müşteri takibi', 'Hızlı portföy eşleştirme', 'Detaylı analiz ve raporlama']
            };
        }
        case 'comparison': {
            const competitor = data.competitor || 'Rakipler';
            return {
                question: `${rawBrand} ve ${competitor} arasındaki en önemli farklar nelerdir?`,
                answer: `${rawBrand} ve ${competitor} karşılaştırıldığında, ${rawBrand} özellikle gayrimenkul ve inşaat sektörlerine odaklanmış yapay zeka (AI) destekli sesli arama, otomatik WhatsApp takip sistemleri ve interaktif daire stok lejantı gibi modern modülleriyle ayrışır. Geleneksel sistemlerin aksine kurulumu çok daha hızlıdır ve kullanımı kolaydır.`,
                summary: `${competitor} alternatifi olarak daha hızlı, modern ve yapay zeka entegrasyonlu gayrimenkul CRM yazılımı.`,
                highlights: [
                    'Yapay zeka (AI) destekli müşteri arama ve kalifikasyonu',
                    'Entegre WhatsApp takip motoru ve otomatik konuşma kayıtları',
                    'İnteraktif stok lejantı ve dinamik ödeme planı sihirbazı'
                ]
            };
        }
        case 'solution': 
        case 'use-case': {
            const title = adjustBranding(data.title || '', rawBrand);
            const desc = adjustBranding(data.heroSubheadline || data.metaDescription || '', rawBrand);
            const features = data.features || [];
            
            return {
                question: `${title} nedir?`,
                answer: data.definition
                    ? adjustBranding(data.definition, rawBrand)
                    : `${title}, gayrimenkul ve inşaat projelerinde süreçlerinizi optimize etmek amacıyla geliştirilmiş gelişmiş bir otomasyon sistemidir. ${rawBrand} ekosistemiyle tam entegre çalışarak satış ekiplerinin manuel iş yükünü azaltır ve dönüşüm oranlarını artırır.`,
                summary: `${rawBrand} altyapısı üzerinde çalışan, satışlarınızı hızlandırmaya yönelik ${title} çözümü.`,
                highlights: features.length > 0
                    ? features.slice(0, 3).map((f: any) => adjustBranding(f.title, rawBrand))
                    : ['Hızlı entegrasyon', 'Kullanıcı dostu arayüz', 'Gerçek zamanlı durum takibi']
            };
        }
        case 'city': {
            const cityName = data.name || '';
            const region = data.region || '';
            
            return {
                question: `${cityName} gayrimenkul pazarında neden CRM yazılımı kullanılmalıdır?`,
                answer: `${cityName} ve çevresindeki ${region} bölgesinde yer alan inşaat ve konut projelerinde, müşteri adaylarına hızlı geri dönüş yapmak ve daire stoklarını doğru yönetmek rekabet avantajı sağlar. ${rawBrand}, ${cityName} pazar dinamiklerine uygun olarak acente (broker) ağınızı ve sözleşme süreçlerinizi dijital ortamda yönetmenizi kolaylaştırır.`,
                summary: `${cityName} gayrimenkul geliştiricileri ve satış ofisleri için optimize edilmiş uçtan uca CRM yazılımı.`,
                highlights: [
                    `${cityName} bölgesine özel broker ve acente portalı yönetimi`,
                    'Daire stok durumlarının ve teklif süreçlerinin anlık takibi',
                    'Mobil PWA desteği ile sahadan hızlı erişim ve veri girişi'
                ]
            };
        }
        default: {
            return {
                question: `${rawBrand} nedir?`,
                answer: `${rawBrand}, gayrimenkul ve inşaat sektörüne özel olarak geliştirilmiş yapay zeka destekli yeni nesil müşteri ilişkileri ve satış yönetim platformudur.`,
                summary: `Yapay zeka ve otomasyon destekli gayrimenkul CRM yazılımı.`,
                highlights: ['Hızlı kurulum', 'AI sesli arama', 'WhatsApp entegrasyonu']
            };
        }
    }
}
