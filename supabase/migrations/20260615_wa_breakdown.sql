-- ============================================================
-- WhatsApp Şablon Kırılımı — report_daily_stats'a JSONB sütunu ekleme
-- ============================================================

-- 1. Yeni sütun ekle
ALTER TABLE report_daily_stats 
ADD COLUMN IF NOT EXISTS whatsapp_breakdown JSONB DEFAULT '{}';

-- 2. Fonksiyonu güncelle — şablon kırılımını da hesaplasın
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
    v_wa_breakdown JSONB;
    v_count INT := 0;
BEGIN
    FOR v_tenant IN SELECT id FROM tenants LOOP
        v_date := p_from_date;
        WHILE v_date <= p_to_date LOOP

            -- WhatsApp activities
            SELECT COUNT(*) INTO v_wa
            FROM activities
            WHERE type = 'Whatsapp'
              AND tenant_id = v_tenant.id
              AND created_at >= v_date::timestamptz
              AND created_at < (v_date + INTERVAL '1 day')::timestamptz;

            -- WhatsApp şablon kırılımı
            SELECT COALESCE(jsonb_object_agg(template_name, cnt), '{}'::jsonb)
            INTO v_wa_breakdown
            FROM (
                SELECT 
                    COALESCE(
                        substring(summary from '\(([^)]+)\)'),
                        'Diğer'
                    ) as template_name,
                    COUNT(*) as cnt
                FROM activities
                WHERE type = 'Whatsapp'
                  AND tenant_id = v_tenant.id
                  AND created_at >= v_date::timestamptz
                  AND created_at < (v_date + INTERVAL '1 day')::timestamptz
                GROUP BY template_name
            ) sub;

            -- Outbound calls
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

            -- Lead qualifications
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
            INSERT INTO report_daily_stats (tenant_id, stat_date, whatsapp_count, outbound_call_count, inbound_call_count, cold_count, warm_count, hot_count, whatsapp_breakdown, updated_at)
            VALUES (v_tenant.id, v_date, v_wa, v_outbound, v_inbound, v_cold, v_warm, v_hot, v_wa_breakdown, now())
            ON CONFLICT (tenant_id, stat_date)
            DO UPDATE SET
                whatsapp_count = EXCLUDED.whatsapp_count,
                outbound_call_count = EXCLUDED.outbound_call_count,
                inbound_call_count = EXCLUDED.inbound_call_count,
                cold_count = EXCLUDED.cold_count,
                warm_count = EXCLUDED.warm_count,
                hot_count = EXCLUDED.hot_count,
                whatsapp_breakdown = EXCLUDED.whatsapp_breakdown,
                updated_at = now();

            v_count := v_count + 1;
            v_date := v_date + INTERVAL '1 day';
        END LOOP;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Veriyi yeniden hesapla (son 60 gün)
SELECT refresh_report_daily_stats((CURRENT_DATE - INTERVAL '60 days')::DATE, CURRENT_DATE);
