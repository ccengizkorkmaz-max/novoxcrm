-- ==========================================
-- 🚀 GELİŞMİŞ RAPORLAMA MİGRASYONU
-- ==========================================

-- 1. Unitlere Teslim Tarihi Ekle
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMP WITH TIME ZONE;

-- 2. Satışlara KDV Alanları Ekle
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS vat_rate NUMERIC DEFAULT 20,
ADD COLUMN IF NOT EXISTS vat_amount NUMERIC DEFAULT 0;

-- 3. Satış Durumlarına İptal ve Devir Desteği (Mevcut status text olduğu için kısıtlama yoksa sorun yok)
-- Not: Status text olduğu için uygulama düzeyinde yönetilecek.

-- 4. Örnek Veri Güncelleme (Rastgele teslim tarihleri ve KDV hesaplama)
UPDATE public.units 
SET delivery_date = CURRENT_DATE + (random() * 730 || ' days')::interval -- 2 yıl içine yayılmış teslimler
WHERE delivery_date IS NULL;

UPDATE public.sales
SET vat_amount = (final_price * vat_rate / (100 + vat_rate)) -- İç KDV hesaplama
WHERE vat_amount = 0 AND final_price > 0;
