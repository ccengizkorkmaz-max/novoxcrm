# Novo CRM - Gelişmiş AI Satış Asistanı Dokümantasyonu

Bu belge, Novo CRM içerisine entegre edilen yapay zeka (AI) destekli Satış Danışmanı modülünün teknik yeteneklerini, davranış kurallarını ve arka planda çalışan gizli sistem komutlarını açıklar.

## 1. Temel Karakter ve Davranış (Persona)
Asistan, kendini asla bir "Yapay Zeka" veya "Sanal Asistan" olarak tanıtmaz. Sisteme gömülü olan kurallar şunlardır:
* **Kimlik:** Profesyonel gayrimenkul satış danışmanı.
* **Yasaklı Kelimeler:** Yapay zeka, dil modeli, asistan, AI.
* **Üslup:** Samimi, doğal, akıcı ve çözüm odaklı. Müşteri bir şey sorduğunda doğrudan konuya girer, insan olduğunu kanıtlamaya çalışan garip tepkiler vermez.

## 2. Dinamik CRM Envanter Bilinci
AI, havadan veya uydurma verilerle konuşmaz. Her mesajlaşma döngüsünde arka planda çalışan bir `getTenantCrmContext` fonksiyonu devreye girer:
* Sistemde **Durumu "Active"** olan projeleri (Ad, Şehir, İlçe, Sosyal Olanaklar bilgileriyle) çeker.
* Bu projelere ait **Durumu "Müsait / Available / Reserved"** olan daire tiplerini (1+1, 2+1 vb.), fiyatlarını ve adetlerini çeker.
* Bu güncel portföyü AI'a "Sadece bu elimizdeki projeleri sat" emriyle besler.

### ⚠️ Mevcut Sınırlamalar (Scaling Limitleri)
| Parametre | Mevcut Limit | Dosya | Satır |
|---|---|---|---|
| Proje sayısı (AI'a beslenen) | **10 proje** | `route.ts (whatsapp)` | `getTenantCrmContext` → `.limit(10)` |
| Ünite sayısı (AI'a beslenen) | **100 ünite** | `route.ts (whatsapp)` | `getTenantCrmContext` → `.limit(100)` |
| Mesaj geçmişi (chat context) | **20 mesaj** | `route.ts (whatsapp)` | Satır ~107 → `.limit(20)` |

> **Gelecek Notu:** Proje ve envanter sayısı arttıkça bu limitler yetersiz kalacaktır. Çözüm olarak:
> 1. **RAG (Retrieval Augmented Generation):** Tüm envanter vektör veritabanına (pgvector/Pinecone) yüklenir, müşterinin sorusuna en alakalı 5-10 proje/ünite semantik arama ile bulunup AI'a verilir. Böylece 1000+ proje olsa bile sadece ilgili olanlar gönderilir.
> 2. **Fonksiyon Çağırma (Function Calling):** AI'a "search_projects(city, budget, type)" gibi araçlar tanımlanır, AI kendisi hangi projeyi çekmek istediğine karar verir.
> 3. **Asistan Başına Proje Atama:** Her AI asistanı belirli projelere atanır, sadece kendi projelerini bilir.

## 3. Akıllı Lead (Müşteri Adayı) Kalifikasyonu
Asistanın temel amacı sohbeti sürdürmek değil, **satış fırsatı (Lead)** yaratmaktır. Sohbet sırasında doğal akışı bozmadan şu bilgileri toplamaya çalışır:
* Müşterinin Adı ve Soyadı
* İlgilendiği bölge veya proje
* Bütçe aralığı
* Satın alma amacı (Yatırım mı, oturum mu?)

## 4. Görünmez Sistem Komutları (Hidden JSON Flags)
AI, müşteriye düz metin dönerken, sistemin arka yüzüne sadece CRM sisteminin okuyabileceği gizli etiketler (komutlar) gönderir.

### A. Otomatik Müşteri Kaydı Oluşturma
AI yeterli bilgiyi topladığı an, yanıtının en sonuna şu formatta bir gizli komut ekler:
\`\`\`json
[LEAD_DATA: {"first_name": "Ahmet", "last_name": "Yılmaz", "phone": "90555...", "notes": "Bütçesi 5M, İstanbul'da 2+1 arıyor"}]
\`\`\`
**Sistem Tepkisi:** Bu komut algılandığında metin müşteri ekranından gizlenir ve veritabanındaki `customers` tablosuna otomatik olarak "Lead" statüsünde yeni bir kayıt açılır.

### B. 🔥 Acil Satış (Hot Lead) Radarı
Eğer müşteri "*Hemen almak istiyorum*", "*Bugün kaparo verebilirim*", "*Acil dönüş yapın*" gibi çok yüksek satın alma sinyalleri verirse, AI yanıtının sonuna şunu ekler:
\`\`\`text
[HOT_LEAD]
\`\`\`
**Sistem Tepkisi:** Bu etiket algılandığında, `activities` tablosuna anında **"🔥 ACİL SATIŞ (HOT LEAD)"** başlıklı ve "Yüksek (High)" öncelikli bir Görev/Bildirim açılır. Satış yöneticileri bu sıcak satışı anında görüp müdahale edebilir.

## 5. Model Yedekleme Sistemi (Fallback Mechanism)
Yapay zeka altyapısında yaşanabilecek API key veya model eskimesi sorunlarına karşı sistem dayanıklıdır. 
Eğer varsayılan model (`gemini-2.5-flash`) hata verirse, sistem otomatik olarak diğer güncel/aktif modellere istek atarak (`gemini-2.5-pro` vb.) müşterinin kesinlikle cevapsız kalmamasını sağlar.

## 6. API Anahtarı Güvenliği
* API anahtarları **asla** kaynak koduna (Git) yazılmaz.
* Anahtarlar iki yerde tutulur: **Vercel Environment Variables** (ortam değişkeni) ve **Supabase `tenants` tablosu** (veritabanı).
* Tüm AI route'ları önce veritabanından anahtarı okur, bulamazsa ortam değişkenine düşer.
* `scratch/` klasörü `.gitignore` içindedir, test dosyaları GitHub'a asla gitmez.

## 7. 🚀 Gelecek Yol Haritası (Roadmap)
- [ ] **RAG Entegrasyonu:** pgvector ile semantik proje/envanter araması
- [ ] **Function Calling:** AI'ın CRM veritabanını doğrudan sorgulayabilmesi
- [ ] **Çoklu Asistan Desteği:** Her proje veya bölge için ayrı AI asistanı
- [ ] **Sesli Asistan (Live Audio):** `gemini-3.1-flash-live` modeli ile gerçek zamanlı sesli müşteri görüşmesi
- [ ] **Otomatik Randevu:** AI'ın takvimden uygun saat bulup randevu oluşturması
- [ ] **Çok Dilli Destek:** İngilizce, Arapça, Rusça müşteriler için otomatik dil algılama

