const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/wiki-articles-gen.ts');
if (!fs.existsSync(filePath)) {
    console.log("File not found at: " + filePath);
    process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

const stats = [
    "*Müşteri Deneyimi 2025 Raporuna göre, dijital otomasyon kullanan satış ofislerinde müşteri memnuniyeti %40 oranında artmaktadır.*",
    "*Satış trendleri araştırmalarına göre, 5 dakika içinde ulaşılan müşteri adaylarının (lead) sözleşme aşamasına geçme ihtimali 9 kat daha yüksektir.*",
    "*Sektörel istatistiklere göre, şeffaf stok ve ödeme planı sunulan portallarda müşteri itirazları minimuma inmektedir.*",
    "*Bulut tabanlı proje üretim yazılımları, yönetim ekiplerinin raporlama ve karar alma sürelerini ortalama %60 oranında kısaltmaktadır.*",
    "*Analizlere göre, çok kanallı (web, WhatsApp, ofis) satış stratejisi kurgulayan geliştiricilerin satış hızı (sales velocity) rakiplerinden %30 daha iyidir.*"
];

const faqTemplates = [
    "\n\n### Sıkça Sorulan Sorular\n**Soru:** Sürecin dijitalleşmesi teknik personeli zorlar mı?\n**Cevap:** Aksine, modern ve kullanıcı dostu arayüzler sayesinde ekipler birkaç saat içinde sisteme tam uyum sağlar.\n\n**Soru:** Raporlamalar manuel mi yapılıyor?\n**Cevap:** Hayır, veriler girdikçe tüm raporlar gerçek zamanlı olarak ve hatasız bir şekilde arka planda üretilir.",
    "\n\n### Merak Edilenler\n**Soru:** Sistemin veri güvenliği nasıl sağlanıyor?\n**Cevap:** Modern bulut mimarilerinde banka seviyesinde şifreleme ve sürekli yedekleme ile veri kaybı veya sızıntı ihtimali sıfırlanır.\n\n**Soru:** Özel geliştirme yapmak ne kadar sürer?\n**Cevap:** Özelleştirilmiş süreç yönetimleri (custom pipelines), dinamik sistemlerde genellikle kod yazmadan birkaç tıklama ile uyarlanabilir.",
    "\n\n### Sektörel SSS\n**Soru:** Aynı yapıda birden fazla satış modelini yönetebilir miyim?\n**Cevap:** Kesinlikle. Taksitli, nakit, senetli veya esnek banka kredisi gibi farklı senaryolar sorunsuz bir şekilde bir arada yaşatılabilir.\n\n**Soru:** Hatalı veya mükerrer müşteri kaydı engelleniyor mu?\n**Cevap:** Sistem giren lead'lerin telefon numaraları üzerinden anlık tekilleştirme yaparak çift temsilci atamasını ve mükerrer kaydı önler."
];

const sonuclars = [
    "## Uzman Görüşü",
    "## Gelecek Perspektifi",
    "## Değerlendirme ve Eylem Planı",
    "## Son Söz",
    "## Harekete Geçme Zamanı",
    "## Sektörel Yansımalar",
    "## Yönetici Özeti"
];

const keywordsToSlugs = {
    "ödeme planı": "insaat-projelerinde-odeme-plani-ve-sozlesme-takibi",
    "stok": "dijital-kat-plani-ve-stok-durumu-yonetimi",
    "lead": "aday-musteri-takibi-lead-tracking-rehberi",
    "broker": "b2b-broker-aglari-ve-proje-satisi",
    "şerefiye": "serefiye-hesaplama-yontemleri-rehber",
    "otomasyon": "insaat-satis-otomasyonu-rehberi"
};

let resultCount = 0;
let matchCount = 0;

content = content.replace(/## Sonuç/g, () => {
    return sonuclars[resultCount++ % sonuclars.length];
});

content = content.replace(/## NovoxCRM ile ([^\n`]+)/g, (match, p1) => {
    const r = Math.random();
    if (r < 0.25) return `## ${p1} ve Dijital Yansımaları`;
    if (r < 0.5) return `## Modern Altyapılarla ${p1}`;
    if (r < 0.75) return `## Profesyonel Sistemlerde ${p1}`;
    return `## Yeni Nesil ${p1}`;
});

content = content.replace(/content:\s*`([^`]+)`/g, (match, innerContent) => {
    matchCount++;
    let newContent = innerContent;
    
    // 1. STATISTIC
    if (!newContent.includes("> *")) {
        const stat = stats[Math.floor(Math.random() * stats.length)];
        newContent = newContent.replace(/\n\n(##|\w)/, `\n\n> ${stat}\n\n$1`);
    }

    // 2. FAQ
    if (Math.random() > 0.3) {
        if (!newContent.includes("Sıkça Sorulan Sorular") && !newContent.includes("Merak Edilenler")) {
            const faq = faqTemplates[Math.floor(Math.random() * faqTemplates.length)];
            newContent += faq;
        }
    }

    // 3. INTERNAL LINKING
    let linksAdded = 0;
    for (const [kw, targetSlug] of Object.entries(keywordsToSlugs)) {
        if (linksAdded >= 2) break;
        
        const regex = new RegExp(`(?<=^|\\s)(${kw})(?=\\s|[.,!?;]|$)`, "i");
        const matchToken = newContent.match(regex);
        
        if (matchToken && matchToken.index !== undefined) {
            const preceding = newContent.slice(0, matchToken.index);
            const bracketsOpen = (preceding.match(/\[/g) || []).length;
            const bracketsClose = (preceding.match(/\]/g) || []).length;
            
            if (bracketsOpen === bracketsClose) {
                newContent = newContent.slice(0, matchToken.index) + 
                            `[${matchToken[1]}](/tr/wiki/${targetSlug})` + 
                            newContent.slice(matchToken.index + matchToken[1].length);
                linksAdded++;
            }
        }
    }

    return `content: \`${newContent}\``;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Successfully processed wiki-articles-gen.ts`);
console.log(`Updated ${resultCount} conclusions and ${matchCount} articles.`);
