# 🤖 Make.com Otomasyon Geliştirici Arayüzü & Optimizasyon Kılavuzu

Bu kılavuz, **Antigravity (AI Kod ve Otomasyon Asistanınız)** olarak Make.com hesabınızdaki senaryoları yönetme, yenilerini oluşturma, hataları giderme ve **kredi (operation) tüketimini %90'a varan oranda azaltma** yeteneklerimi ve çalışma prensiplerimi tanımlar.

Sağladığınız Make API Key (`c208dab9-4f83-4bb6-94b7-3811c3e09628`) güvenli bir şekilde entegre edilmiştir. Artık doğrudan Make API'leri üzerinden aşağıdaki işlemleri gerçekleştirebilecek durumdayım.

---

## 🚀 Sahip Olduğum Yetenekler

1. **Yeni Senaryo Oluşturma:** Facebook Ads, Supabase, WhatsApp, Google Sheets veya E-posta entegrasyonlarını içeren sıfırdan senaryo şablonları tasarlayabilir ve bunları API üzerinden doğrudan Make hesabınızda oluşturabilirim.
2. **Hata Tespiti ve Giderme:** Çalışmayan, hata veren veya duran senaryolarınızın hata günlüklerini (logs) ve modül yapılarını API'den çekip analiz ederek hataları otomatik olarak düzeltebilirim.
3. **Kredi / İşlem (Operation) Optimizasyonu:** Senaryolarınızın gereksiz çalışmasını engelleyecek, Make paketinizin kotasını koruyacak mimari değişiklikleri doğrudan uygulayabilirim.

---

## ⚡ Make.com Kredi (Operation) Optimizasyonu Altın Kuralları

Make.com'da harcanan her bir adım (modül çalışması) 1 kredi tüketir. Kredilerinizi korumak için uygulayacağım optimizasyon standartları şunlardır:

### 1. Polling (Sorgulama) Yerine Webhook (Anlık) Kullanımı (En Önemli Kural)
* **Kötü Yöntem (Sorgulama):** Facebook Ads veya Supabase modülünü "her 15 dakikada bir sorgula" şeklinde ayarlamak. Günde 96 kez çalışır. Aday gelmese bile ayda **2.880 kredi** boş yere harcanır.
* **İyi Yöntem (Webhook):** Facebook "Watch Leads (Instant)" veya Supabase Webhook modüllerini kullanmak. Sistem sadece aday geldiğinde tetiklenir. Aday yoksa **0 kredi** harcanır.

### 2. Formüller İçin Ek Modül Kullanmamak (0 Kredi Maliyeti)
* **Kötü Yöntem:** Metin birleştirmek, tarih formatlamak veya JSON ayrıştırmak için araya ekstra "Set Variable", "Tools" veya "Text Parser" modülleri koymak. Her biri +1 kredi harcar.
* **İyi Yöntem:** Make'in kendi içinde sunduğu gömülü fonksiyonları (`join()`, `split()`, `formatDate()`, `parseDate()`, `ifempty()`) doğrudan hedef modülün içine yazmak. Bu işlem **0 kredi** harcar.

### 3. Erken Filtreleme (Early Filtering)
* Filtreleri akışın olabildiğince başına koymak. Eğer bir aday elenecekse (elemeli form), bu filtre Facebook modülünden hemen sonra çalışmalıdır. Böylece elenen adaylar için sonraki modüller (CRM API'ye yazma, WhatsApp gönderme) tetiklenmez ve kredi harcanmaz.

### 4. Akıllı Hata Yönetimi (Error Handlers)
* `Resume`, `Ignore` veya `Commit` modülleriyle hata yollarını yöneterek, bir hata durumunda senaryonun tekrar tekrar çalışıp kredi tüketmesini engellemek.

---

## 💬 Bana Verebileceğiniz Make.com Talimatları

Artık benden doğrudan şu şekilde görevler isteyebilirsiniz:

* **Yeni Senaryo İsteği:** *"Make: Facebook'taki Kocaeli formunu CRM'e bağlayan anlık (Instant) bir senaryo yarat."*
* **Optimizasyon İsteği:** *"Make: ID 4998033 olan Kocaeli elemeli senaryosunu kredi tasarrufu sağlayacak şekilde optimize et."*
* **Hata Çözme İsteği:** *"Make: ID 5976149 numaralı senaryoda dün gerçekleşen hataları analiz et ve düzelt."*

---

### 🛠️ Kocaeli Senaryolarınız İçin İlk Optimizasyon Önerim:
Şu an pasif olan `Kocaeli , RETRIVALs elemeli INSTANT` (ID: `5976149`) senaryonuzu **gerçekten anlık çalışan ve 0 boş işlem tüketen** bir yapıya kavuşturmamı ister misiniz? Onaylarsanız API üzerinden senaryonuzu anında yeniden yapılandırabilirim!
