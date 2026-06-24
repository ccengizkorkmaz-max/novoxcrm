-- ============================================================
-- NOVOCRM - Supabase Query Performance Optimizasyonu
-- Toplam DB süresinin %30+'ını Realtime tüketiyor
-- Geri kalan %40+'ını aşağıdaki 7 query tüketiyor
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. REALTIME SORUNU (%37.7 toplam DB süresi)
-- 2.1M+ çağrı yapıyor. Gereksiz tabloları dinliyorsanız kapatın.
-- Supabase Dashboard → Database → Replication → Realtime'dan
-- sadece gerçekten gereken tabloları aktif edin.
-- ──────────────────────────────────────────────────────────────

-- ──────────────────────────────────────────────────────────────
-- 2. ACTIVITIES TABLOSU - ILIKE araması (276ms ortalama, %6.1)
-- customer_id + type + description ILIKE + created_at filtresi
-- ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_activities_customer_type_created 
ON activities (customer_id, type, created_at DESC);

-- description ILIKE için pg_trgm kullan
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_activities_description_trgm 
ON activities USING gin (description gin_trgm_ops);

-- ──────────────────────────────────────────────────────────────
-- 3. CUSTOMERS TABLOSU - Phone ILIKE araması (273ms ortalama, %4.6)
-- ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_customers_phone_trgm 
ON customers USING gin (phone gin_trgm_ops);

-- Tenant bazlı müşteri listesi (894ms ortalama!)
CREATE INDEX IF NOT EXISTS idx_customers_tenant_created 
ON customers (tenant_id, created_at DESC);

-- ──────────────────────────────────────────────────────────────
-- 4. SALES TABLOSU - Lateral Join'li sorgular (379ms ortalama, %6.5)
-- ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sales_created_desc 
ON sales (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sales_customer_id 
ON sales (customer_id);

CREATE INDEX IF NOT EXISTS idx_sales_tenant_created 
ON sales (tenant_id, created_at DESC);

-- ──────────────────────────────────────────────────────────────
-- 5. LEAD_QUALIFICATIONS - En yavaş sorgu (2.94sn ortalama! %4.4)
-- ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_lead_qualifications_customer 
ON lead_qualifications (customer_id);

-- ──────────────────────────────────────────────────────────────
-- 6. CUSTOMER_DEMANDS - Lateral Join (288ms ortalama, %4.4)
-- ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_customer_demands_customer 
ON customer_demands (customer_id);

-- ──────────────────────────────────────────────────────────────
-- 7. SYSTEM_NOTIFICATIONS - 106K çağrı (38ms ama hacim çok yüksek, %4.2)
-- ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_system_notifications_user_tenant_created 
ON system_notifications (tenant_id, user_id, created_at DESC);

-- ──────────────────────────────────────────────────────────────
-- 8. CONTRACT_CUSTOMERS - müşteri listesinde kullanılıyor
-- ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contract_customers_customer 
ON contract_customers (customer_id);

-- ──────────────────────────────────────────────────────────────
-- VACUUM ANALYZE - İndeksler oluştuktan sonra istatistikleri güncelle
-- ──────────────────────────────────────────────────────────────
ANALYZE activities;
ANALYZE customers;
ANALYZE sales;
ANALYZE lead_qualifications;
ANALYZE customer_demands;
ANALYZE system_notifications;
ANALYZE contract_customers;
