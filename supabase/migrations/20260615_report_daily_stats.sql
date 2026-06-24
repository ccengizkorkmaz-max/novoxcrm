-- ============================================================
-- REPORT DAILY STATS — Performans raporu için önceden hesaplanmış günlük veriler
-- ============================================================

-- 1. Tablo oluştur
CREATE TABLE IF NOT EXISTS report_daily_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    whatsapp_count INT DEFAULT 0,
    outbound_call_count INT DEFAULT 0,
    inbound_call_count INT DEFAULT 0,
    cold_count INT DEFAULT 0,
    warm_count INT DEFAULT 0,
    hot_count INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, stat_date)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_report_daily_stats_tenant_date 
    ON report_daily_stats(tenant_id, stat_date DESC);

-- Enable RLS
ALTER TABLE report_daily_stats ENABLE ROW LEVEL SECURITY;

-- RLS: Authenticated users can read their tenant's data
CREATE POLICY "Users can read own tenant report stats"
    ON report_daily_stats FOR SELECT
    TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));


-- 2. Aggregate fonksiyonu — belirli bir tarih aralığı için verileri hesaplar ve upsert eder
CREATE OR REPLACE FUNCTION refresh_report_daily_stats(
    p_from_date DATE DEFAULT (CURRENT_DATE - INTERVAL '1 day')::DATE,
    p_to_date DATE DEFAULT CURRENT_DATE
)
RETURNS INT AS $$
DECLARE
    v_tenant RECORD;
    v_date DATE;
    v_wa INT;
    v_outbound INT;
    v_inbound INT;
    v_cold INT;
    v_warm INT;
    v_hot INT;
    v_count INT := 0;
BEGIN
    -- Her tenant için işle
    FOR v_tenant IN SELECT id FROM tenants LOOP
        -- Her gün için
        v_date := p_from_date;
        WHILE v_date <= p_to_date LOOP

            -- WhatsApp activities
            SELECT COUNT(*) INTO v_wa
            FROM activities
            WHERE type = 'Whatsapp'
              AND tenant_id = v_tenant.id
              AND created_at >= v_date::timestamptz
              AND created_at < (v_date + INTERVAL '1 day')::timestamptz;

            -- Outbound calls: manual (activities.type='Call') + AI (lead_qualifications.last_call_at)
            SELECT COUNT(*) INTO v_outbound
            FROM (
                SELECT id FROM activities
                WHERE type = 'Call'
                  AND tenant_id = v_tenant.id
                  AND created_at >= v_date::timestamptz
                  AND created_at < (v_date + INTERVAL '1 day')::timestamptz
                UNION ALL
                SELECT id FROM lead_qualifications
                WHERE tenant_id = v_tenant.id
                  AND last_call_at IS NOT NULL
                  AND last_call_at >= v_date::timestamptz
                  AND last_call_at < (v_date + INTERVAL '1 day')::timestamptz
            ) sub;

            -- Inbound calls
            SELECT COUNT(*) INTO v_inbound
            FROM inbound_calls
            WHERE tenant_id = v_tenant.id
              AND started_at >= v_date::timestamptz
              AND started_at < (v_date + INTERVAL '1 day')::timestamptz;

            -- Lead qualifications by interest level (updated in this date)
            SELECT COUNT(*) INTO v_cold
            FROM lead_qualifications
            WHERE tenant_id = v_tenant.id
              AND interest_level = 'cold'
              AND updated_at >= v_date::timestamptz
              AND updated_at < (v_date + INTERVAL '1 day')::timestamptz;

            SELECT COUNT(*) INTO v_warm
            FROM lead_qualifications
            WHERE tenant_id = v_tenant.id
              AND interest_level = 'warm'
              AND updated_at >= v_date::timestamptz
              AND updated_at < (v_date + INTERVAL '1 day')::timestamptz;

            SELECT COUNT(*) INTO v_hot
            FROM lead_qualifications
            WHERE tenant_id = v_tenant.id
              AND interest_level = 'hot'
              AND updated_at >= v_date::timestamptz
              AND updated_at < (v_date + INTERVAL '1 day')::timestamptz;

            -- Upsert
            INSERT INTO report_daily_stats (tenant_id, stat_date, whatsapp_count, outbound_call_count, inbound_call_count, cold_count, warm_count, hot_count, updated_at)
            VALUES (v_tenant.id, v_date, v_wa, v_outbound, v_inbound, v_cold, v_warm, v_hot, now())
            ON CONFLICT (tenant_id, stat_date)
            DO UPDATE SET
                whatsapp_count = EXCLUDED.whatsapp_count,
                outbound_call_count = EXCLUDED.outbound_call_count,
                inbound_call_count = EXCLUDED.inbound_call_count,
                cold_count = EXCLUDED.cold_count,
                warm_count = EXCLUDED.warm_count,
                hot_count = EXCLUDED.hot_count,
                updated_at = now();

            v_count := v_count + 1;
            v_date := v_date + INTERVAL '1 day';
        END LOOP;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. İlk veri yüklemesi — son 60 günü doldur
SELECT refresh_report_daily_stats((CURRENT_DATE - INTERVAL '60 days')::DATE, CURRENT_DATE);


-- 4. pg_cron ile 5 dakikada bir bugün ve dünü güncelle (Supabase Pro planında otomatik aktif)
-- Not: pg_cron Supabase'de extensions'dan aktifleştirilmelidir
-- Eğer pg_cron aktif değilse, bu satırları atlayıp API cron kullanın

-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule(
--     'refresh-report-stats',
--     '*/5 * * * *',
--     $$SELECT refresh_report_daily_stats(CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE)$$
-- );
