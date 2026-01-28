
export interface WikiArticle {
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    category: 'Strateji' | 'Teknoloji' | 'Süreç';
    author: string;
    authorTitle: string;
    date: string;
    readTime: string;
    image?: string;
}

export const wikiArticles: WikiArticle[] = [
    {
        slug: 'gayrimenkul-satisinda-excel-neden-yetersiz',
        title: 'Gayrimenkul Satışında Excel Neden Artık Yetersiz Kalıyor?',
        excerpt: 'Hızla büyüyen inşaat firmaları için Excel bir yardımcı değil, ayağa dolanan bir prangadır. İşte dijital dönüşümün 5 kritik nedeni.',
        author: 'Caner Yılmaz',
        authorTitle: 'Kıdemli CRM Stratejisti',
        date: '27 Ocak 2026',
        readTime: '6 dk',
        category: 'Strateji',
        content: `
# Gayrimenkul Satışında Excel Neden Artık Yetersiz Kalıyor?

Gayrimenkul sektörü, doğası gereği yüksek montanlı işlemlerin, uzun süreli karar mekanizmalarının ve çok katmanlı müşteri takibinin olduğu bir alandır. Birçok geliştirici firma, operasyonel yolculuğuna "kontrollü" göründüğü için Excel tablolarıyla başlar. Ancak, proje ölçeği büyüdüğünde ve veri hacmi arttığında, Excel bir yönetim aracı olmaktan çıkıp ciddi bir operasyonel risk faktörüne dönüşür.

## 1. Veri Bütünlüğü ve Güvenlik Açıkları

Excel'de veri güvenliği "dosya şifreleme"den öteye gidemez. Bir çalışanın dosyayı kopyalayıp gitmesi veya bir hücreyi yanlışlıkla silmesi saniyeler sürer. Oysa CRM sistemlerinde **Log Yönetimi** vardır. Kimin, hangi veriyi, ne zaman güncellediği anlık olarak izlenir. Veri sizin mülkünüzdür ve korunmalıdır.

## 2. Satış Ofisi ve Saha Arasındaki Kopukluk

Excel dosyaları genellikle satış müdürünün bilgisayarında "ana kopya" olarak kalır. Saha ekiplerinin veya dış acentelerin bu dosyayı eş zamanlı, hatasız güncellemesi teknik olarak imkansızdır. Bu durum, aynı dairenin iki farklı kişiye opsiyonlanması gibi telafisi güç prestij kayıplarına yol açar.

## 3. CRM Olmadan "Lead Bakımı" Yapılamaz

Bir müşteri adayı (Lead) geldiğinde, Excel'e yazılan bir not genellikle orada kalır. Ancak modern bir CRM, o müşteriyi 3 gün sonra aranması için danışmana hatırlatır, bakmadığı projeler için otomatik WhatsApp kataloğu gönderir. Excel hatırlatmaz, CRM ise **satışı zorlar.**

## 4. Raporlama Karmaşası

Haftalık satış raporu hazırlamak için 3 farklı Excel dosyasını birleştirmek için saatler harcayan ekipler gördük. NovoxCRM gibi dikey bir çözümde; ciro, kalan stok, taksit vadeleri ve danışman performansı **Dashboard** üzerinde canlı olarak akar. Yönetim kurulu sunumları için manuel veri girişi dönemi kapanmıştır.

## 5. Ölçeklenebilirlik Bariyeri

İkinci hatta üçüncü projenize başladığınızda Excel dosyalarınızın sayısı ve karmaşıklığı geometrik olarak artar. Bu durum, kurumsal hafızanın kişilere bağımlı kalmasına neden olur. CRM ise firmanızın kurumsal aklıdır; personel değişse bile sistem ve veriler tıkır tıkır işlemeye devam eder.

## Sonuç

Eğer yılda 50 adetten fazla ünite satışı hedefliyorsanız veya birden fazla proje yönetiyorsanız, Excel artık sizin için bir opsiyon değil, bir gelişim engelidir. Profesyonel bir yapı için profesyonel araçlar şarttır.
        `
    },
    {
        slug: 'b2b-broker-aglari-ve-proje-satisi',
        title: 'B2B Broker Ağları: Proje Satışlarını Ölçeklendirmenin Anahtarı',
        excerpt: 'Kendi satış ekibinizle sınırlı kalmayın. Yüzlerce brokerı sisteminize dahil ederek satış hızınızı nasıl 3 katına çıkarabilirsiniz?',
        author: 'Merve Demir',
        authorTitle: 'Satış Operasyonları Müdürü',
        date: '26 Ocak 2026',
        readTime: '8 dk',
        category: 'Strateji',
        content: `
# B2B Broker Ağları: Proje Satışlarını Ölçeklendirmenin Anahtarı

Türkiye'de ve dünyada büyük konut projelerinin satış grafiği incelendiğinde, başarının arkasında sadece "kendi satış ekibi" değil, devasa bir **Broker Ekosistemi** olduğu görülür. Ancak bu ekosistemi yönetmek, doğru teknolojik altyapı olmadan tam bir yönetim kabusuna dönüşebilir.

## Broker Sadakati Nasıl Sağlanır?

Bir profesyonel gayrimenkul danışmanının (Broker) projenize odaklanması için iki ana şart vardır: **Bilgiye Hızla Erişebilmek** ve **Hakediş Güvenliği**.

### 1. Şeffaf Stok Paylaşımı

Broker, müşterisiyle masadayken "şu daire boş mu?" diye sizi aramak zorunda kalıyorsa, o satışı büyük ihtimalle kaybedersiniz. NovoxCRM'in Broker Portalı sayesinde, brokerlar kendi panellerinden anlık boş/dolu durumunu görür, saniyeler içinde müşteriye özel teklif oluşturabilir.

### 2. Modern "Lead Protection" Sistemi

Dış brokerların en büyük korkusu, getirdikleri müşterinin satış ofisi veya başka bir broker tarafından "kapılmasıdır". CRM sistemimizde uyguladığımız telefon numarası bazlı eşleştirme yazılımı sayesinde, bir müşteri hangi broker üzerinden girdiyse o işleme o broker'ın adı silinemez şekilde kazınır. Bu güven, brokerın projenizi "kendi projesi gibi" sahiplenmesini sağlar.

## Dijital Hakediş Yönetimi

Satış gerçekleştikten sonra broker için en sancılı süreç komisyon takibidir. "Hangi dairenin ödemesi geldi? Benim param ne zaman yatar?" sorularının cevabı CRM'de otomatiktir. Satış yapıldığı anda hakediş hesaplanır, ödeme planına bağlanır ve broker kendi panelinden şeffafça takip eder.

## Eğitim ve Materyal Desteği

Brokerlarınıza güncel PDF kataloglar, profesyonel renderlar ve ödeme planı şablonlarını Google Drive linkleriyle değil, doğrudan CRM içindeki **Pazarlama Havuzu**'ndan sunun. Unutmayın; broker'ın işini ne kadar kolaylaştırırsanız, o kadar hızlı satış yaparsınız.
        `
    },
    {
        slug: 'musteri-portalinin-satis-sonrasindaki-onemi',
        title: 'Müşteri Portallarının Sadakat ve Şeffaflıktaki Rolü',
        excerpt: 'Satış, tapu teslimiyle bitmez. Müşterilerinize sunduğunuz dijital deneyim, yeni referans satışların kapısını açar.',
        author: 'Selen Aksoy',
        authorTitle: 'Müşteri Deneyimi Ekip Lideri',
        date: '25 Ocak 2026',
        readTime: '5 dk',
        category: 'Süreç',
        content: `
# Müşteri Portallarının Sadakat ve Şeffaflıktaki Rolü

Pek çok geliştirici firma için satış süreci sözleşmenin imzalanmasıyla "biter". Oysa profesyonel markalar için asıl ilişki o zaman başlar. Gayrimenkul satışı bir güven ilişkisidir ve bu güveni korumanın yolu **Dijital Şeffaflıktan** geçer.

## Şeffaf Finansal Tablo

Konut alan bir teslimat (post-sales) müşterisinin en büyük endişesi ödemeleridir. "Kalan borcum ne kadar? Bir sonraki taksit ne zaman? Ara ödemeyi yaptım mı?" gibi sorular için müşterinin sürekli muhasebeyi araması hem müşteri hem de firma için verim kaybıdır. Müşteri Portalı üzerinden sunulan canlı ödeme dökümü, bu süreci şeffaf ve kurumsal kılar.

## İnşaat İlerleme Raporları

Müşteri portalı, projeniz sadece bir satış alanı değil, bir yaşam alanı olduğunu kanıtlama yeridir. Aylık inşaat ilerleme fotoğrafları, dron çekimleri ve teknik raporlar, müşterinin parasının gayrimenkule dönüştüğünü somutlaştırır. Bu güven, müşteriyi sizin "doğal reklam ajansınız" haline getirir.

## Kişiselleştirilmiş İletişim ve Destek

Tapu süreci, banka kredisi evrakları veya teslimat sonrası eksik (snag) listesi gibi konularda müşterinin direkt portal üzerinden talep açabilmesi, kurumsallığın zirvesidir. CRM, bu talepleri ilgili departmana atar ve müşteriye "Sizi duyuyoruz" mesajını dijital olarak verir.

## Sonuç: Referans Satış Gücü

Memnun olan bir müşteri, çevresindeki 3 kişiye daha projenizi tavsiye eder. Modern bir müşteri portalı sunan geliştiriciler, iade oranlarını düşürürken, sıfır reklam maliyetiyle "referans satış" trafiğini %25 artırmaktadır.
        `
    },
    {
        slug: 'modern-gayrimenkul-crm-ozellikleri',
        title: 'Modern Bir Gayrimenkul CRM\'inde Olmazsa Olmaz 5 Özellik',
        excerpt: 'Sıradan bir CRM ile gayrimenkul odaklı bir CRM arasındaki fark nedir? Alırken nelere dikkat etmelisiniz?',
        author: 'Hakan Özkan',
        authorTitle: 'Teknoloji ve Yazılım Direktörü',
        date: '24 Ocak 2026',
        readTime: '7 dk',
        category: 'Teknoloji',
        content: `
# Modern Bir Gayrimenkul CRM'inde Olmazsa Olmaz 5 Özellik

Piyasada çok sayıda genel amaçlı CRM yazılımı bulunsa da, gayrimenkul geliştirme ve inşaat projeleri çok daha dikey ve kompleks ihtiyaçlara sahiptir. Yanlış yazılım seçimi, sadece para kaybı değil, aynı zamanda operasyonel bir yorgunluktur. İşte bir real estate CRM'inde aramanız gereken 5 kritik özellik:

### 1. Dinamik Ünite (Stok) Yönetimi

Müşteri kaydetmek yetmez. Sistemin her bir konutun cephesi, katı, m2'si ve şerefiye farkını bilmesi gerekir. Satış yapıldığı anda "Stok Havuzu"ndan düşmeli ve ilgili ünitenin tüm tarihçesi (kimlere teklif verildi, ne zaman satıldı) kayıt altına alınmalıdır.

### 2. Ödeme Planı Sihirbazı (Dynamic Builder)

Gayrimenkulde standart bir satış yoktur. Peşinat değişir, taksit ertelenir, senet vadesi esnetilir. Bir CRM, bu parametreleri girdiğinizde saniyeler içinde hatasız bir ödeme planı kurgulamalı ve bunu şık bir PDF teklife dönüştürebilmelidir.

### 3. WhatsApp ve Sosyal Medya Entegrasyonu

Leadler bugün artık maille değil, Instagram veya WhatsApp üzerinden geliyor. Danışmanın CRM ekranından ayrılmadan tek tıkla müşteriye WhatsApp üzerinden ulaşabilmesi, verimliliği %200 artırır. Tüm yazışmaların kurumsal hafızada kalması ise paha biçilemezdir.

### 4. Gelişmiş Finansal Takip ve Senet Yönetimi

Gayrimenkul CRM'i aynı zamanda bir "mini ön muhasebe" gibi çalışmalıdır. Senet dökümleri, gecikmiş ödeme uyarıları ve tahsilat projeksiyonları satış ekibi tarafından anlık görülebilmelidir. Muhasebe ile satış arasındaki "ödeme yapıldı mı?" diyaloğu minimize edilmelidir.

### 5. API ve Entegrasyon Kapasitesi

Bir CRM adadır; ancak o ada diğer kıtalara (Tapu sistemleri, Bankalar, SMS servisleri, ERP yazılımları) bağlı olmalıdır. Modern bir sistem, web servisleri (API) aracılığıyla diğer dijital araçlarınızla konuşabilmelidir. 

## Özet

NovoxCRM'i kurgularken bu 5 ana özelliği temel taşlarımız olarak belirledik. Çünkü biliyoruz ki; gayrimenkulde detaylı stok ve esnek finansal yönetim yoksa o sistem CRM değil, sadece bir adres defteridir.
        `
    }
];
