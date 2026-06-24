-- ============================================================
-- Arama Kırılımı — report_daily_stats'a calls_breakdown JSONB sütunu
-- ============================================================

ALTER TABLE report_daily_stats 
ADD COLUMN IF NOT EXISTS calls_breakdown JSONB DEFAULT '{}';

-- Fonksiyonu güncelle — arama kırılımını da hesaplasın
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
    v_calls_breakdown JSONB;
    v_manual_calls INT;
    v_ai_outbound INT;
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
                    COALESCE(substring(summary from '\(([^)]+)\)'), 'Diğer') as template_name,
                    COUNT(*) as cnt
                FROM activities
                WHERE type = 'Whatsapp'
                  AND tenant_id = v_tenant.id
                  AND created_at >= v_date::timestamptz
                  AND created_at < (v_date + INTERVAL '1 day')::timestamptz
                GROUP BY template_name
            ) sub;

            -- Manuel aramalar (activities.type='Call') — bildirim/görev kayıtları hariç
            SELECT COUNT(*) INTO v_manual_calls
            FROM activities
            WHERE type = 'Call'
              AND tenant_id = v_tenant.id
              AND created_at >= v_date::timestamptz
              AND created_at < (v_date + INTERVAL '1 day')::timestamptz
              AND summary NOT ILIKE '%MAYA Takip%'
              AND summary NOT ILIKE '%Atama Bekleyen%'
              AND summary NOT ILIKE '%ARAMA TALEBİ%'
              AND summary NOT ILIKE '%ACİL SATIŞ%'
              AND summary NOT ILIKE '%ILIK SATIŞ%';

            -- AI Outbound aramalar (lead_qualifications.last_call_at)
            SELECT COUNT(*) INTO v_ai_outbound
            FROM lead_qualifications
            WHERE tenant_id = v_tenant.id
              AND last_call_at IS NOT NULL
              AND last_call_at >= v_date::timestamptz
              AND last_call_at < (v_date + INTERVAL '1 day')::timestamptz;

            v_outbound := v_manual_calls + v_ai_outbound;

            -- Inbound calls
            SELECT COUNT(*) INTO v_inbound
            FROM inbound_calls
            WHERE tenant_id = v_tenant.id
              AND started_at >= v_date::timestamptz
              AND started_at < (v_date + INTERVAL '1 day')::timestamptz;

            -- Arama kırılımı JSONB
            v_calls_breakdown := jsonb_build_object(
                'manuel_giden', v_manual_calls,
                'ai_giden', v_ai_outbound,
                'gelen', v_inbound
            );

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
            INSERT INTO report_daily_stats (tenant_id, stat_date, whatsapp_count, outbound_call_count, inbound_call_count, cold_count, warm_count, hot_count, whatsapp_breakdown, calls_breakdown, updated_at)
            VALUES (v_tenant.id, v_date, v_wa, v_outbound, v_inbound, v_cold, v_warm, v_hot, v_wa_breakdown, v_calls_breakdown, now())
            ON CONFLICT (tenant_id, stat_date)
            DO UPDATE SET
                whatsapp_count = EXCLUDED.whatsapp_count,
                outbound_call_count = EXCLUDED.outbound_call_count,
                inbound_call_count = EXCLUDED.inbound_call_count,
                cold_count = EXCLUDED.cold_count,
                warm_count = EXCLUDED.warm_count,
                hot_count = EXCLUDED.hot_count,
                whatsapp_breakdown = EXCLUDED.whatsapp_breakdown,
                calls_breakdown = EXCLUDED.calls_breakdown,
                updated_at = now();

            v_count := v_count + 1;
            v_date := v_date + INTERVAL '1 day';
        END LOOP;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Veriyi yeniden hesapla
SELECT refresh_report_daily_stats((CURRENT_DATE - INTERVAL '60 days')::DATE, CURRENT_DATE);
