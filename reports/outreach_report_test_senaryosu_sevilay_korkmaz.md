# Outreach Kampanya ve Kişi Bazlı İşlem Raporu

**Rapor Tarihi:** 26.05.2026 16:37:48 (TSİ)
**Kampanya Adı:** Test Senaryosu: Sevilay Korkmaz
**Kampanya ID:** `7dec09db-d15d-48d9-b23c-f3f2edc1650b`
**Durum:** 🟢 Aktif
**Hedef Günlük Limit:** 100 arama / gün

## 1. Kampanya Akış Adımları (Workflow Steps)

Kampanya kapsamındaki sıralı akış adımları ve kuralları:

| Adım Sırası | Adım Adı | Kanal / Eylem | Açıklama | Tekrar Arama Denemesi (Retry) |
| :---: | :--- | :--- | :--- | :--- |
| **Adım 1** | AI Kişiselleştirme | `ai_personalize` | WhatsApp Mesajı gönderilir | Hayır |
| **Adım 2** | Proje Kontrolü | `condition` | WhatsApp Mesajı gönderilir | Hayır |
| **Adım 3** | WhatsApp (Panorama) | `whatsapp` | WhatsApp Mesajı gönderilir | Hayır |
| **Adım 4** | WhatsApp (Genel) | `whatsapp` | WhatsApp Mesajı gönderilir | Hayır |

---

## 2. Genel Kampanya İstatistikleri

| Durum | Toplam Kişi Sayısı | Açıklama |
| :--- | :---: | :--- |
| **Toplam Segment** | **1** | Kampanya kapsamındaki toplam kişi adedi |
| **Arama Sırasında Bekleyen (Aktif)** | **0** | Arama sırası gelmiş, aranacak kişiler |
| **Bekleme Aşamasında (Waiting)** | **0** | Adımlar arası bekleme süresi içerisinde olanlar |
| **Durdurulan (Stopped)** | **0** | Akışı tamamlanmadan durdurulan veya max denemeye ulaşanlar |
| **Tamamlanan (Completed)** | **1** | Akışı sonuna kadar başarıyla bitirenler |
| **Dönüşüm Sağlanan (Converted)** | **0** | Çiçek AI ile konuşup olumlu dönüş yapanlar (Nitelikli) |

---

## 3. Kişi Bazlı Canlı İşlem Günlüğü (Tüm Aramalar)

Gerçekleştirilen tüm çağrı ve işlem kayıtlarının detayları aşağıda listelenmiştir. Konuşma gerçekleşen kişilerin transkript ve özet detayları da rapora dahil edilmiştir.

| # | Zaman (TSİ) | Müşteri Adı | Telefon | Kanal | Sonuç / Durum | Süre | Özet / Konuşma Detayı |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | 25.05.2026 17:28:21 | **Sevilay Korkmaz** | `5335914389` | `whatsapp` | `sent` | - | - |
| 2 | 25.05.2026 17:27:20 | **Sevilay Korkmaz** | `5335914389` | `whatsapp` | `sent` | - | - |
| 3 | 25.05.2026 17:26:22 | **Sevilay Korkmaz** | `5335914389` | `condition` | `sent` | - | - |
| 4 | 25.05.2026 17:25:57 | **Sevilay Korkmaz** | `5335914389` | `ai_personalize` | ❌ Hata/Başarısız | - | `Hata:` fetch failed |
| 5 | 05.05.2026 12:26:58 | **Sevilay Korkmaz** | `5335914389` | `whatsapp` | ❌ Hata/Başarısız | - | `Hata:` Authentication Error |
| 6 | 05.05.2026 11:29:12 | **Sevilay Korkmaz** | `5335914389` | `whatsapp` | 🔴 Cevapsız | - | `Hata:` Call timed out (no webhook response) |
| 7 | 05.05.2026 11:29:04 | **Sevilay Korkmaz** | `5335914389` | `condition` | 🔴 Cevapsız | - | `Hata:` Call timed out (no webhook response) |
| 8 | 05.05.2026 11:28:58 | **Sevilay Korkmaz** | `5335914389` | `ai_personalize` | 🔴 Cevapsız | - | `Hata:` Call timed out (no webhook response) |
