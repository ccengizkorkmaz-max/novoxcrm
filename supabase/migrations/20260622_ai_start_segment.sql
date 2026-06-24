-- =========================================================================
-- NovoCRM: Create segment "1 Ocak - Yapay Zeka Başlangıcı"
-- Target Tenant: Novo Şirketler Grubu (89b2829e-fc21-477e-8fd8-9f9f0c587e81)
-- Target Date Range: Jan 1, 2026 to May 6, 2026 (Date AI started)
-- Source: lead_qualifications (Ön Değerlendirme Listesi)
-- Statuses: new, follow_up, unreachable (Aktif Süreçler)
-- Created By: Serkan Genç (4ca0fcf5-db1f-44e7-891c-2fe5f623e371)
-- =========================================================================

DO $$
BEGIN
    -- Insert only if a segment with the same name doesn't exist for this tenant
    IF NOT EXISTS (
        SELECT 1 FROM outreach_segments 
        WHERE tenant_id = '89b2829e-fc21-477e-8fd8-9f9f0c587e81' AND name = '1 Ocak - Yapay Zeka Başlangıcı'
    ) THEN
        INSERT INTO outreach_segments (
            tenant_id,
            name,
            description,
            filters,
            created_by
        ) VALUES (
            '89b2829e-fc21-477e-8fd8-9f9f0c587e81',
            '1 Ocak - Yapay Zeka Başlangıcı',
            '1 Ocak 2026 ile yapay zekanın başladığı tarih (6 Mayıs 2026) arasındaki ön değerlendirme listesindeki aktif süreçlerdeki müşteriler',
            jsonb_build_object(
                'source', 'lead_qualifications',
                'statuses', jsonb_build_array('new', 'follow_up', 'unreachable'),
                'date_from', '2026-01-01',
                'date_to', '2026-05-06'
            ),
            '4ca0fcf5-db1f-44e7-891c-2fe5f623e371'
        );
    END IF;
END $$;
