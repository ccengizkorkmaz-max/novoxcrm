# Novo CRM Yedekleme Kılavuzu

Bu kılavuz, Novo CRM uygulamasının ve verilerinin güvenliğini sağlamak için yapılması gereken yedekleme işlemlerini içerir.

## 1. Kod Tabanı (Source Code) Yedekleme

Uygulama kodunu korumak için en iyi yöntem bir Git servisi (GitHub, GitLab veya Bitbucket) kullanmaktır.

*   **GitHub/GitLab'a Yükleme:**
    ```bash
    git remote add origin https://github.com/kullanici_adiniz/novocrm.git
    git push -u origin main
    ```
*   **Düzenli Yedekleme:** Her önemli değişiklikten sonra `git commit` ve `git push` işlemlerini yapmayı unutmayın.

## 2. Veritabanı (Supabase) Yedekleme

Novo CRM, veritabanı olarak Supabase (PostgreSQL) kullanmaktadır.

### A. Otomatik Yedeklemeler (Supabase Paneli)
*   **Proje Ayarları > Database > Backups** yolunu izleyin.
*   Supabase, Pro plan ve üzeri için günlük otomatik yedekleme ve Point-in-Time Recovery (PITR) sunar. 
*   Ücretsiz plan kullanıyorsanız, manuel yedekleme yapmanız kritiktir.

### B. Manuel Yedekleme (pg_dump)
Yerel bilgisayarınıza tam bir SQL yedeği almak için:
```bash
pg_dump -h db.[PROJECT_REF].supabase.co -U postgres -d postgres > crm_backup.sql
```
*   `[PROJECT_REF]` kısmını Supabase proje ID'niz ile değiştirin.
*   Şifre sorulduğunda veritabanı şifrenizi girin.

## 3. Saklama Alanı (Storage) Yedekleme

`crm-images` bucket'ındaki resimleri yerel olarak yedeklemek için:

1.  Supabase Dashboard üzerinden dosyaları manuel indirebilirsiniz.
2.  VEYA Supabase CLI kullanarak senkronize edebilirsiniz:
    ```bash
    supabase storage cp -r ss:///crm-images ./backups/images
    ```

## 4. Yapılandırma Dosyaları (.env)

`.env.local` dosyası Git'e dahil edilmez (güvenlik nedeniyle). Bu dosyayı manuel olarak güvenli bir yerde (örneğin bir şifre yöneticisi veya güvenli harici disk) saklamalısınız.

> [!IMPORTANT]
> **Kritik Uyarı**: `.env.local` dosyasını kaybederseniz, Supabase bağlantı anahtarlarını ve API anahtarlarını tekrar yapılandırmanız gerekir.

## 5. Manuel Klasör Yedekleme (Dosya Snapshot)

Eğer projenin o anki halini tam bir paket olarak saklamak isterseniz, `NOVOCRM` klasörünü kopyalayabilirsiniz. Ancak gereksiz yer kaplamaması için bazı klasörleri hariç tutmanız önerilir.

*   **Kopyalanması GEREKENLER:**
    *   `src/`, `public/`, `supabase/`, `messages/` (Tüm kaynak kod ve ayarlar)
    *   `package.json`, `package-lock.json`
    *   **Kritik:** `.env.local` (Bu dosya git'e yüklenmez, mutlaka manuel yedeklenmeli)
*   **Kopyalanması GEREKMEYENLER (Silebilirsiniz):**
    *   `node_modules/` (Çok büyüktür, `npm install` ile her zaman geri gelir)
    *   `.next/` (Build dosyalarıdır, `npm run build` ile tekrar oluşur)

> [!TIP]
> Klasörü bir `.zip` dosyası haline getirip Google Drive, iCloud veya harici bir diske taşımak, hızlı bir "çevrimdışı" yedekleme yöntemidir.

## 6. Yedekleme Takvimi Önerisi

| Veri Tipi | Yöntem | Sıklık |
| :--- | :--- | :--- |
| **Kod** | Git Push | Her geliştirme sonrası |
| **Veritabanı** | pg_dump / Otomatik | Günlük |
| **Resimler** | Manuel/CLI | Haftalık |
| **Yapılandırma**| Manuel | Sadece değiştiğinde |

---
*Hazırlayan: Antigravity AI*
