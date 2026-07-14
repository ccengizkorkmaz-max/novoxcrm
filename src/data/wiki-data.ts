
export interface WikiArticle {
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    category: string;
    author: string;
    authorTitle: string;
    date: string;
    readTime: string;
    image?: string;
    tags?: string[];
    relatedSlugs?: string[];
    faq?: { question: string; answer: string }[];
    tldr?: string;
    stats?: { label: string; value: string }[];
    expertQuote?: { text: string; author: string };
}

import { generatedArticles } from './wiki-articles-gen';

export const wikiArticles: WikiArticle[] = [
    ...generatedArticles,
    {
        slug: 'gayrimenkul-satisinda-excel-neden-yetersiz',
        title: 'Gayrimenkul Satışında Excel Neden Artık Yetersiz Kalıyor?',
        excerpt: 'Hızla büyüyen inşaat firmaları için Excel bir yardımcı değil, ayağa dolanan bir prangadır. İşte dijital dönüşümün 5 kritik nedeni.',
        author: 'Caner Yılmaz',
        authorTitle: 'Kıdemli CRM Stratejisti',
        date: '27 Ocak 2026',
        readTime: '6 dk',
        category: 'Strateji',
        tldr: 'Gayrimenkul satışında Excel kullanmak; veri güvenliği, eş zamanlı çalışma, lead takibi, raporlama ve ölçeklenebilirlik açısından ciddi riskler taşır. 50+ ünite satışı yapan firmalar için CRM zorunludur.',
        stats: [
            { value: '%70', label: 'Takip edilmeyen lead kayıp oranı' },
            { value: '3x', label: 'CRM ile raporlama hızı artışı' },
            { value: '%40', label: 'CRM ile satış dönüşüm artışı' },
            { value: '5+', label: 'Eş zamanlı çalışan ihtiyacı' },
        ],
        faq: [
            { question: 'Gayrimenkul satışında Excel kullanmak riskli mi?', answer: 'Evet. Excel dosyaları kopyalanabilir, bozulabilir ve eş zamanlı güncelleme yapılamaz. Aynı dairenin iki kişiye satılması gibi ciddi prestij kayıplarına yol açabilir.' },
            { question: 'CRM yerine Google Sheets kullanılabilir mi?', answer: 'Eş zamanlı çalışma sorununu çözer ama stok yönetimi, ödeme planı, broker portalı gibi gayrimenkule özel ihtiyaçları karşılayamaz.' },
            { question: 'Excelden CRMe geçiş ne kadar sürer?', answer: 'Mevcut Excel verileriniz CSV formatında CRM sisteme aktarılabilir. Süreç genellikle 1-2 gün sürer.' },
        ],
        expertQuote: { text: 'Excel bir hesaplama aracıdır, yönetim sistemi değildir. Gayrimenkul satışı çok katmanlı bir süreçtir ve profesyonel bir CRM ile yönetilmelidir.', author: 'Caner Yılmaz, Kıdemli CRM Stratejisti' },
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

Haftalık satış raporu hazırlamak için 3 farklı Excel dosyasını birleştirmek için saatler harcayan ekipler gördük. Novo CRM gibi dikey bir çözümde; ciro, kalan stok, taksit vadeleri ve danışman performansı **Dashboard** üzerinde canlı olarak akar. Yönetim kurulu sunumları için manuel veri girişi dönemi kapanmıştır.

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
        tldr: 'Broker ağı yönetimi için şeffaf stok paylaşımı, lead protection sistemi ve otomatik hakediş hesaplama zorunludur. CRM ile broker sadakati ve satış hızı 3 katına çıkar.',
        faq: [
            { question: 'Broker satış komisyonu ne kadar?', answer: 'Türkiyede gayrimenkul broker komisyon oranı genellikle satış bedelinin yüzde 2-3 arasındadır. Lüks projelerde yüzde 4-5 olabilir.' },
            { question: 'Broker portalı ne işe yarar?', answer: 'Dış acentelerin güncel stok, fiyat listesi ve pazarlama materyallerine erişmesini sağlayan özel bir paneldir.' },
        ],
        content: `
# B2B Broker Ağları: Proje Satışlarını Ölçeklendirmenin Anahtarı

Türkiye'de ve dünyada büyük konut projelerinin satış grafiği incelendiğinde, başarının arkasında sadece "kendi satış ekibi" değil, devasa bir **Broker Ekosistemi** olduğu görülür. Ancak bu ekosistemi yönetmek, doğru teknolojik altyapı olmadan tam bir yönetim kabusuna dönüşebilir.

## Broker Sadakati Nasıl Sağlanır?

Bir profesyonel gayrimenkul danışmanının (Broker) projenize odaklanması için iki ana şart vardır: **Bilgiye Hızla Erişebilmek** ve **Hakediş Güvenliği**.

### 1. Şeffaf Stok Paylaşımı

Broker, müşterisiyle masadayken "şu daire boş mu?" diye sizi aramak zorunda kalıyorsa, o satışı büyük ihtimalle kaybedersiniz. Novo CRM'in Broker Portalı sayesinde, brokerlar kendi panellerinden anlık boş/dolu durumunu görür, saniyeler içinde müşteriye özel teklif oluşturabilir.

### 2. Modern "Lead Protection" Sistemi

Dış brokerların en büyük korkusu, getirdikleri müşterinin satış ofisi veya başka bir broker tarafından "kapılmasıdır". CRM sistemimizde uyguladığımız telefon numarası bazlı eşleştirme yazılımı sayesinde, bir müşteri hangi broker üzerinden girdiyse o işleme o broker'ın adı silinemez şekilde kazınır. Bu güven, brokerın projenizi "kendi projesi gibi" sahiplenmesini sağlar.

## Dijital Hakediş Yönetimi

Satış gerçekleştikten sonra broker için en sancılı süreç komisyon takibidir. "Hangi dairenin ödemesi geldi? Benim param ne zaman yatar?" sorularının cevabı CRM'de otomatiktir. Satış yapıldığı anda hakediş hesaplanır, ödeme planına bağlanır ve broker kendi panelinden şeffafça takip eder.

<div class="bg-emerald-950/25 border border-emerald-500/30 rounded-xl p-5 my-6"><strong class="text-emerald-400 font-semibold">Tavsiye:</strong> Satış bedeli, KDV ve stopaj oranlarına göre net acente/broker komisyonunu ve hakediş paylaşımlarını hesaplamak için ücretsiz <a href="/tr/tools/broker-komisyon-hesaplayici" class="text-blue-400 hover:underline">Broker Komisyon Hesaplama Aracımızı</a> kullanabilirsiniz.</div>

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
        tldr: 'Satış sonrası müşteri portalı, ödeme takibi ve inşaat ilerleme raporları ile müşteri güvenini artırır. Memnun müşteriler referans satışı yüzde 25 artırır.',
        faq: [
            { question: 'Müşteri portalı ne işe yarar?', answer: 'Satış sonrası müşterilerin ödeme durumlarını, inşaat ilerlemesini ve evrak süreçlerini dijital olarak takip edebildikleri özel bir alandır.' },
            { question: 'Müşteri portalı referans satışını nasıl artırır?', answer: 'Şeffaf bilgi paylaşımı ile memnun olan müşteriler çevrelerine projeyi tavsiye eder.' },
        ],
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
        tldr: 'Modern gayrimenkul CRM yazılımında olması gereken 5 özellik: dinamik ünite yönetimi, ödeme planı sihirbazı, WhatsApp entegrasyonu, finansal takip ve API kapasitesi.',
        faq: [
            { question: 'Gayrimenkul CRM neden genel CRMden farklıdır?', answer: 'Daire stok yönetimi, şerefiye hesaplama, ödeme planı kurgusu ve broker portalı gibi sektöre özel modüller içerir.' },
            { question: 'CRM yazılımında API desteği neden önemli?', answer: 'API sayesinde CRM, banka sistemleri, tapu entegrasyonları, SMS servisleri ve ERP yazılımları ile veri alışverişi yapabilir.' },
        ],
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

Novo CRM'i kurgularken bu 5 ana özelliği temel taşlarımız olarak belirledik. Çünkü biliyoruz ki; gayrimenkulde detaylı stok ve esnek finansal yönetim yoksa o sistem CRM değil, sadece bir adres defteridir.
        `
    },
    {
        slug: 'gayrimenkul-crm-nedir-neden-zorunlu',
        title: 'Gayrimenkul CRM Nedir? Konut Projelerinde Neden Zorunlu Hale Geldi?',
        excerpt: 'Gayrimenkul CRM tanımından konut projelerindeki karmaşayı çözme yollarına kadar her şey bu yazıda.',
        author: 'Caner Yılmaz',
        authorTitle: 'Kıdemli CRM Stratejisti',
        date: '29 Ocak 2026',
        readTime: '6 dk',
        category: 'Strateji',
        tldr: 'Gayrimenkul CRM, müşteri kartının yanı sıra projeyi, daireyi ve ödeme planını da yöneten uzmanlaşmış bir yazılımdır. Stok güvenliği, merkezi kontrol ve broker yönetimi için zorunludur.',
        faq: [
            { question: 'Gayrimenkul CRM nedir?', answer: 'Konut projeleri üreten ve satan firmaların müşteri, satış, stok ve ödeme süreçlerini tek merkezden yönetmesini sağlayan uzmanlaşmış bir yazılımdır.' },
            { question: 'Klasik CRM ile gayrimenkul CRM arasındaki fark nedir?', answer: 'Klasik CRM sadece müşteri kartları sunar. Gayrimenkul CRM ise dairenin durumunu, şerefiye puanını ve ödeme planını da bilir.' },
        ],
        content: `
# Gayrimenkul CRM Nedir? Konut Projelerinde Neden Zorunlu Hale Geldi?

Gayrimenkul CRM, konut projeleri üreten ve satan firmaların müşteri, satış ve stok süreçlerini tek merkezden yönetmesini sağlayan uzmanlaşmış bir yazılımdır. Standart CRM araçları sadece kişileri kaydederken, Gayrimenkul CRM projeyi, daireyi ve ödeme planını da işin içine katar.

## Klasik CRM ile Proje Bazlı CRM Farkı

Sıradan bir CRM yazılımı aldığınızda, size "müşteri kartları" sunar. Ancak bir konut projesi yönetiyorsanız, sizin için müşteri kadar **dairenin durumu** da önemlidir. Proje bazlı bir CRM (Novo CRM gibi), hangi dairenin satıldığını, hangisinin rezerve olduğunu ve hangi şerefiye puanıyla satıldığını bilir.

## Konut Projelerinde Karmaşa Neden Artar?

Birden fazla satış ofisi, onlarca bağımsız broker ve yüzlerce müşteri adayı bir araya geldiğinde veri karmaşası kaçınılmazdır. Yanlış dairenin teklif edilmesi veya bir müşterinin iki kez aranması gibi hatalar prestij kaybına yol açar.

## Neden Zorunlu?

1. **Stok Güvenliği:** Aynı dairenin iki farklı kişiye opsiyonlanmasını engeller.
2. **Merkezi Kontrol:** Satış müdürünün tüm ofisleri tek ekrandan görmesini sağlar.
3. **Broker Yönetimi:** Dış acentelerin sisteme güvenli ve yetkili dahil edilmesini sağlar.

Novo CRM olarak biz, bu karmaşayı ortadan kaldıran ve satışı merkeze alan bir yapı sunuyoruz.
        `
    },
    {
        slug: 'insaat-crm-secerken-yapilan-hatalar',
        title: 'İnşaat Firmaları için CRM Yazılımı Seçerken Yapılan 7 Kritik Hata',
        excerpt: 'Genel CRMlerin inşaat sektöründe neden yetersiz kaldığını ve seçim yaparken nelere dikkat etmeniz gerektiğini keşfedin.',
        author: 'Hakan Özkan',
        authorTitle: 'Teknoloji Direktörü',
        date: '29 Ocak 2026',
        readTime: '8 dk',
        category: 'Teknoloji',
        content: `
# İnşaat Firmaları için CRM Yazılımı Seçerken Yapılan 7 Kritik Hata

İnşaat sektörü, operasyonel yapısı gereği diğer sektörlerden ayrılır. Bir inşaat firması için CRM seçmek, sadece bir yazılım yatırımı değil, bir iş modeli tercihidir. İşte yapılan en yaygın hatalar:

## 1. Genel Amaçlı CRM Tercih Etmek
Genel CRM'ler "ürün" satmak için tasarlanmıştır. Ancak inşaatta "daire" satılır; dairenin katı, cephesi, balkon m2'si gibi onlarca detayı vardır.

## 2. Proje Mantığının Olmaması
Seçilen yazılımın içinde "Proje > Blok > Kat > Ünite" hiyerarşisi yoksa, o sistemle inşaat yönetilemez.

## 3. Satış Sonrası Süreçlerin Unutulması
Satış bittikten sonraki taksit takibi, senet yönetimi ve teslimat süreçleri CRM'in parçası olmalıdır.

## 4. Düşük Mobil Kapasite
Satış ofisindeki danışman veya sahadaki yetkili, tabletten anlık stok göremiyorsa operasyon yavaşlar.

## 5. Broker Yönetimine Odaklanmamak
Dış brokerların sisteme nasıl gireceği ve hakedişlerini nasıl göreceği planlanmamış sistemler eksiktir.

## 6. Karmaşık Arayüz
Danışmanlar sistemi kullanmakta zorlanıyorsa, o veri asla güncel kalmaz.

## 7. Esneklik Eksikliği
Ödeme planları kişiye özel esnetilemiyorsa, satış ofisindeki "pazarlık" süreci dijitalleşemez.

Doğru seçim, sektörü tanıyan bir partnerle çalışmaktan geçer.
        `
    },
    {
        slug: 'konut-projelerinde-satis-takibi-dijitallestirme',
        title: 'Konut Projelerinde Satış Takibi Nasıl Dijitalleştirilir?',
        excerpt: 'Excel risklerinden kurtulup merkezi satış kontrolüne geçmenin yol haritası.',
        author: 'Merve Demir',
        authorTitle: 'Satış Operasyonları Müdürü',
        date: '29 Ocak 2026',
        readTime: '7 dk',
        category: 'Süreç',
        content: `
# Konut Projelerinde Satış Takibi Nasıl Dijitalleştirilir?

Birçok inşaat firması hala satışlarını Excel tablolarıyla takip etmeye çalışıyor. Ancak dijitalleşen dünyada bu yöntem, hem güvenlik hem de verimlilik açısından büyük riskler taşıyor.

## Excel'in Riskleri ve Dijitalleşmenin Gücü
Excel dosyaları bozulabilir, kopyalanabilir ve en önemlisi "kim, neyi, ne zaman değiştirdi" sorusuna cevap veremez. Dijital bir CRM sisteminde ise her adım kayıtlıdır.

## Adım Adım Dijital Satış Yönetimi

### 1. Canlı Stok Görünümü (Lejant)
Satış ofisindeki dev ekranlarda veya danışmanların tabletlerinde hangi dairenin satıldığı anlık olarak görünmelidir.

### 2. Lead (Müşteri Adayı) Havuzu
Gelen her telefon veya sosyal medya formu doğrudan sisteme düşmeli, danışmana atanmalı ve takip süreci başlamalıdır.

### 3. Teklif ve Opsiyon Yönetimi
Müşteriye özel ödeme planlı teklifler saniyeler içinde PDF olarak oluşturulmalı ve daire rezerve edilmelidir.

## Satış Temsilcisi Performansı
Dijitalleşme sayesinde hangi danışmanın kaç görüşme yaptığı, kaç teklif verdiği ve kaç satış kapattığı anlık raporlanabilir.

Novo CRM ile konut satış süreçlerinizi tamamen dijitalleştirerek hata payını sıfıra indirin.
        `
    },
    {
        slug: 'gayrimenkul-crm-mi-erp-mi',
        title: 'Gayrimenkul Firmaları için CRM mi, ERP mi? Hangisi Gerçekten Gerekli?',
        excerpt: 'CRM ve ERP arasındaki farkları ve inşaat firmalarının gerçek ihtiyaçlarını analiz ediyoruz.',
        author: 'Caner Yılmaz',
        authorTitle: 'Kıdemli CRM Stratejisti',
        date: '29 Ocak 2026',
        readTime: '6 dk',
        category: 'Strateji',
        content: `
# Gayrimenkul Firmaları için CRM mi, ERP mi? Hangisi Gerçekten Gerekli?

Pek çok inşaat ve gayrimenkul firması, büyümeye başladığında bir dijitalleşme yol ayrımına gelir: Geniş kapsamlı bir ERP mi, yoksa satış odaklı bir CRM mi?

## CRM ve ERP Arasındaki Temel Farklar
ERP (Kurumsal Kaynak Planlama), genellikle "içeriye" yani maliyet, hakediş (şantiye bazlı), satın alma ve muhasebeye odaklanır. CRM (Müşteri İlişkileri Yönetimi) ise "dışarıya" yani müşteriye, satışa ve pazarlamaya odaklanır.

## İnşaat Firmaları Neden Önce CRM Seçmeli?
İnşaat projelerinde nakit akışını sağlayan şey **satıştır.** Satış ofisinin hızı, müşterinin takibi ve broker ağının yönetimi ERP sistemlerinin genellikle zayıf kaldığı alanlardır. ERP'ler genellikle "ağır" ve kurulumu maliyetli sistemlerdir.

## Novo CRM Yaklaşımı
Novo CRM, bir ERP'nin karmaşıklığına girmeden, ama bir ERP kadar güçlü finansal takip (senet, ödeme planı) sunarak inşaat firmalarının en kritik ihtiyacı olan "satış ve nakit akışı" problemini çözer.

Eğer şantiyedeki beton dökümünü değil de, satış ofisindeki daire satışını yönetmek istiyorsanız; cevabınız CRM'dir.
        `
    },
    {
        slug: 'broker-yonetimi-ve-crm-onemi',
        title: 'Broker ile Çalışan İnşaat Firmaları için CRM Neden Şart?',
        excerpt: 'Dış broker ağınızı güvenle yönetmenin ve satış gücünüzü artırmanın yolları.',
        author: 'Merve Demir',
        authorTitle: 'Satış Operasyonları Müdürü',
        date: '29 Ocak 2026',
        readTime: '8 dk',
        category: 'Strateji',
        content: `
# Broker ile Çalışan İnşaat Firmaları için CRM Neden Şart?

Konut projelerinin büyük bir kısmı artık dış brokerlar ve gayrimenkul acenteleri üzerinden satılmaktadır. Ancak bu ağla çalışmak, doğru teknolojik yapı yoksa veri sızıntısı ve müşteri çakışması gibi riskler barındırır.

## Broker Yönetimindeki 3 Temel Engel

1. **Bilgi Paylaşımı:** Brokerlar güncel stok ve fiyat listesine anlık ulaşamıyorsa satış hızı düşer.
2. **Müşteri Çakışması:** Aynı müşterinin hem satış ofisinde hem de bir brokerda kayıtlı olması ihtilaf yaratır.
3. **Şeffaflık:** Brokerlar, gönderdikleri müşterilerin hangi aşamada olduğunu (teklif, kapora, satış) görmek ister.

## CRM ile Bu Sorunlar Nasıl Çözülür?
Novo CRM'in Broker Portalı ile her brokera özel bir giriş paneli verilir. Broker sadece kendi müşterisini görür ama projenin tüm güncel stoklarını anlık izleyebilir.

Satış tamamlandığında komisyon hesaplaması sistem üzerinden otomatik yapılır, bu da brokerın firmaya olan güvenini ve sadakatini artırır.
        `
    },
    {
        slug: 'konut-projelerinde-stok-ve-daire-takibi',
        title: 'Konut Projelerinde Stok ve Daire Takibi Nasıl Doğru Yapılır?',
        excerpt: 'Canlı stok görünümü ve interaktif lejant yönetiminin satış başarısındaki kritik rolü.',
        author: 'Hakan Özkan',
        authorTitle: 'Teknoloji Direktörü',
        date: '29 Ocak 2026',
        readTime: '6 dk',
        category: 'Süreç',
        content: `
# Konut Projelerinde Stok ve Daire Takibi Nasıl Doğru Yapılır?

Gayrimenkul satışında en büyük korku, satılmış olan bir dairenin tekrar listelenmesi veya yanlış fiyatla teklif edilmesidir. Bu durum sadece finansal değil, aynı zamanda ciddi bir marka prestij kaybıdır.

## Canlı Stok Yönetimi Nedir?
Canlı stok, projedeki her bir ünitenin durumunun (boş, rezerve, opsiyonlu, satıldı) tüm satış kanallarında (ofis, mobil, broker) saniyeler içinde güncellenmesidir.

## CRM ile Doğru Stok Takibinin Avantajları

- **Hata Payı Sıfırlanır:** Sistem, satılmış bir daire için yeni bir teklif oluşturulmasına izin vermez.
- **Şerefiye Yönetimi:** Her dairenin şerefiye puanı ve buna bağlı fiyatı sistemde sabittir; danışman inisiyatifiyle yanlış fiyat verilmesi engellenir.
- **Interaktif Lejant:** Satış ofisindeki dev ekranlarda, projenin mimari planı üzerinde hangi dairelerin satıldığını renklerle göstermek, alıcıda güven oluşturur.

<div class="bg-emerald-950/25 border border-emerald-500/30 rounded-xl p-5 my-6"><strong class="text-emerald-400 font-semibold">Tavsiye:</strong> Projenizdeki dairelerin konum, kat, cephe ve manzara avantajlarına göre şerefiye dağılımını bilimsel yöntemlerle hesaplamak için ücretsiz ve anlık çalışan <a href="/tr/tools/serefiye-hesaplayici" class="text-blue-400 hover:underline">Şerefiye Hesaplayıcı Aracımızı</a> kullanabilirsiniz.</div>

Novo CRM, inşaat firmalarına bu profesyonel stok yönetimini en basit ve en hızlı arayüzle sunar.
        `
    },
    {
        slug: 'gayrimenkul-satis-sureclerinde-crm-etkisi',
        title: 'Gayrimenkul Satış Süreçlerinde CRM Kullanmanın Satışa Etkisi',
        excerpt: 'Lead dönüşüm oranlarını artırmanın ve takip edilmeyen müşteri kayıplarını önlemenin yolları.',
        author: 'Selen Aksoy',
        authorTitle: 'Müşteri Deneyimi Ekip Lideri',
        date: '29 Ocak 2026',
        readTime: '5 dk',
        category: 'Süreç',
        content: `
# Gayrimenkul Satış Süreçlerinde CRM Kullanmanın Satışa Etkisi

"Müşteri zaten arıyor, biz de kaydediyoruz" yaklaşımı artık yeterli değil. Modern gayrimenkul satışında başarı, veriyi nasıl işlediğinizle doğrudan ilgilidir.

## Lead Dönüşüm Oranları (Conversion Rates)
Bir dijital reklamdan gelen 100 müşterinin kaçı satış ofisine geliyor? Kaçı teklif alıyor? CRM olmadan bu huniyi (funnel) takip etmek imkansızdır. CRM kullanan firmalarda satış dönüşüm oranlarının %40'a kadar arttığı gözlemlenmiştir.

## Takip Edilmeyen Müşteri Kayıpları
Müşterilerin %70'i ilk görüşmede değil, 3. veya 4. takipten sonra karar verir. Danışmanın ajandasındaki bir not unutulabilir, ancak CRM'deki otomatik hatırlatma unutulmaz.

## Otomasyon ve Hız
Müşteri form doldurduğu anda cebine gelen "Hoş geldiniz" mesajı ve dijital katalog, markanıza olan güveni ilk saniyeden inşa eder. Hız, gayrimenkulde her şeydir.

Novo CRM ile satış ekibinizin verimliliğini somut verilerle artırın.
        `
    },
    {
        slug: 'insaat-projelerinde-odeme-plani-ve-sozlesme-takibi',
        title: 'İnşaat Projelerinde Ödeme Planı ve Sözleşme Takibi Nasıl Kolaylaştırılır?',
        excerpt: 'Taksitli satışların yönetim zorluğunu ve CRM ile finansal riskleri azaltmanın yolları.',
        author: 'Caner Yılmaz',
        authorTitle: 'Kıdemli CRM Stratejisti',
        date: '29 Ocak 2026',
        readTime: '7 dk',
        category: 'Süreç',
        content: `
# İnşaat Projelerinde Ödeme Planı ve Sözleşme Takibi Nasıl Kolaylaştırılır?

İnşaat projelerinde satışın en karmaşık kısmı, ödeme planının kurgulanması ve takip edilmesidir. Peşinat, ara ödemeler, banka kredisi ve senetli taksitlerin hatasız yönetilmesi hayati önem taşır.

## Ödeme Planı Hatalarının Finansal Riski
Manuel hazırlanan bir ödeme planında yapılacak tek bir tarih veya tutar hatası, projenin nakit akışında ciddi aksamalara yol açabilir. Kaçan bir taksit veya unutulan bir ara ödeme, firmanın finansal sağlığını bozar.

## CRM ile Dijital Ödeme Yönetimi
Novo CRM'in **Ödeme Planı Sihirbazı**, saniyeler içinde binlerce senaryoyu hatasız hesaplar. Taksitlerin vadesi geldiğinde hem müşteriye hem de finans ekibine otomatik hatırlatmalar gider.

<div class="bg-emerald-950/25 border border-emerald-500/30 rounded-xl p-5 my-6"><strong class="text-emerald-400 font-semibold">Tavsiye:</strong> Müşterileriniz için en uygun konut kredisi oranlarını karşılaştırmak, taksit ödeme tablosunu simüle etmek ve aylık maliyetleri analiz etmek için ücretsiz <a href="/tr/tools/konut-kredisi-karsilastirma" class="text-blue-400 hover:underline">Konut Kredisi Karşılaştırma Aracımızı</a> kullanabilirsiniz.</div>

## Finans ve Satış Senkronizasyonu
Satış ekibinin sattığı dairenin tahsilat durumunu anlık görmesi gerekir. "Müşteri ödemesini yaptı mı?" sorusu için artık muhasebe ile telefon trafiği yapılmasına gerek kalmaz. Her şey CRM üzerinde şeffaftır.

Sözleşme süreçlerinizi ve ödeme takibinizi dijitalleştirerek finansal güvenliğinizi sağlayın.
        `
    },
    {
        slug: 'turkiyede-gayrimenkul-firmalari-icin-en-iyi-crm-ozellikleri',
        title: 'Türkiye’de Gayrimenkul Firmaları için En İyi CRM Özellikleri Nelerdir?',
        excerpt: 'Yerli pazarın ihtiyaçlarına göre tasarlanmış en iyi CRM özelliklerini keşfedin.',
        author: 'Hakan Özkan',
        authorTitle: 'Teknoloji Direktörü',
        date: '29 Ocak 2026',
        readTime: '6 dk',
        category: 'Teknoloji',
        content: `
# Türkiye’de Gayrimenkul Firmaları için En İyi CRM Özellikleri Nelerdir?

Türkiye gayrimenkul pazarı, kendine has dinamikleri olan bir sektördür. Global yazılımlar genellikle Türkiye'deki senetli satış, yerel broker ağları ve şerefiye bazlı stok yönetiminde yetersiz kalır.

## Yerli CRM Kullanmanın Avantajları
Yerli bir çözüm, Türkiye'deki inşaat projelerinin yasal süreçlerine, ödeme alışkanlıklarına ve broker çalışma modellerine tam uyum sağlar.

## Olmazsa Olmaz Özellikler

1. **Gelişmiş Senet Yönetimi:** Türkiye'deki taksitli satış modeline uygun, matbu senet dökebilen yapılar.
2. **Yerel Broker Entegrasyonu:** İstanbul, Ankara, İzmir gibi büyük şehirlerdeki broker ağlarıyla uyumlu portal desteği.
3. **KVKK Uyumu:** Verilerin Türkiye'deki sunucularda saklanması ve yerel mevzuata tam uyum.
4. **Hızlı Teknik Destek:** Sektörü bilen, dilinizi konuşan bir ekibe anında ulaşım.

Novo CRM, Türkiye'nin lider inşaat firmalarının tecrübeleriyle harmanlanmış, yerli ve güçlü bir altyapı sunar.
        `
    },
    {
        slug: 'gayrimenkul-firmalari-icin-crm-alternatifleri-karsilastirma',
        title: 'Gayrimenkul Firmaları için CRM Alternatifleri: Hangi Çözüm Kime Uygun?',
        excerpt: 'Genel CRM çözümleri ile sektörel CRM’ler arasındaki farkları ve karşılaştırmalı analizi.',
        author: 'Merve Demir',
        authorTitle: 'Satış Operasyonları Müdürü',
        date: '29 Ocak 2026',
        readTime: '8 dk',
        category: 'Strateji',
        content: `
# Gayrimenkul Firmaları için CRM Alternatifleri: Hangi Çözüm Kime Uygun?

Piyasada Salesforce, HubSpot gibi devlerden yerel butik çözümlere kadar pek çok CRM alternatifi bulunmaktadır. Ancak "en iyi" yazılım yoktur, "ihtiyacınıza en uygun" yazılım vardır.

## Genel CRM Çözümleri (Salesforce, HubSpot vb.)
Bu sistemler çok güçlüdür ancak inşaat sektörüne uyarlamak (customization) aylar sürebilir ve çok maliyetlidir. Genellikle stok takibi ve şerefiye yönetimi için ek yazılımlara ihtiyaç duyarlar.

## Sektörel CRM Çözümleri (Novo CRM, Produo vb.)
Bu yazılımlar "kutudan çıktığı anda" inşaat projesi yönetmeye hazırdır. İçinde hazır lejant, broker portalı ve ödeme planı sihirbazı ile gelirler.

## Novo CRM’in Konumlandırması
Novo CRM, özellikle konut projelerinde **satış hızına ve operasyonel kolaylığa** odaklanır. Karmaşık ayarlar yerine, satış ofisinin yarım saatte öğrenip kullanmaya başlayacağı bir deneyim sunuyoruz.

Eğer odağınız milyonluk konut projelerini hatasız ve hızlı satmaksa, dikey (sektörel) çözümler maliyet ve zaman açısından her zaman bir adım öndedir.
        `
    },
    {
        slug: 'yapay-zeka-ile-konut-satisinda-ai-call-center-donemi',
        title: 'Yapay Zeka ile Konut Satışında AI Call Center ve Arama Robotu Dönemi',
        excerpt: 'Konut projelerinde yapay zeka sesli arama robotları, Vapi ve ElevenLabs entegrasyonu ile AI call center altyapısı kurarak soğuk aramaları ve lead kalifikasyonunu otomatize etme rehberi.',
        author: 'Caner Yılmaz',
        authorTitle: 'Kıdemli CRM Stratejisti',
        date: '14 Temmuz 2026',
        readTime: '8 dk',
        category: 'Yapay Zeka',
        tldr: 'Gayrimenkul ve konut satışlarında yapay zeka sesli arama robotları (Vapi/ElevenLabs), soğuk arama operasyonlarını (AI Call Center) %100 otomatize eder. AI, ilgilenen sıcak leadleri tespit ederek satış danışmanlarına atar ve zaman kaybını önler.',
        stats: [
            { value: '5000+', label: 'Günlük robot arama kapasitesi' },
            { value: '%40', label: 'Satış dönüşüm artışı' },
            { value: '%60', label: 'Müşteri karşılama zaman tasarrufu' },
            { value: '%0', label: 'Cevapsız bırakılan müşteri formları' }
        ],
        faq: [
            { question: 'AI Call Center gayrimenkul satışında nasıl kullanılır?', answer: 'Yeni konut projelerinin lansmanında binlerce lead form doldurur. AI arama robotu, bu kişileri saniyeler içinde arayarak doğal Türkçe konuşma ile projeyle ilgilenip ilgilenmediklerini sorar. İlgilenenleri anında sıcak lead olarak satış ofisine paslar.' },
            { question: 'Arama robotunun sesi doğal mı?', answer: 'Evet, Vapi ve ElevenLabs işbirliğiyle Mert Aksoy gibi profesyonel ses modelleri kullanılır. Doğal tonlamalar ve gecikmesiz cevap yeteneğiyle müşteriler gerçek bir insanla konuştuklarını düşünür.' }
        ],
        content: `
# Yapay Zeka ile Konut Satışında AI Call Center ve Arama Robotu Dönemi

Konut projeleri üreten inşaat firmaları ve gayrimenkul geliştiricileri için en büyük maliyet ve zaman kaybı, **niteliksiz müşteri adaylarıyla (lead'ler) yapılan telefon görüşmeleridir.** Dijital reklamlardan (Facebook, Instagram formları) gelen yüzlerce formun tek tek satış danışmanları tarafından aranması, hem motivasyon kaybına yol açar hem de gerçek alıcıların gözden kaçmasına neden olur.

İşte bu noktada **Yapay Zeka ile Konut Satışı** ve **AI Call Center (Sesli Arama Robotları)** devreye girerek tüm oyunu değiştiriyor.

## AI Call Center Nedir ve Gayrimenkulde Nasıl Çalışır?

AI Call Center, geleneksel çağrı merkezlerinin aksine, insan gücüne ihtiyaç duymadan **aynı anda binlerce müşteriyi arayabilen veya gelen çağrıları yanıtlayabilen yapay zeka sesli arama sistemidir.**

1. **Anlık Arama (Instant Call):** Müşteri web sitenizden veya sosyal medya reklamınızdan form doldurduğu anda, yapay zeka arama robotu (Vapi entegrasyonu ile) **saniyeler içinde** müşteriyi cep telefonundan arar.
2. **Doğal Türkçe İletişim:** Gelişmiş ElevenLabs altyapısı sayesinde yapay zeka, Mert Aksoy ses tonuyla son derece doğal, duraksamalı ve samimi bir Türkçe ile konuşur.
3. **Müşteri Kalifikasyonu (Lead Qualification):** Robot, müşteriye projeyle ilgilenip ilgilenmediğini, bütçe aralığını veya ne zaman satış ofisini ziyaret edebileceğini sorar.
4. **Akıllı Yönlendirme:** Eğer müşteri projeyle sıcak olarak ilgilendiğini belirtirse, sistem onu anında **"Sıcak Lead"** olarak işaretler ve detayları satış temsilcisinin ekranına düşürür. İlgilenmeyenleri ise otomatik eler.

<div class="bg-blue-950/25 border border-blue-500/30 rounded-xl p-5 my-6"><strong class="text-blue-400 font-semibold">Tavsiye:</strong> Türkçe konuşan, Vapi ve ElevenLabs destekli arama robotu özelliklerimizi detaylı incelemek için <a href="/tr/solutions/ai-sesli-arama" class="text-blue-400 hover:underline">AI Sesli Arama Sistemi</a> sayfamızı ziyaret edebilirsiniz.</div>

## Yapay Zeka ile Konut Satışının Sağladığı 3 Büyük Avantaj

### 1. Zaman Kaybını Sıfırlama
Satış temsilcileriniz gün boyunca telefon başında "numarayı aramak, ulaşılamayanlara tekrar dönmek veya yanlış numara girenlerle uğraşmak" zorunda kalmaz. Temsilciler sadece AI Call Center tarafından elenmiş, **ziyarete veya satın almaya hazır sıcak müşterilerle** görüşür.

### 2. %100 Hızlı Geri Dönüş
Reklam formlarına ilk 5 dakika içinde geri dönüldüğünde satışa dönüşme oranı %300 artar. Yapay zeka sesli robotu, form doldurulduğu anda (gece saat 3 olsa bile) anında arama yapabilir veya müşteriyi sabah araması için planlayabilir.

### 3. WhatsApp ve Outreach Entegrasyonu
Arama sonrasında yapay zeka, konuşmanın özetini çıkarır. Eğer müşteri "katalog gönderin" dediyse, sistem arkada çalışan **AI WhatsApp Agent** ile otomatik olarak PDF kataloğu, daire planlarını ve sanal tur linklerini müşterinin WhatsApp hattına ulaştırır.

<div class="bg-emerald-950/25 border border-emerald-500/30 rounded-xl p-5 my-6"><strong class="text-emerald-400 font-semibold">Tavsiye:</strong> Arama sonrası müşterilerinize otomatik katalog ve teklif gönderebilen yapay zeka otomasyonunu görmek için <a href="/tr/solutions/ai-whatsapp-agent" class="text-blue-400 hover:underline">AI WhatsApp Agent</a> çözümlerimizi inceleyin.</div>

## CRM Üzerinden Lead Skorlama ile Tam Kontrol

Sistem, sesli arama robotlarından, WhatsApp mesajlarından ve web sitesi ziyaretlerinden gelen tüm sinyalleri birleştirerek her bir müşteriye 0-100 arası bir **AI Skoru** verir. En yüksek skorlu müşteriler satış ekibinin dashboard ekranında en üstte listelenir.

Yapay zeka ile konut satışı, geleceğin teknolojisi değil; bugün satış ofislerinin en büyük büyüme kaldıraçlarından biridir. Manuel süreçleri geride bırakın ve satış ekibinizi yapay zeka ile güçlendirin.
        `
    }
];
