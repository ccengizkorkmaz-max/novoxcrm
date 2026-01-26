-- ==========================================
-- 👑 SAAS YÖNETİM ÖZELLİKLERİ
-- ==========================================

-- 1. Tenants tablosunu genişlet
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'Active', -- Active, Suspended, Trial
ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'Free', -- Free, Pro, Enterprise
ADD COLUMN IF NOT EXISTS user_limit integer DEFAULT 5, -- Maksimum kullanıcı sayısı
ADD COLUMN IF NOT EXISTS subscription_end_date timestamp with time zone;

-- 2. Varolan kayıtları güncelle
UPDATE public.tenants 
SET 
  subscription_status = 'Active',
  plan_type = 'Pro',
  user_limit = 10,
  subscription_end_date = NOW() + INTERVAL '1 year'
WHERE subscription_status IS NULL;

-- 3. RLS Politikası: Super Admin (Owner rolüne sahip ve belirli email) tüm tenantları görebilsin
-- Not: Mevcut "t_select" politikası sadece kendi tenantını görmeye izin veriyor.
-- Super Admin için yeni bir politika ekleyelim veya mevcut olanı genişletelim mi?
-- En güvenlisi: Super Admin dashboard server-side (bypass RLS) çalışacak, 
-- client-side erişim gerekirse "security definer" fonksiyonlar veya admin client kullanılacak.
-- O yüzden buraya ek bir RLS yazmaya gerek yok, admin panel server action'larda "createAdminClient" kullanacağız.
