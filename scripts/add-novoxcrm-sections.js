const fs = require('fs');

// Sadece NovoxCRM ile gerçekten somut ilişki kurulabilen makaleler
const NOVOX_MAP = {
  'satilan-daire-bos-gorunme-hatasi': `## NovoxCRM ile Çift Satış Önleme

NovoxCRM'de satış onaylandığı anda ünitenin durumu tüm kanallarda (ofis, broker, web) anlık olarak "Satıldı" olarak güncellenir. Manuel güncelleme gerektirmez. Sözleşme oluşturulduğunda stok otomatik kapanır. Farklı danışmanlar aynı anda aynı üniteye teklif vermeye çalışırsa sistem çakışma uyarısı verir. Bu mekanizma, çift satış riskini **sıfırlar** ve firma itibarını korur.`,

  'crm-erp-entegrasyonu-basarisizlik-nedenleri': `## NovoxCRM'in ERP Entegrasyon Yaklaşımı

NovoxCRM, REST API altyapısıyla Logo, Netsis, Mikro ve Paraşüt gibi muhasebe/ERP yazılımlarına bağlanır. Alan eşleştirmesi yönetim panelinden görsel olarak yapılır — teknik kod bilgisi gerekmez. Senkronizasyon gerçek zamanlı veya zamanlı (scheduled) olarak ayarlanabilir. Entegrasyon sağlığı dashboard'dan izlenir ve bağlantı kesilirse sistem yöneticisine otomatik uyarı gönderilir.`,

  'senet-vadesi-kacirma-otomatik-tahsilat': `## NovoxCRM ile Otomatik Senet Takibi

NovoxCRM'in finans modülünde her sözleşmeye bağlı senet takvimi otomatik oluşturulur. Vadesi yaklaşan senetler için 7, 3 ve 1 gün öncesinden hem danışmana hem müşteriye otomatik hatırlatma gönderilir. Geciken senetler "Tahsilat Bekliyor" statüsüne düşer ve üst yönetime eskalasyon yapılır. Gecikme faizi otomatik hesaplanır. Bankaya iskonto ettirilen senetler ayrı modülde takip edilir.`,

  'satis-ekibi-crm-kullanim-direnci-cozum': `## NovoxCRM'in Kolay Benimsenmesi

NovoxCRM, sade ve sezgisel arayüzü sayesinde satış ekibinin hızla adapte olmasını sağlar. Onboarding sürecinde video eğitim kütüphanesi, adım adım rehberler ve canlı destek sunulur. İlk hafta içinde danışmanlar teklif oluşturma, lead takibi ve müşteri kartı kullanımını öğrenir. Karmaşık menüler ve gereksiz özellikler yerine, danışmanın günlük işini kolaylaştıran odaklı bir arayüz tercih edilmiştir.`,

  'personel-ayrilinca-musteri-verisi-koruma': `## NovoxCRM ile Veri Sürekliliği

NovoxCRM'de tüm müşteri verileri merkezi veritabanında saklanır — danışmanın kişisel bilgisayarında veya telefonunda değil. Personel ayrıldığında hesabı devre dışı bırakılır ve müşteri portföyü tek tıkla başka danışmana devredilir. Tüm geçmiş aktiviteler (aramalar, mesajlar, teklifler, notlar) müşteri kartında korunur. Yeni danışman, müşterinin tüm geçmişini anında görür ve hiçbir bilgi kaybolmaz.`,

  'kvkk-veri-maskeleme-loglama-gayrimenkul': `## NovoxCRM'de KVKK Uyumlu Altyapı

NovoxCRM, KVKK gereksinimlerini karşılayan yerleşik özellikler sunar: rol tabanlı erişim kontrolü, hassas veri maskeleme (TC kimlik numarasının son 4 hanesi dışının gizlenmesi, telefon numarası kısmi gösterimi), tüm erişimlerin zaman damgalı loglanması, açık rıza yönetim modülü ve saklama süresi dolduğunda otomatik silme/anonimleştirme hatırlatması.`,

  'gayrimenkul-dijital-envanter-yonetimi': `## NovoxCRM ile Dijital Envanter Yönetimi

NovoxCRM'de her proje için blok, kat ve ünite bazında detaylı envanter tanımlanır. Vaziyet planı ve kat planları interaktif olarak yüklenir ve her ünite tıklanabilir hale gelir. Stok durumu (Müsait/Opsiyonlu/Satıldı/Bloke) tüm kanallarda eş zamanlı güncellenir. Stok erime hızı, kalan envanter değeri ve proje bazlı karşılaştırma raporları otomatik oluşturulur.`,

  'broker-komisyon-hakedis-yonetimi': `## NovoxCRM ile Broker ve Komisyon Yönetimi

NovoxCRM'in broker portalı, dış satış kanallarına güncel stok görüntüleme, teklif oluşturma ve müşteri kaydı imkanı sunar. Komisyon oranları proje ve daire tipine göre tanımlanır. Satış tamamlandığında hakediş tutarı otomatik hesaplanır ve muhasebe modülüne iletilir. Müşteri çakışması otomatik tespit edilir — aynı müşterinin hem brokerdan hem iç ekipten gelme durumunda "ilk kaydeden" kuralı uygulanır.`,

  'yabanciya-konut-satisi-surec-yonetimi': `## NovoxCRM ile Yabancı Alıcı Süreç Yönetimi

NovoxCRM'de müşteri profili "Yabancı Uyruklu" olarak işaretlendiğinde sistem otomatik olarak: KDV istisnası senaryosunu uygular, ek belge kontrol listesini (pasaport, döviz transfer dekontu, konsolosluk onayı) devreye alır, ve 1 yıllık temlik yasağı hatırlatmasını takvime ekler. Döviz bazlı fiyatlandırma ve çok dilli teklif PDF desteği, yabancı alıcı satış sürecini profesyonelce yönetmenizi sağlar.`,

  'kisiye-ozel-odeme-plani-simulasyonu': `## NovoxCRM'in Ödeme Planı Simülatörü

NovoxCRM'in ödeme planı motoru, her müşteriye özel simülasyon oluşturur. Peşinat oranı, taksit sayısı, ara ödeme tutarı, balon ödeme ve senet vadesi gibi parametreler esnek şekilde konfigüre edilir. Aynı daire için 3 farklı ödeme senaryosu yan yana karşılaştırılabilir. KDV, şerefiye ve vade farkı otomatik dahil edilir. Müşterinin onayladığı plan, tek tıkla profesyonel PDF teklife dönüşür.`,

  'konut-satisinda-lead-skorlama-metodolojisi': `## NovoxCRM ile Lead Skorlama

NovoxCRM'de her lead, bütçe uygunluğu, zaman dilimi, ilgilendiği daire tipi ve etkileşim sıklığına göre otomatik puanlanır. Yüksek skorlu leadler öncelikli olarak deneyimli danışmanlara atanır. Düşük skorlu leadler uzun vadeli beslenme kampanyasına dahil edilir. Lead'in etkileşim sıklığı artarsa skoru otomatik yükseltilir ve satış önceliğine alınır.`,

  'musteri-getir-referral-kampanya-yonetimi': `## NovoxCRM ile Referans Programı Yönetimi

NovoxCRM'de mevcut müşterilere özel referans bağlantıları oluşturulabilir. Referansla gelen her yeni lead otomatik olarak "Referans" kaynağıyla etiketlenir ve referansı veren müşterinin kartına bağlanır. Referans dönüşüm oranları ayrı raporlanır. Başarılı satışlarda referans ödülü sistemi otomatik hesaplanır ve muhasebe modülüne işlenir.`,

  'konut-satisinda-dijital-imza-e-imza': `## NovoxCRM ile e-İmza Entegrasyonu

NovoxCRM, onaylı elektronik imza sağlayıcılarıyla entegre çalışır. Sözleşme hazırlandıktan sonra müşteriye e-imza linki tek tıkla gönderilir. Özellikle yurt dışındaki alıcılar ve şehir dışı müşteriler için fiziksel imza zorunluluğu ortadan kalkar. İmzalanan sözleşmenin nüshası otomatik olarak müşteri kartına eklenir ve hukuki arşiv oluşur.`,

  'sanal-tur-matterport-crm-entegrasyonu': `## NovoxCRM ile Sanal Tur Bağlantısı

NovoxCRM, Matterport ve 360° sanal tur bağlantılarını ünite kartlarına eklemenize olanak tanır. Danışman, müşteriye CRM üzerinden tek tıkla sanal tur linki paylaşabilir. Hangi müşterinin hangi daire turunu ne kadar süre izlediği takip edilebilir. Bu veri, danışmana müşterinin gerçek ilgi düzeyini ölçme ve buna göre aksiyon alma imkanı sağlar.`,

  'tapu-harci-doner-sermaye-otomatik-hesaplama': `## NovoxCRM ile Tapu Masrafı Hesaplaması

NovoxCRM, sözleşme oluşturulduğunda tapu harcı ve döner sermaye tutarlarını satış bedeline göre otomatik hesaplar. Alıcı-satıcı paylaşım oranı ayarlanabilir. Hesaplanan tutarlar teklif PDF'ine dahil edilebilir — müşteriye "toplam maliyet" şeffaf şekilde sunulur. Bu yaklaşım sürpriz maliyetleri ortadan kaldırır ve müşteri güvenini artırır.`,

  'satis-ofisi-gunluk-rapor-hazirlik': `## NovoxCRM ile Otomatik Günlük Rapor

NovoxCRM, her gün belirlenen saatte otomatik günlük satış raporu oluşturur ve yöneticiye e-posta olarak gönderir. Rapor; gelen lead sayısı, yapılan aramalar, verilen teklifler, opsiyonlar ve tamamlanan satışları özetler. Danışman bazlı performans kırılımı rapora dahil edilir. Manuel rapor hazırlama ihtiyacı tamamen ortadan kalkar — yönetici her sabah hazır raporuyla güne başlar.`,

  'insaat-satislari-neden-duser-analiz': `## NovoxCRM ile Satış Düşüşü Erken Uyarı

NovoxCRM'in analitik modülü, satış hızındaki yavaşlamayı erken tespit eder. Pipeline'daki lead sayısı, teklif adedi veya dönüşüm oranında normalin altına düşüş olduğunda yöneticiye otomatik uyarı gönderilir. Hangi aşamada, hangi danışmanda ve hangi kanalda düşüş olduğu detaylı raporlanır. Böylece satış düşüşüne sorun büyümeden müdahale edilir.`,

  'kurumsal-hafiza-nasil-olusturulur': `## NovoxCRM ile Kurumsal Hafıza Oluşturma

NovoxCRM, her müşteri etkileşimini dijital olarak kayıt altına alır. Aramalar, mesajlar, teklifler, sözleşmeler ve notlar müşteri kartında kronolojik olarak saklanır. Personel değiştiğinde yeni danışman, müşterinin tüm geçmişini anında görür. Satış süreçleri şablonlar ve otomasyonlarla standartlaştırılır. Bilgi kişilerde değil, **sistemde** yaşar — böylece firma, çalışan bağımsız bir kurumsal hafıza oluşturur.`,

  'nakit-akis-tablosu-olusturma-rehberi': `## NovoxCRM ile Nakit Akış Projeksiyonu

NovoxCRM'in finans modülü, tüm aktif sözleşmelerdeki ödeme planı taksit vadelerini birleştirerek ileriye dönük nakit akış tablosu oluşturur. Hangi ayda ne kadar tahsilat bekleniyor, gecikmeli ödemeler ne kadar, toplam alacak ne durumda — hepsi tek ekranda görüntülenir. Bu projeksiyon, firma yönetiminin yatırım ve harcama kararlarını hisse değil, veriye dayandırmasını sağlar.`,

  'satis-iptalleri-fesih-minimize-etme': `## NovoxCRM ile İptal Analizi ve Yönetimi

NovoxCRM'de satış iptali yapıldığında ilgili ünite otomatik olarak stoka geri döner. İptal nedeni zorunlu olarak kayıt altına alınır. Aylık iptal raporu; sebep dağılımı, danışman bazlı iptal oranı ve proje karşılaştırması kırılımlarıyla üretilir. İptal oranı belirli eşiği aştığında yöneticiye otomatik uyarı gönderilir. Bu veriler, iptal trendlerini erken tespit edip kök neden analizi yapmayı mümkün kılar.`,

  'musteri-adayi-basi-maliyet-cpl-dusurme': `## NovoxCRM ile Kanal Bazlı CPL Takibi

NovoxCRM, her reklam kanalının CPL'sini (müşteri adayı başına maliyet) otomatik hesaplar. Google Ads, Facebook, portal ilanları ve organik trafik kanallarının ayrı ayrı lead sayısı, lead kalitesi ve satışa dönüşüm oranı raporlanır. Hangi kanalın en düşük maliyetle en kaliteli müşteriyi getirdiği nesnel olarak belirlenir. Pazarlama bütçesi sezgiye değil, bu verilere dayalı olarak dağıtılır.`,

  'dijital-donusum-yol-haritasi-gayrimenkul': `## NovoxCRM ile Dijital Dönüşüm

NovoxCRM, gayrimenkul firmalarının dijital dönüşüm yolculuğunda uçtan uca çözüm sunar. Lead yönetiminden satış otomasyonuna, ödeme planı motorundan broker portalına, KVKK uyumundan gelişmiş raporlamaya kadar tüm süreçler tek platformda dijitalleştirilir. Onboarding programı ve eğitim desteğiyle geçiş süreci hızlı ve kontrollü yürütülür.`,

  'kagitsiz-ofis-paperless-gayrimenkul': `## NovoxCRM ile Kağıtsız Satış Operasyonu

NovoxCRM, satış sürecinin tüm belgelerini dijital ortamda oluşturur ve saklar. Teklif PDF'leri otomatik üretilir, sözleşmeler dijital olarak hazırlanır, e-imza ile uzaktan imzalanır. Tüm belgeler müşteri kartında arşivlenir. Fiziksel dosya ihtiyacı ortadan kalkar — hem kağıt/baskı maliyeti hem de arşiv alanı tasarrufu sağlanır.`,

  'veri-kaybi-data-loss-onleme-rehberi': `## NovoxCRM'in Veri Güvenliği Altyapısı

NovoxCRM, bulut tabanlı altyapısıyla verilerin günlük otomatik yedeklenmesini sağlar. Veriler AES-256 şifrelemeyle korunur. Felaket senaryolarında yedeklerden geri yükleme dakikalar içinde yapılır. Rol tabanlı erişim kontrolü sayesinde yetkisiz veri silme veya değiştirme engellenir.`,

  'emlak-portfoy-yonetim-yazilimi': `## NovoxCRM ile Çoklu Proje Yönetimi

NovoxCRM, birden fazla projeyi tek konsolide dashboard'dan yönetmenize olanak tanır. Her projenin stok durumu, satış hızı, tahsilat oranı ve erime süresi yan yana karşılaştırılır. Hangi projenin daha hızlı satıldığı, hangisinin iptal oranının yüksek olduğu ve hangisinin birim m² fiyatının piyasa ortalamasının üstünde olduğu nesnel olarak belirlenir.`,

  'konut-satis-pazarlama-crm-entegrasyonu': `## NovoxCRM ile Pazarlama Kanalı Entegrasyonu

NovoxCRM, Google Ads ve Facebook Lead Ads ile yerleşik entegrasyon sunar. Her kanaldan gelen lead otomatik olarak doğru kanal etiketiyle CRM'e düşer ve danışmana atanır. Aylık raporlarda kanal bazlı CPL, lead kalitesi ve satış dönüşüm oranı yan yana gösterilir. Hangi reklam kreatifinin en iyi sonucu getirdiği ölçülür ve bütçe buna göre optimize edilir.`,

  'potansiyel-musteri-yonetimi-stratejileri': `## NovoxCRM ile Lead Nurturing Otomasyonu

NovoxCRM'de potansiyel müşteriler "Soğuk/Ilık/Sıcak" olarak otomatik segmente edilir. Her segment için farklı beslenme akışları tanımlanır: eğitici içerik gönderimi, proje güncelleme bildirimleri, kişiselleştirilmiş teklifler. 30 gün sessiz kalan müşteriler otomatik reaktivasyon kampanyasına dahil edilir. Müşterinin etkileşim sıklığı arttıkça segmenti otomatik yükseltilir.`,

  'otomatik-teklif-olusturma-gayrimenkul': `## NovoxCRM'in Otomatik Teklif Motoru

NovoxCRM, daire seçimi ve ödeme planı parametreleri girildikten sonra 90 saniyede firma logolu, kurumsal tasarımlı PDF teklif üretir. Şerefiye, KDV ve vade farkı otomatik hesaplanır. Teklif WhatsApp veya e-posta ile tek tıkla gönderilir. Müşteriye aynı daire için 3 farklı ödeme senaryosu yan yana sunulabilir. Tüm teklifler müşteri kartında kronolojik olarak arşivlenir.`,

  'opsiyonlama-takibi-dijital-sistem': `## NovoxCRM ile Opsiyonlama Yönetimi

NovoxCRM'de opsiyon verildiğinde sistem geri sayım başlatır (24/48/72 saat konfigüre edilebilir). Süre dolduğunda daire otomatik "Müsait" statüsüne döner ve ilgili danışmana bildirim gider. Uzatma talebi müdür onayına yönlendirilir. Danışman başına opsiyon limiti tanımlanabilir. Aynı daireye çakışan opsiyon girişi engellenip uyarı verilir.`,

  'hatali-odeme-plani-olusturma-sorun-cozum': `## NovoxCRM'in Hatasız Ödeme Planı Motoru

NovoxCRM'de ödeme planları otomatik hesaplama motoruyla oluşturulur. KDV dahil/hariç karışıklığı ortadan kalkar — sistem dairenin KDV senaryosunu otomatik uygular. Şerefiye dahil fiyat otomatik çekilir. Taksit yuvarlama kuralları standart formüle bağlıdır. Senet tarihleri hafta sonu veya tatile denk gelirse otomatik iş gününe kaydırılır.`,

  'tapu-takip-surecleri-dijital-yonetim': `## NovoxCRM ile Tapu Süreci Takibi

NovoxCRM'de her satış için tapu belgesi kontrol listesi otomatik oluşturulur. Belge durumları (Bekleniyor/Tamamlandı/Sorunlu) takip edilir. SGK borcu sorgulama ve ipotek kontrolü hatırlatmaları otomatik gönderilir. Tapu randevu tarihi CRM takvimine işlenir. Tapu devri tamamlandığında müşteriye otomatik tebrik mesajı gider.`,

  'crm-mobil-uygulama-senkronizasyon-sorunu': `## NovoxCRM'in Mobil Erişim Yaklaşımı

NovoxCRM, responsive web tasarımıyla tablet ve telefondan tam fonksiyonel çalışır. Ayrı bir mobil uygulama kurulumu ve senkronizasyon sorunu yaşanmaz. İnternet bağlantısı olduğu her yerde güncel veriye erişilir. Danışman sahada müşteri kartına not ekleyebilir, stok görüntüleyebilir ve teklif oluşturabilir.`,

  'satis-ofisi-merkez-ofis-iletisim-kopuklugu': `## NovoxCRM ile Tek Kaynak Prensibi (SSOT)

NovoxCRM, satış ofisi, merkez ofis ve yönetim kurulu arasındaki veri kopukluğunu ortadan kaldırır. Tüm departmanlar aynı merkezi veritabanından okur ve yazar. Satış ofisinde sözleşme imzalandığı anda merkez ofisteki muhasebe ve müdür anında bilgilendirilir. Raporlar herkes için aynı formatta otomatik oluşur. Excel siloları yıkılır, **tek gerçek** oluşur.`,

  'm2-birim-fiyati-hesaplama-hatalari': `## NovoxCRM ile Standart M² Yönetimi

NovoxCRM'de her ünite için ayrı ayrı net m², brüt m² ve tapu m² değerleri tanımlanır. Fiyatlandırmada hangi m² değerinin kullanılacağı proje bazında standart olarak belirlenir. Teklif PDF'inde her iki değer gösterilir. 150 m² KDV eşiği kontrolü otomatik yapılır — eşiğin altında %1, üstünde %20 KDV doğru uygulanır.`,

  'yanlis-satis-sozlesmesi-riskleri-onlemler': `## NovoxCRM ile Sözleşme Standardizasyonu

NovoxCRM'de hukuk departmanı onaylı standart sözleşme şablonları sisteme tanımlıdır. Satış onaylandığında müşteri bilgileri ve daire detayları şablona otomatik aktarılır. Değiştirilmesi zorunlu alanlar işaretlidir. Versiyon kontrolü uygulanır — her zaman güncel ve doğru şablon kullanılır. İmza süreci dijital olarak takip edilir.`
};

// SQL Server ve API 401 gibi NovoxCRM ile doğrudan ilgisi olmayan makaleler listede yok

let content = fs.readFileSync('c:/NOVOCRM/src/data/wiki-articles-gen.ts', 'utf-8');

let count = 0;
let skipped = 0;
for (const [slug, section] of Object.entries(NOVOX_MAP)) {
  const slugRegex = new RegExp(`slug:\\s*'${slug}'`);
  if (!slugRegex.test(content)) {
    console.log(`SLUG NOT FOUND: ${slug}`);
    skipped++;
    continue;
  }
  
  const slugMatch = content.match(slugRegex);
  const slugIdx = content.indexOf(slugMatch[0]);
  const afterSlug = content.substring(slugIdx);
  const sonucIdx = afterSlug.indexOf('## Sonuç');
  if (sonucIdx === -1) {
    console.log(`SONUC NOT FOUND for: ${slug}`);
    skipped++;
    continue;
  }
  
  const betweenSlugAndSonuc = afterSlug.substring(0, sonucIdx);
  if (betweenSlugAndSonuc.includes('NovoxCRM')) {
    console.log(`ALREADY HAS NovoxCRM: ${slug}`);
    skipped++;
    continue;
  }
  
  const insertPos = slugIdx + sonucIdx;
  content = content.substring(0, insertPos) + section + '\n\n' + content.substring(insertPos);
  count++;
  console.log(`ADDED: ${slug}`);
}

fs.writeFileSync('c:/NOVOCRM/src/data/wiki-articles-gen.ts', content, 'utf-8');
console.log(`\nTOTAL ADDED: ${count}, SKIPPED: ${skipped}`);
