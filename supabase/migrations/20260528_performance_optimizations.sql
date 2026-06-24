-- ============================================================
-- 🚀 MİGRASYON: PERFORMANS İYİLEŞTİRMELERİ (SQL Görünümleri & İndeksler)
-- ============================================================

-- 1. Müşteri Kaynak İstatistikleri Görünümü (RLS Uyumlu)
CREATE OR REPLACE VIEW public.tenant_customer_source_stats
WITH (security_invoker = true) AS
SELECT 
    tenant_id,
    COALESCE(source, 'Belirtilmemiş') as source,
    count(*)::int as count
FROM public.customers
GROUP BY tenant_id, source;

-- 2. Pazarlama Adayları Ayrıştırma Görünümü (RLS Uyumlu)
CREATE OR REPLACE VIEW public.marketing_leads_parsed
WITH (security_invoker = true) AS
SELECT 
    s.id,
    s.tenant_id,
    s.status,
    s.created_at,
    s.customer_id,
    s.description,
    c.source as customer_source,
    -- Kanalı ayrıştır: description formatından veya müşteri kaynağından
    CASE 
        WHEN c.source IN ('Facebook Ads', 'Facebook', 'fb') OR s.description ILIKE '%Facebook%' THEN 'Facebook Ads'
        WHEN c.source IN ('Instagram', 'ig') THEN 'Instagram'
        WHEN c.source = 'WEB Form' THEN 'Web Sitesi'
        WHEN c.source IN ('Email', 'E-Posta') THEN 'E-Posta'
        WHEN c.source = 'Whatsapp&Call Center' THEN 'WhatsApp & Çağrı Merkezi'
        ELSE COALESCE(trim(substring(s.description from '(?i)Lead from\s+([^(]+?)(?:\s*\(|$)')), c.source, 'Bilinmiyor')
    END as parsed_channel,
    -- Projeyi/Formu ayrıştır
    COALESCE(
        trim(substring(s.description from '(?i)\(Form:\s*([^)]+)\)')), 
        CASE 
            WHEN c.source IN ('Facebook Ads', 'Facebook', 'fb') THEN 'Facebook Reklamları (Genel)'
            WHEN c.source IN ('Instagram', 'ig') THEN 'Instagram Reklamları (Genel)'
            WHEN c.source = 'WEB Form' THEN 'Web Sitesi İletişim Formu'
            WHEN c.source IN ('Email', 'E-Posta') THEN 'Gelen E-posta'
            WHEN c.source = 'Whatsapp&Call Center' THEN 'WhatsApp & Çağrı Merkezi'
            WHEN c.source IS NOT NULL AND c.source <> '' THEN c.source
            ELSE 'Diğer'
        END
    ) as parsed_form,
    -- Kampanyayı ayrıştır
    trim(substring(s.description from '(?i)\(Campaign:\s*([^)]+)\)')) as parsed_campaign
FROM public.sales s
LEFT JOIN public.customers c ON s.customer_id = c.id
WHERE s.description ILIKE '%Form:%' 
   OR s.description ILIKE '%Lead from%' 
   OR c.source IN ('Facebook Ads', 'Facebook', 'fb', 'Instagram', 'ig', 'WEB Form', 'Email', 'E-Posta', 'Whatsapp&Call Center');

-- 3. Pazarlama Kanal Özeti Görünümü
CREATE OR REPLACE VIEW public.marketing_channel_summary
WITH (security_invoker = true) AS
SELECT 
    tenant_id,
    parsed_channel as name,
    count(*)::int as total,
    count(case when created_at >= date_trunc('day', current_timestamp) then 1 end)::int as today,
    count(case when created_at >= date_trunc('week', current_timestamp) then 1 end)::int as this_week,
    count(case when created_at >= date_trunc('month', current_timestamp) then 1 end)::int as this_month
FROM public.marketing_leads_parsed
GROUP BY tenant_id, parsed_channel;

-- 4. Pazarlama Proje/Form Özeti Görünümü
CREATE OR REPLACE VIEW public.marketing_project_summary
WITH (security_invoker = true) AS
SELECT 
    tenant_id,
    parsed_form as name,
    count(*)::int as total,
    count(case when created_at >= date_trunc('day', current_timestamp) then 1 end)::int as today,
    count(case when created_at >= date_trunc('week', current_timestamp) then 1 end)::int as this_week,
    count(case when created_at >= date_trunc('month', current_timestamp) then 1 end)::int as this_month
FROM public.marketing_leads_parsed
GROUP BY tenant_id, parsed_form;

-- 5. Pazarlama Form/Kampanya Detaylı ve Gruplanmış Görünüm (Durum Kırılımları Dahil)
CREATE OR REPLACE VIEW public.marketing_form_campaign_grouped
WITH (security_invoker = true) AS
SELECT 
    tenant_id,
    parsed_form as form_name,
    parsed_channel as channel,
    COALESCE(parsed_campaign, '') as campaign,
    sum(status_count)::int as total,
    sum(status_today)::int as today,
    sum(status_this_week)::int as this_week,
    sum(status_this_month)::int as this_month,
    jsonb_object_agg(COALESCE(status, 'Diğer'), status_count) as statuses
FROM (
    SELECT 
        tenant_id,
        parsed_form,
        parsed_channel,
        parsed_campaign,
        status,
        count(*)::int as status_count,
        count(case when created_at >= date_trunc('day', current_timestamp) then 1 end)::int as status_today,
        count(case when created_at >= date_trunc('week', current_timestamp) then 1 end)::int as status_this_week,
        count(case when created_at >= date_trunc('month', current_timestamp) then 1 end)::int as status_this_month
    FROM public.marketing_leads_parsed
    GROUP BY tenant_id, parsed_form, parsed_channel, parsed_campaign, status
) sub
GROUP BY tenant_id, parsed_form, parsed_channel, parsed_campaign;

-- 6. Performans Arama İndeksleri
CREATE INDEX IF NOT EXISTS idx_customers_tenant_source ON public.customers (tenant_id, source);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_status_created ON public.sales (tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON public.sales (customer_id);
CREATE INDEX IF NOT EXISTS idx_outreach_step_logs_channel_status ON public.outreach_step_logs (channel, status);
CREATE INDEX IF NOT EXISTS idx_outreach_executions_workflow_status ON public.outreach_executions (workflow_id, status);
