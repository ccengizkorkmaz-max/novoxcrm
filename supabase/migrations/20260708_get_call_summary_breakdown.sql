-- ============================================================
-- SQL Function to calculate call summary breakdowns on the DB side
-- to avoid Supabase API 1000 row limits.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_call_summary_breakdown(
    p_tenant_id UUID,
    p_from_date TIMESTAMPTZ,
    p_to_date TIMESTAMPTZ
)
RETURNS TABLE (
    category_key TEXT,
    category_count INT
) AS $$
BEGIN
    RETURN QUERY
    WITH lead_quals AS (
        SELECT 
            customer_id,
            (last_call_at AT TIME ZONE 'UTC')::DATE as call_date,
            interest_level,
            LOWER(COALESCE(call_notes, '')) as notes
        FROM public.lead_qualifications
        WHERE tenant_id = p_tenant_id
          AND last_call_at >= p_from_date
          AND last_call_at <= p_to_date
    ),
    manual_acts AS (
        SELECT 
            customer_id,
            (created_at AT TIME ZONE 'UTC')::DATE as act_date,
            LOWER(COALESCE(summary, '')) as summary
        FROM public.activities
        WHERE type = 'Call'
          AND tenant_id = p_tenant_id
          AND created_at >= p_from_date
          AND created_at <= p_to_date
    ),
    -- Dedup manual activities that are duplicate AI calls already in lead_qualifications
    filtered_acts AS (
        SELECT ma.summary
        FROM manual_acts ma
        LEFT JOIN lead_quals lq ON ma.customer_id = lq.customer_id AND ma.act_date = lq.call_date
        WHERE NOT (
            (ma.summary LIKE '%🤖%' OR ma.summary LIKE '%ai arama%')
            AND lq.customer_id IS NOT NULL
        )
    ),
    -- Categorize manual activities
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
    -- Categorize AI outbound
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
    -- Categorize AI inbound
    inbound_acts AS (
        SELECT 'gelen_karsilandi'::text as cat
        FROM public.inbound_calls
        WHERE tenant_id = p_tenant_id
          AND started_at >= p_from_date
          AND started_at <= p_to_date
    ),
    all_cats AS (
        SELECT cat FROM categorized_acts
        UNION ALL
        SELECT cat FROM categorized_lq
        UNION ALL
        SELECT cat FROM inbound_acts
    )
    SELECT cat::text as category_key, COUNT(*)::int as category_count
    FROM all_cats
    GROUP BY cat;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_call_summary_breakdown(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_call_summary_breakdown(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;
