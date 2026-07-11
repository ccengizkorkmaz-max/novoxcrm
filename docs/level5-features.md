# NovoCRM — Level 5 Otonom Satış Makinası 🚀

> **Gayrimenkul sektörünün ilk ve tek otonom AI satış sistemi.**
> Maya AI, müşterileri arar, analiz eder, en iyi kanalı seçer, A/B test yapar ve kendi kendini optimize eder.

---

## 🏗️ Mimari Özet

NovoCRM'in AI satış sistemi 3 fazda, 9 özellikle inşa edilmiştir:

| Faz | Hedef | Özellikler |
|-----|-------|-----------|
| **Faz 1** | Hızlı Kazanımlar | Cooldown, Arama Zamanı, Konuşma Zekası |
| **Faz 2** | Akıllı Optimizasyon | AI Scoring, A/B Test, Kanal Optimizasyonu |
| **Faz 3** | Otonom Yetenekler | Revenue Attribution, Segment Önerileri, Self-Learning |

---

## 📋 Özellik Detayları

### 1. 🛡️ Cooldown & Fatigue Yönetimi
**Sorun:** Aynı müşteriyi tekrar tekrar aramak rahatsızlık yaratır.
**Çözüm:** Haftalık arama limiti + günlük cooldown süresi otomatik uygulanır.
- Ayarlanabilir limitler (Ayarlar → AI Modül)
- Sistem otomatik olarak limitine ulaşan müşterileri atlar
- Cooldown banner'ı ile görünürlük

### 2. ⏰ Arama Zamanı Analizi
**Sorun:** Yanlış saatte arama = cevapsız arama.
**Çözüm:** Son 30 günün verisiyle en etkili arama saatlerini keşfedin.
- Saat bazlı cevap oranları (heatmap)
- Altın saatler tespiti
- Hafta içi vs hafta sonu karşılaştırma

### 3. 🧠 Conversation Intelligence
**Sorun:** Yüzlerce arama transkriptini insanlar analiz edemez.
**Çözüm:** GPT-4o-mini tüm transkriptleri analiz eder.
- En çok sorulan sorular
- İtiraz trendleri
- Duygu analizi ve ton takibi
- Script iyileştirme önerileri

### 4. 🎯 AI Lead Scoring (Prediktif 0-100)
**Sorun:** Hangi lead gerçekten alacak? İnsan sezgisi yetersiz.
**Çözüm:** GPT-4o her müşteriyi 0-100 arası puanlar.

**Analiz Edilen Veriler:**
- 📞 Arama geçmişi (cevaplama, süre, sonuç)
- 💬 WhatsApp cevap oranı
- 📅 Randevu geçmişi
- 🏠 Proje ilgisi ve talepleri
- ⏱️ CRM'deki aktivite yoğunluğu

**Görünüm:**
- CRM müşteri kartında renkli skor dairesi (🟢70+ / 🟡40-69 / 🔴0-39)
- Pipeline listesinde 🧠 badge
- Sinyaller listesi + aksiyon önerisi + en iyi arama zamanı

### 5. 🔬 A/B Script Test Sistemi
**Sorun:** Hangi arama senaryosu daha etkili? Tahminle karar veriyorsunuz.
**Çözüm:** İki scripti bilimsel olarak karşılaştırın.

**Nasıl Çalışır:**
1. Script Manager'da iki script seçin → "A/B Test Başlat"
2. Sistem otomatik %50/%50 dağıtır
3. Canlı performans takibi: arama sayısı, cevaplama oranı, randevu oranı
4. "A Kazandı" veya "B Kazandı" → tek tıkla aktifleştir

### 6. ⚡ Otomatik Kanal Seçimi (AI)
**Sorun:** Bir müşteri telefonu açıyor, diğeri WhatsApp'tan cevap veriyor.
**Çözüm:** AI her müşteri için en etkili kanalı otomatik seçer.

**Mantık:**
- Müşteri geçmişindeki kanal cevap oranları analiz edilir
- En yüksek response rate'e sahip kanal otomatik seçilir
- Yeterli veri yoksa → AI telefon araması (default)
- Workflow Builder'da "✨ Otomatik Kanal Seç (AI)" step olarak eklenir

### 7. 💰 Revenue Attribution
**Sorun:** Maya kaç satışa katkı sağladı? ROI nedir?
**Çözüm:** Her satışın arkasındaki outreach yolculuğunu takip eder.

**Metrikler:**
- **Toplam Gelir** — Son 6 ayın satış tutarı
- **Maya Katkılı Gelir** — Maya'nın aramasından sonra kapanan satışlar
- **Katkı Oranı** — Maya'lı satışların yüzdesel payı
- **Ort. Kapanış Süresi** — Lead → Satış (gün)
- **Ort. Dokunma Sayısı** — Satış öncesi etkileşim sayısı

**Kanal Dağılımı:** AI Arama vs WhatsApp vs Doğrudan satış gelir karşılaştırması
**Satış Timeline:** Her satışın kaynak → arama → WA → randevu → satış yolculuğu

### 8. 🤖 Otomatik Segment Önerileri
**Sorun:** CRM'de fırsat var ama kimse fark etmiyor.
**Çözüm:** AI proaktif olarak aksiyon gerektiren segmentleri tespit eder.

**5 Otomatik Algılama:**
| Segment | Açıklama | Önerilen Aksiyon |
|---------|----------|-----------------|
| 🔇 Sessiz Lead'ler | 2+ hafta etkileşimsiz | Re-engagement kampanyası |
| 🔥 Yüksek Skorlu | AI skoru 60+ ama aranmamış | Acil AI arama |
| 📞 Cevapsız Aramalar | Telefonu açmamışlar | Farklı saatte tekrar dene |
| 💬 WA Cevap Verenler | WhatsApp'a yanıt verdi | Sıcak lead — hemen ara |
| ⏰ Yaşlanmış Lead | 30+ gün pipeline'da | Özel teklif kampanyası |

Her öneri: müşteri sayısı + tahmini etki + "Başlat" butonu

### 9. 🧬 Self-Learning Script Engine
**Sorun:** Arama scripti bir kez yazılıyor, optimize edilmiyor.
**Çözüm:** Sistem başarılı aramaların kalıplarını analiz edip prompt'u otomatik iyileştirir.

**Nasıl Çalışır:**
1. Randevu alınan (başarılı) aramaların transkriptlerini toplar
2. Başarısız aramalarla karşılaştırır
3. Kalıpları çıkarır:
   - ✅ Soru sormak dönüşümü artırıyor
   - ✅ İsimle hitap etkili
   - 💡 Fiyat bilgisi önce değil, sonra verilmeli
   - ✅ WhatsApp/katalog teklifi yapılmalı
4. Mevcut prompt'u iyileştirme önerisi sunar
5. "Bu Prompt'u Uygula" → tek tıkla aktifleştir

---

## 🗺️ Erişim Haritası

```
├── Ayarlar
│   └── AI Modül → Cooldown & Fatigue ayarları
│
├── Raporlar
│   ├── Arama Zamanı Analizi → Altın saatler
│   ├── Konuşma Zekası → Transkript analizi
│   ├── Revenue Attribution → Maya katkı ölçümü
│   └── Self-Learning Script → Prompt iyileştirme
│
├── CRM
│   ├── Müşteri Kartı → AI Lead Score widget (0-100)
│   └── Pipeline Listesi → 🧠 AI skor badge
│
└── Outreach
    ├── Dashboard → 🤖 AI Önerileri paneli
    ├── Script Manager → A/B Test başlat/takip
    └── Workflow Builder → "✨ Otomatik Kanal Seç (AI)" step
```

---

## 🏆 Rekabet Avantajı

| Özellik | Geleneksel CRM | NovoCRM Level 5 |
|---------|---------------|-----------------|
| Lead önceliklendirme | Manuel | AI 0-100 Scoring |
| Kanal seçimi | Sabit workflow | AI otomatik |
| Script optimizasyonu | Tahminle | A/B Test + Self-Learning |
| Gelir takibi | Sadece toplam | Attribution + ROI |
| Kampanya önerisi | İnsan analizi | AI proaktif öneri |
| Cooldown yönetimi | Manuel | Otomatik fatigue koruması |

---

## 📊 Teknik İstatistikler

| Metrik | Değer |
|--------|-------|
| Toplam yeni dosya | ~25 |
| Toplam yeni kod satırı | ~5,000+ |
| TypeScript hata | 0 |
| Faz sayısı | 3 |
| Özellik sayısı | 9 |
| AI modeli | GPT-4o / GPT-4o-mini |
| Ses modeli | ElevenLabs turbo_v2_5 |
| Arama altyapısı | Vapi + Twilio |

---

*NovoCRM © 2026 — Gayrimenkul Sektörünün Otonom AI Satış Makinası*
