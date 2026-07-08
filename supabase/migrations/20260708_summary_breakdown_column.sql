-- ============================================================
-- Summary Breakdown — report_daily_stats tablosuna summary_breakdown JSONB sütunu
-- ============================================================

ALTER TABLE public.report_daily_stats 
ADD COLUMN IF NOT EXISTS summary_breakdown JSONB DEFAULT '{}';

-- refresh_report_daily_stats fonksiyonunu summary_breakdown'ı da hesaplayacak şekilde güncelle
CREATE OR REPLACE FUNCTION public.refresh_report_daily_stats(
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
    v_summary_breakdown JSONB;
    v_manual_calls INT;
    v_ai_outbound INT;
    v_count INT := 0;
BEGIN
    FOR v_tenant IN SELECT id FROM tenants LOOP
        v_date := p_from_date;
        WHILE v_date <= p_to_date LOOP

            -- 1. WhatsApp activities
            SELECT COUNT(*) INTO v_wa
            FROM public.activities
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
                FROM public.activities
                WHERE type = 'Whatsapp'
                  AND tenant_id = v_tenant.id
                  AND created_at >= v_date::timestamptz
                  AND created_at < (v_date + INTERVAL '1 day')::timestamptz
                GROUP BY template_name
            ) sub;

            -- 2. Manuel aramalar (activities.type='Call')
            SELECT COUNT(*) INTO v_manual_calls
            FROM public.activities
            WHERE type = 'Call'
              AND tenant_id = v_tenant.id
              AND created_at >= v_date::timestamptz
              AND created_at < (v_date + INTERVAL '1 day')::timestamptz;

            -- 3. AI Outbound aramalar (lead_qualifications.last_call_at)
            SELECT COUNT(*) INTO v_ai_outbound
            FROM public.lead_qualifications
            WHERE tenant_id = v_tenant.id
              AND last_call_at IS NOT NULL
              AND last_call_at >= v_date::timestamptz
              AND last_call_at < (v_date + INTERVAL '1 day')::timestamptz;

            v_outbound := v_manual_calls + v_ai_outbound;

            -- 4. Inbound calls
            SELECT COUNT(*) INTO v_inbound
            FROM public.inbound_calls
            WHERE tenant_id = v_tenant.id
              AND started_at >= v_date::timestamptz
              AND started_at < (v_date + INTERVAL '1 day')::timestamptz;

            -- Arama kırılımı JSONB (manuel_giden, ai_giden, gelen)
            v_calls_breakdown := jsonb_build_object(
                'manuel_giden', v_manual_calls,
                'ai_giden', v_ai_outbound,
                'gelen', v_inbound
            );

            -- 5. Detaylı Arama Sonuç Kırılımı (summary_breakdown JSONB)
            SELECT COALESCE(jsonb_object_agg(category, cnt), '{}'::jsonb)
            INTO v_summary_breakdown
            FROM (
                WITH lead_quals AS (
                    SELECT 
                        customer_id,
                        interest_level,
                        LOWER(COALESCE(call_notes, '')) as notes
                    FROM public.lead_qualifications
                    WHERE tenant_id = v_tenant.id
                      AND last_call_at >= v_date::timestamptz
                      AND last_call_at < (v_date + INTERVAL '1 day')::timestamptz
                ),
                manual_acts AS (
                    SELECT 
                        customer_id,
                        LOWER(COALESCE(summary, '')) as summary
                    FROM public.activities
                    WHERE type = 'Call'
                      AND tenant_id = v_tenant.id
                      AND created_at >= v_date::timestamptz
                      AND created_at < (v_date + INTERVAL '1 day')::timestamptz
                ),
                -- Dedup: AI activities already in lead_qualifications are filtered out
                filtered_acts AS (
                    SELECT ma.summary
                    FROM manual_acts ma
                    LEFT JOIN lead_quals lq ON ma.customer_id = lq.customer_id
                    WHERE NOT (
                        (ma.summary LIKE '%🤖%' OR ma.summary LIKE '%ai arama%')
                        AND lq.customer_id IS NOT NULL
                    )
                ),
                categorized_acts AS (
                    SELECT 
                        CASE 
                            WHEN summary LIKE '%görüşme tamamlandı%' OR summary LIKE '%görüşüldü%' THEN 'gorusme_tamamlandi'
                            WHEN summary LIKE '%cevap vermedi%' OR summary LIKE '%ulaşılamadı%' THEN 'cevap_vermedi'
                            WHEN summary LIKE '%meşgul%' THEN 'hat_mesgul'
                            WHEN summary LIKE '%ilgilendi%' OR summary LIKE '%ilgili%' THEN 'musteri_ilgilendi'
                            WHEN summary LIKE '%ilgilenmedi%' OR summary LIKE '%ilgilenmiyor%' THEN 'gorusuldu_ilgilenmedi'
                            ELSE 'manuel_arama'
                        END::text as cat
                    FROM filtered_acts
                ),
                categorized_lq AS (
                    SELECT 
                        CASE 
                            WHEN notes LIKE '%skor: hot%' OR notes LIKE '%skor hot%' OR interest_level = 'hot' THEN 'skor_hot'
                            WHEN notes LIKE '%skor: warm%' OR notes LIKE '%skor warm%' OR interest_level = 'warm' THEN 'skor_warm'
                            WHEN notes LIKE '%skor: follow%' OR notes LIKE '%skor follow%' OR interest_level = 'follow_up' THEN 'skor_follow_up'
                            WHEN notes LIKE '%skor: disqualified%' OR notes LIKE '%skor disqualified%' OR interest_level = 'disqualified' THEN 'skor_disqualified'
                            WHEN notes LIKE '%müşteri ilgilendi%' OR notes LIKE '%ilgilendi ✅%' THEN 'musteri_ilgilendi'
                            WHEN notes LIKE '%görüşüldü, ilgilenmedi%' OR notes LIKE '%ilgilenmedi ❌%' THEN 'gorusuldu_ilgilenmedi'
                            WHEN notes LIKE '%görüşme tamamlandı%' OR notes LIKE '%görüşüldü%' OR notes LIKE '%görüşme yapıldı%' THEN 'gorusme_tamamlandi'
                            WHEN notes LIKE '%cevap vermedi%' THEN 'cevap_vermedi'
                            WHEN notes LIKE '%hat meşgul%' OR notes LIKE '%meşgul%' THEN 'hat_mesgul'
                            WHEN notes LIKE '%açtı ama kapattı%' OR notes LIKE '%kapattı%' THEN 'acti_ama_kapatti'
                            WHEN notes LIKE '%müsait değil%' OR notes LIKE '%tekrar aranacak%' OR notes LIKE '%callback%' THEN 'musait_degil'
                            WHEN interest_level = 'cold' THEN 'skor_disqualified'
                            ELSE 'gorusme_tamamlandi'
                        END::text as cat
                    FROM lead_quals
                ),
                inbound_acts AS (
                    SELECT 'gelen_karsilandi'::text as cat
                    FROM public.inbound_calls
                    WHERE tenant_id = v_tenant.id
                      AND started_at >= v_date::timestamptz
                      AND started_at < (v_date + INTERVAL '1 day')::timestamptz
                ),
                all_cats AS (
                    SELECT cat FROM categorized_acts
                    UNION ALL
                    SELECT cat FROM categorized_lq
                    UNION ALL
                    SELECT cat FROM inbound_acts
                )
                SELECT cat as category, COUNT(*)::int as cnt
                FROM all_cats
                GROUP BY cat
            ) sub_cats;

            -- Lead qualifications by interest level (updated in this date)
            SELECT COUNT(*) INTO v_cold
            FROM public.lead_qualifications
            WHERE tenant_id = v_tenant.id
              AND interest_level = 'cold'
              AND updated_at >= v_date::timestamptz
              AND updated_at < (v_date + INTERVAL '1 day')::timestamptz;

            SELECT COUNT(*) INTO v_warm
            FROM public.lead_qualifications
            WHERE tenant_id = v_tenant.id
              AND interest_level = 'warm'
              AND updated_at >= v_date::timestamptz
              AND updated_at < (v_date + INTERVAL '1 day')::timestamptz;

            SELECT COUNT(*) INTO v_hot
            FROM public.lead_qualifications
            WHERE tenant_id = v_tenant.id
              AND interest_level = 'hot'
              AND updated_at >= v_date::timestamptz
              AND updated_at < (v_date + INTERVAL '1 day')::timestamptz;

            -- Upsert including calls_breakdown and summary_breakdown
            INSERT INTO public.report_daily_stats (
                tenant_id, stat_date, whatsapp_count, outbound_call_count, inbound_call_count,
                cold_count, warm_count, hot_count, whatsapp_breakdown, calls_breakdown, summary_breakdown, updated_at
            )
            VALUES (
                v_tenant.id, v_date, v_wa, v_outbound, v_inbound,
                v_cold, v_warm, v_hot, v_wa_breakdown, v_calls_breakdown, v_summary_breakdown, now()
            )
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
                summary_breakdown = EXCLUDED.summary_breakdown,
                updated_at = now();

            v_count := v_count + 1;
            v_date := v_date + INTERVAL '1 day';
        END LOOP;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
