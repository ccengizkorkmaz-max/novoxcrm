# NovoCRM — Arsa ve Arazi Projeleri Satışı Ön Analiz Raporu

Bu rapor, NovoCRM sisteminin **Nef Arsa, Arsavev** ve benzeri arsa/arazi geliştirme ve satış projelerini yönetebilmesi için gereken modüler, veri tabanı ve ön yüz geliştirmelerinin ön analizini içerir.

---

## 1. Temel Felsefe ve Mimari Yaklaşım

Sistemin esnekliğini korumak ve mevcut teklif, satış pipeline, ödeme planı hesaplama, RLS (veri izolasyonu) ve sözleşme modüllerini sıfırdan yazmamak adına **Ortak Envanter (Polimorfik) Yapısı** benimsenmiştir. 

Buna göre:
* **Projeler (Projects)** bazında proje kategorisi (Konut/Arsa/Ticari) tanımlanır.
* **Üniteler (Units)** tablosu genişletilerek konut ve arsa üniteleri aynı tabloda tutulur. Ön yüz, seçilen proje tipine göre formları dinamik olarak şekillendirir.

---

## 2. Veri Tabanı Şema Değişiklikleri (Öneri)

### A. `projects` Tablosu
Proje seviyesinde projenin arsa mı konut mu olduğunu belirten bir alan eklenir:
```sql
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_type text NOT NULL DEFAULT 'residence'
CONSTRAINT projects_project_type_check CHECK (project_type IN ('residence', 'land', 'commercial'));
```

### B. `units` Tablosu
Mevcut üniteler tablosuna arsa projelerinde kullanılmak üzere isteğe bağlı (nullable) alanlar eklenir:
```sql
ALTER TABLE units 
  ADD COLUMN IF NOT EXISTS ada_no text,
  ADD COLUMN IF NOT EXISTS parsel_no text,
  ADD COLUMN IF NOT EXISTS pafta_no text,
  ADD COLUMN IF NOT EXISTS land_area_m2 numeric(10,2),
  ADD COLUMN IF NOT EXISTS zoning_status text, -- İmar Durumu (Konut, Ticari, Tarım vb.)
  ADD COLUMN IF NOT EXISTS infrastructure_info jsonb DEFAULT '{}'::jsonb; -- Elektrik, su, yol checkbox durumları
```

---

## 3. Ön Yüz (UI) Dinamik Davranışları

### A. Proje Tanımlama Ekranı
Yönetici yeni bir proje oluştururken **Proje Tipi (Konut / Arsa / Ticari)** seçimi yapar.

### B. Parsel (Ünite) Giriş Ekranı (Dinamik Form)
Seçilen projenin tipine göre ünite ekleme formu ön yüzde otomatik değişir:
* **Konut Projeleri İçin:** Blok No, Kat No, Oda Sayısı (1+1, 2+1 vb.), Brüt M², Net M², Cephe.
* **Arsa Projeleri İçin:** Ada No, Parsel No, Pafta No, Net Arsa Alanı (M²), İmar Durumu (Emsal, Gabari, TAKS), Altyapı Kontrol Listesi (Yol, Su, Elektrik, Doğalgaz var/yok onay kutuları).

---

## 4. Özel Arsa Satış Modülleri

### A. Coğrafi Bilgi Sistemi (GIS) & Harita Entegrasyonu
* **TKGM Parsel Sorgu Entegrasyonu:** Teklif hazırlama ve müşteri kartı ekranlarında, ada/parsel bilgisi girildiğinde parselin uydudan canlı konumunu ve resmi sınırlarını gösteren bir harita widget'ı.
* **Etkileşimli Vaziyet Planı (GeoJSON):** Parselasyon haritasının (GeoJSON/KML sınır dosyaları) sisteme yüklenmesi. Harita üzerinde dolu/boş parsel takibi ve tıklanan parsel üzerinden teklif hazırlama.

### B. Ortak Alan Hakları & "Foldland" Takibi
Satın alınan her parselin sözleşmesine ve CRM kaydına bağlı ortak alan haklarının (sinema odası, at çiftliği, misafir evi vb. ortak alan payları) ve bakım aidat paylarının takibi.

### C. Takas (Barter) Yönetim Modülü
Arsa satışlarında çok yaygın olan araç takas tekliflerini yönetmek için:
* Müşteriden araç detaylarını (Marka, Model, KM, Hasar Durumu, Tramer) alan form.
* Satış yöneticisi onayına düşen "Takas Fiyatlama & Onay" süreci.

---

## 5. Mevcut Entegrasyonların Kazanımları

Bu polimorfik yapı sayesinde:
1. **Teklif & Sözleşme Motoru (Proposal Engine):** Sıfır kod değişimiyle çalışır. Sadece şablondaki "Daire Tipi" yerine "Arsa Özellikleri ve Ada/Parsel" parametreleri yazdırılır.
2. **Ödeme Planı Hesaplayıcı:** Senet şablonları, vade farkları ve taksit tabloları (arsa projelerindeki 24-60 ay vadeler dahil) mevcut altyapıyla entegre çalışır.
