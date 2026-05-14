-- ============================================================
-- NovoCRM — Data API GRANT'ları (Supabase Mayıs 2025 Gereksinimi)
-- ============================================================
-- Supabase, 30 Mayıs 2025'ten itibaren yeni projeler için
-- public schema'daki tabloların Data API erişimini otomatik vermeyecek.
-- Bu migration, tüm mevcut tablolara açık GRANT ifadeleri ekler.
--
-- Tarihler:
--   30 Mayıs 2025: Tüm yeni projeler için varsayılan
--   30 Ekim 2025: Tüm mevcut projeler için zorunlu
-- ============================================================

-- ============================================================
-- 1. CORE CRM TABLOLARI
--    (authenticated: full CRUD, service_role: full CRUD)
--    (anon: yok — bu tablolar login gerektirir)
-- ============================================================

-- tenants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO service_role;

-- profiles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;

-- projects
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO service_role;

-- customers
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO service_role;

-- sales
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO service_role;

-- offers
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO service_role;

-- contracts
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO service_role;

-- activities
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO service_role;

-- units
GRANT SELECT, INSERT, UPDATE, DELETE ON public.units TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.units TO service_role;

-- ============================================================
-- 2. SÖZLEŞME İLİŞKİLERİ
-- ============================================================

-- contract_activities
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_activities TO service_role;

-- contract_documents
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_documents TO service_role;

-- contract_customers
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_customers TO service_role;

-- payment_plans
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_plans TO service_role;

-- payment_items (eğer mevcutsa)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_items') THEN
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_items TO authenticated';
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_items TO service_role';
    END IF;
END $$;

-- deposits
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deposits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deposits TO service_role;

-- ============================================================
-- 3. ENVANTER / INVENTORY
-- ============================================================

-- unit_types
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_types TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_types TO service_role;

-- unit_images
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_images TO service_role;

-- unit_activity_log
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_activity_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_activity_log TO service_role;

-- unit_documents
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_documents TO service_role;

-- unit_notes
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_notes TO service_role;

-- project_floor_plans
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_floor_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_floor_plans TO service_role;

-- unit_floor_positions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_floor_positions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_floor_positions TO service_role;

-- unit_price_history
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_price_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_price_history TO service_role;

-- public_inquiries (anon erişimi de gerekebilir — public form)
GRANT SELECT, INSERT ON public.public_inquiries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.public_inquiries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.public_inquiries TO service_role;

-- public_inventory_links (anon erişimi — public paylaşım linkleri)
GRANT SELECT ON public.public_inventory_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.public_inventory_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.public_inventory_links TO service_role;

-- ============================================================
-- 4. İNŞAAT YÖNETİMİ
-- ============================================================

-- construction_stages
GRANT SELECT, INSERT, UPDATE, DELETE ON public.construction_stages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.construction_stages TO service_role;

-- unit_construction_progress
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_construction_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_construction_progress TO service_role;

-- ============================================================
-- 5. İNSAN KAYNAKLARI (HR)
-- ============================================================

-- employees
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO service_role;

-- employee_documents
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_documents TO service_role;

-- ============================================================
-- 6. KOMİSYON SİSTEMİ
-- ============================================================

-- commission_rules
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commission_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commission_rules TO service_role;

-- commissions (eski broker portal tablosu)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commissions TO service_role;

-- commission_plans (broker pro features)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commission_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commission_plans TO service_role;

-- ============================================================
-- 7. FİNANS MODÜLÜ
-- ============================================================

-- financial_accounts
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_accounts TO service_role;

-- finance_transactions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_transactions TO service_role;

-- valuable_papers
GRANT SELECT, INSERT, UPDATE, DELETE ON public.valuable_papers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.valuable_papers TO service_role;

-- ============================================================
-- 8. BİLDİRİM SİSTEMİ
-- ============================================================

-- notification_settings
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_settings TO service_role;

-- system_notifications
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_notifications TO service_role;

-- notification_queue
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_queue TO service_role;

-- portal_notifications (broker portal)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_notifications TO service_role;

-- ============================================================
-- 9. BROKER / ACENTE MODÜLÜ
-- ============================================================

-- broker_leads
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_leads TO service_role;

-- broker_lead_history
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_lead_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_lead_history TO service_role;

-- commission_models
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commission_models TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commission_models TO service_role;

-- incentive_campaigns
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incentive_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incentive_campaigns TO service_role;

-- document_library
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_library TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_library TO service_role;

-- broker_applications (anon erişimi — public başvuru formu)
GRANT SELECT, INSERT ON public.broker_applications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_applications TO service_role;

-- broker_verification_codes
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_verification_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_verification_codes TO service_role;

-- broker_payments
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_payments TO service_role;

-- incentive_earnings
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incentive_earnings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incentive_earnings TO service_role;

-- broker_levels
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_levels TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_levels TO service_role;

-- project_broker_access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_broker_access TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_broker_access TO service_role;

-- commission_tiers
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commission_tiers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commission_tiers TO service_role;

-- ============================================================
-- 10. BROKER PRO — PORTFÖY, İŞLEMLER, ENTEGRASYONLAR
-- ============================================================

-- portfolios
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolios TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolios TO service_role;

-- portfolio_images
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_images TO service_role;

-- lead_routing_rules
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_routing_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_routing_rules TO service_role;

-- broker_commission_settings
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_commission_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_commission_settings TO service_role;

-- agent_transactions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_transactions TO service_role;

-- tenant_webhooks
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_webhooks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_webhooks TO service_role;

-- tenant_integrations
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_integrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_integrations TO service_role;

-- ============================================================
-- 11. BROKER PRO — BELGELER, KAMPANYALAR, EĞİTİM
-- ============================================================

-- documents
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO service_role;

-- campaigns
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO service_role;

-- campaign_recipients
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_recipients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_recipients TO service_role;

-- email_templates
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO service_role;

-- training_courses
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_courses TO service_role;

-- training_lessons
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_lessons TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_lessons TO service_role;

-- training_quiz_questions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_quiz_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_quiz_questions TO service_role;

-- training_progress
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_progress TO service_role;

-- training_certificates
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_certificates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_certificates TO service_role;

-- ============================================================
-- 12. MESAJLAŞMA & WHATSAPP
-- ============================================================

-- messaging_sessions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messaging_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messaging_sessions TO service_role;

-- messaging_messages
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messaging_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messaging_messages TO service_role;

-- whatsapp_conversations (eğer mevcutsa)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'whatsapp_conversations') THEN
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_conversations TO authenticated';
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_conversations TO service_role';
    END IF;
END $$;

-- whatsapp_messages (eğer mevcutsa)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'whatsapp_messages') THEN
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_messages TO authenticated';
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_messages TO service_role';
    END IF;
END $$;

-- ============================================================
-- 13. TENANT E-POSTA HESAPLARI
-- ============================================================

-- tenant_email_accounts
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_email_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_email_accounts TO service_role;

-- ============================================================
-- 14. INBOX (WEB LEADS)
-- ============================================================

-- inbox_items
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inbox_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inbox_items TO service_role;
-- Anon erişimi (web formdan gelen kayıtlar)
GRANT INSERT ON public.inbox_items TO anon;

-- ============================================================
-- 15. SERVICE REQUESTS (MÜŞTERİ PORTALI)
-- ============================================================

-- service_requests
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_requests TO service_role;

-- ============================================================
-- 16. OUTREACH AUTOMATION SİSTEMİ
-- ============================================================

-- outreach_segments
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_segments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_segments TO service_role;

-- outreach_scripts
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_scripts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_scripts TO service_role;

-- outreach_workflows
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_workflows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_workflows TO service_role;

-- outreach_steps
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_steps TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_steps TO service_role;

-- outreach_executions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_executions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_executions TO service_role;

-- outreach_step_logs
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_step_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_step_logs TO service_role;

-- outreach_optouts
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_optouts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_optouts TO service_role;

-- outreach_event_triggers
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_event_triggers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_event_triggers TO service_role;

-- ============================================================
-- 17. SİSTEM LOGLARI
-- ============================================================

-- system_logs
GRANT SELECT, INSERT ON public.system_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_logs TO service_role;

-- ============================================================
-- 18. DİĞER TABLOLAR (saas_features, advanced_reports, vb.)
-- ============================================================

-- Varsa saas ile ilgili tablolar
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saas_features') THEN
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.saas_features TO authenticated';
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.saas_features TO service_role';
    END IF;
END $$;

-- broker_model tablosu (eğer mevcutsa)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'broker_model') THEN
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_model TO authenticated';
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_model TO service_role';
    END IF;
END $$;

-- ============================================================
-- 19. SEQUENCE GRANT'LARI
--     (INSERT yapabilmek için sequence'lara da erişim lazım)
-- ============================================================

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================================
-- 20. GELECEKTE OLUŞTURULACAK TABLOLAR İÇİN DEFAULT GRANT'LAR
--     (Yeni tablolara otomatik yetki verilmesi)
-- ============================================================

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE ON SEQUENCES TO service_role;

-- ============================================================
-- TAMAMLANDI ✅
-- ============================================================
