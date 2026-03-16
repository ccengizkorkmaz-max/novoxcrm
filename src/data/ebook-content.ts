export const ebookContent = {
    title: "Gayrimenkul Projelerinde Dijital Dönüşüm Rehberi",
    subtitle: "Veri Kaybından Finansal Denetime: Satış Süreçlerinizi Nasıl Güvence Altına Alırsınız?",
    coverImage: "/images/ebook-cover.jpg",
    author: "NovoxCrm Ekibi",
    date: "Mart 2026",
    chapters: [
        {
            id: 1,
            title: "Bölüm 1: Excel Çıkmazı – Kurumsal Hafızanız Tehlikede mi?",
            content: `
                <p>Birçok gayrimenkul firması işe Excel ile başlar. Başlangıçta pratik ve maliyetsiz görünen bu "ücretsiz" araç, projeler büyüdükçe ve veri hacmi arttıkça aslında en pahalı maliyet kaleminize dönüşür.</p>
                
                <h3>Gizli Tehlike: Senkronizasyon Kaybı</h3>
                <p>"Hangi liste güncel?" sorusu satış ofisinizde her gün soruluyorsa, ciddi bir risk altındasınız demektir. Dosya sürümleri arasındaki senkronizasyon kaybı, sadece zaman kaybı değil; aynı zamanda veri sızıntısı, mükerrer satış ve hatalı fiyatlandırma risklerini de beraberinde getirir.</p>

                <h3>Personel Bağımlılığı ve Veri Güvenliği</h3>
                <p>Müşteri verileri danışmanların şahsi telefonlarında veya bilgisayarlarındaki Excel dosyalarında kaldığında, firmanızın kurumsal hafızası kişilere endeksli hale gelir. Bu durumda personel ayrılığı sadece bir çalışan kaybı değil, aynı zamanda paha biçilemez bir "veri hırsızlığı" riskidir.</p>

                <div class="tip">
                    <strong>Çözüm:</strong> Veriyi kişilerden bağımsız, 256-bit şifreleme ile korunan, bulut tabanlı ve yetkilendirme hiyerarşisi olan merkezi bir CRM sistemine taşımak.
                </div>
            `
        },
        {
            id: 2,
            title: "Bölüm 2: Finansal Denetim ve Hatasız Ödeme Planları",
            content: `
                <p>Konut satışında yapılan tek bir kuruşluk hata veya yanlış vade hesabı, sadece finansal zarar değil; aynı zamanda uzun süren hukuki süreçlere ve marka itibarının zedelenmesine yol açar.</p>

                <h3>Manuel Hesaplama Riski</h3>
                <p>Kişiye özel ödeme planları oluştururken Excel'de yapılan manuel formül hataları, nakit akışınızı (Cash Flow) doğrudan bozar. Bir projenin karlılığı, kağıt üzerindeki satış değil, tahsilatın zamanında ve doğru yapılmasıyla ölçülür.</p>

                <h3>Senet ve Tahsilat Takibi</h3>
                <p>Vadesi gelen ödemelerin, ara ödemelerin veya balon ödemelerin manuel takibi imkansızdır. Otomatik hatırlatma sistemleri olmayan firmalarda tahsilat oranları sektör ortalamasının %30 altında kalmaktadır.</p>

                <div class="note">
                    <strong>IT Perspektifi:</strong> Finansal verilerin satış verileriyle (CRM ve ERP entegrasyonu) anlık konuşması kritiktir. Çift veri girişi, hata yapma ihtimalini %40 oranında artırır.
                </div>
            `
        },
        {
            id: 3,
            title: "Bölüm 3: KVKK ve Siber Güvenlik – Görünmez Tehditler",
            content: `
                <p>Gayrimenkul sektörü, yüksek bedelli işlemler ve hassas müşteri verileri nedeniyle siber saldırganların bir numaralı hedefi haline gelmiştir.</p>

                <h3>Veri Maskeleme ve Erişim Kontrolü</h3>
                <p>Satış danışmanlarınız tüm müşteri listesini, telefon numaralarını veya ödeme tablolarını tek bir tıkla Excel olarak dışarı aktarabiliyor mu? Eğer bu sorunun cevabı evet ise, KVKK uyumunuz sadece kağıt üzerindedir.</p>

                <h3>Siber Tehdit Modeli: Phishing (Oltalama)</h3>
                <p>Kimlik avı saldırılarıyla müşteri ödeme bilgilerinin veya kurumsal şifrelerin ele geçirilmesi, firmanız için telafisi imkansız bir prestij kaybına yol açar. Bir siber saldırı sonrası güveni geri kazanmak, yeni bir konut projesi inşa etmekten daha zordur.</p>

                <ul class="requirements">
                    <li>İki Faktörlü Doğrulama (2FA/MFA) kullanımı</li>
                    <li>Düzenli Log denetimi (Audit Trail)</li>
                    <li>IP Kısıtlaması ve Rol Bazlı Erişim</li>
                </ul>
            `
        },
        {
            id: 4,
            title: "Bölüm 4: Reklam Bütçenizi Nereye Harcıyorsunuz? (ROI Analizi)",
            content: `
                <p>Pazarlamaya harcanan milyonlarca liralık bütçenin, tam olarak hangi Facebook reklamından veya hangi Google kelimesinden dönüp gerçek bir satışı (ROI) tetiklediğini biliyor musunuz?</p>

                <h3>Lead Skorlama (Aday Müşteri Puanlama)</h3>
                <p>Dijitalden gelen her aday müşteri (lead) aynı değerde değildir. Sadece "bilgi toplamak" isteyenler ile "satın almaya hazır" olanları birbirinden ayırmayan sistemler, reklam bütçenizin israfına neden olur.</p>

                <h3>Hızın Satışa Etkisi</h3>
                <p>Reklamdan gelen bir formun satış danışmanına düşme süresi 5 dakikayı geçiyorsa, o müşterinin "soğuma" veya rakip projeye yönelme ihtimali %80'dir. CRM otomasyonu, bu hızı saniyelere indirir.</p>
            `
        },
        {
            id: 5,
            title: "Bölüm 5: Geleceğin Teknolojileri (PropTech)",
            content: `
                <p>Dijital dönüşüm sadece bir yazılım kullanmak değildir; bir kurum kültürü değişimidir. Geleceği yakalamak için teknolojiye uyum sağlamak şarttır.</p>

                <h3>Low-Code Avantajı</h3>
                <p>Geleneksel yazılım süreçlerini aylarca beklemek yerine, Antigravity gibi low-code platformlarla işletmenize özel modülleri (Teknik servis takibi, VIP anket yönetimi vb.) sadece günler içinde yayına alabilirsiniz.</p>

                <h3>Yapay Zeka (AI) ve Tahminleme</h3>
                <p>Geçmiş satış verilerini kullanarak, hangi dairenin hangi fiyat aralığında ve ne kadar sürede satılacağını %90 doğrulukla tahmin etmek artık bir hayal değil. Veri, gayrimenkulün yeni altınıdır.</p>
            `
        }
    ],
    conclusion: {
        title: "Sonuç: Nereden Başlamalı?",
        text: "Dijital dönüşüm bir varış noktası değil, sürekli devam eden bir yolculuktur. İlk adım, mevcut süreçlerinizdeki 'sızıntıları' (veri kaybı, zaman kaybı, finansal hata) tespit etmek ve bunları teknoloji ile yamamaktır.",
        checklist: [
            "Müşteri verilerimiz tek bir merkezi veritabanında mı?",
            "Finansal raporlarımızı (nakit akışı, gecikmeler) gerçek zamanlı görebiliyor muyuz?",
            "Olası bir KVKK denetiminden bugün alnımızın akıyla geçebilir miyiz?",
            "Satış ekibimizin performansını (dönüşüm oranları, arama hızı) şeffafça ölçebiliyor muyuz?"
        ]
    }
};
