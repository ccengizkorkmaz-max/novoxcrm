# NovoCRM — Altyapı & Entegrasyon Notları

> Son güncelleme: 5 Haziran 2026

---

## 📞 Telefon / SIP / Vapi Yapılandırması

### Numara
- **DID:** +90 212 909 95 59
- **Sağlayıcı:** Netgsm (SIP Trunk)
- **Vapi Phone ID:** `d5e02cd8-7521-4fcc-9047-3a6f2f085d02`

### SIP Bilgileri (DB: tenants tablosu)
- **SIP Kullanıcı:** `2129099559`
- **SIP Şifre:** DB'de `netgsm_sip_password` alanında
- **SIP Gateway:** `sip.netgsm.com.tr` (Port 5060)

### Vapi Webhook
- **URL:** `https://novocrm-ccengizkorkmaz-project.vercel.app/api/webhooks/vapi`
- **Secret Header:** `x-vapi-secret: NovoCrmWebhookPass2026!`
- **Neden `www.novoxcrm.com` değil?** Cloudflare bot koruması Vapi IP'lerini engelliyor (403).
  Doğrudan Vercel URL'si Cloudflare'ı bypass eder.
- **⚠️ DİKKAT:** Bu URL Vercel projesine bağlıdır ve proje adı/scope değişmedikçe sabit kalır.
  Eğer ileride Cloudflare WAF'ta `/api/webhooks/*` için whitelist kuralı eklerseniz,
  URL'yi `https://www.novoxcrm.com/api/webhooks/vapi` olarak geri alabilirsiniz.

### Gelen Arama Akışı
```
Müşteri → 0212 909 95 59 → Netgsm SIP → Vapi SIP Gateway
→ Vapi "assistant-request" webhook → CRM Webhook
→ Dinamik asistan config (Çiçek/Mert, Türkçe) → AI Karşılama
```

### Giden Arama Akışı
```
CRM Dashboard → Vapi API (makeOutboundCall)
→ Vapi → Netgsm SIP Trunk → Müşteri telefonu
→ AI Konuşma → end-of-call-report webhook → CRM'e kayıt
```

---

## 🌐 Domain & DNS

### Domainler
- **Ana:** `www.novoxcrm.com` (Cloudflare DNS → Vercel)
- **Redirect:** `novoxcrm.com` → `www.novoxcrm.com` (307)
- **Alt tenant:** `oikoscrm.com` (ayrı tenant)

### Cloudflare Notları
- Bot Fight Mode veya WAF kuralları webhook POST isteklerini engelleyebilir
- Webhook servisleri (Vapi, WhatsApp, Make.com) için ya:
  - Cloudflare'da WAF exception ekleyin, veya
  - Doğrudan Vercel URL kullanın (şu anki çözüm)

---

## 🔑 Kritik Env Variables (Vercel Dashboard)

| Variable | Açıklama |
|----------|----------|
| `VAPI_API_KEY` | Vapi API anahtarı |
| `VAPI_PHONE_NUMBER_ID` | `d5e02cd8-7521-4fcc-9047-3a6f2f085d02` (0212 BYO) |
| `VAPI_ASSISTANT_ID` | Varsayılan asistan (outbound için) |
| `VAPI_WEBHOOK_SECRET` | `NovoCrmWebhookPass2026!` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin erişimi |
| `WHATSAPP_ACCESS_TOKEN` | Meta WhatsApp API |
| `ELEVENLABS_API_KEY` | Ses sentezi |

---

## 💾 Yedekleme

- **Script:** `scratch/full_backup.js`
- **Konum:** `backups/YYYY-MM-DD/`
- **Kapsam:** 34+ tablo, env dosyaları, storage manifest
- **Çalıştırma:** `node scratch/full_backup.js`
- **NOT:** `backups/` klasörü `.gitignore`'da, repo'ya girmez

---

## 🛡️ Güvenlik Notları

- Vercel Deployment Protection **kapatıldı** (webhook'lar için gerekli)
- Webhook güvenliği uygulama seviyesinde sağlanıyor:
  - Vapi: `x-vapi-secret` header
  - WhatsApp: `WHATSAPP_VERIFY_TOKEN`
  - Cron: Vercel cron secret
