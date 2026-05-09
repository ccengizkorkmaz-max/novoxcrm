-- ============================================================
-- NovoCRM Outreach Automation System v2 — Decision Trees & Intelligence
-- ============================================================

-- 1. Workflow Tablosuna Hedef ve Limit Eklemeleri
ALTER TABLE outreach_workflows 
ADD COLUMN IF NOT EXISTS conversion_goal_status TEXT, -- Örn: 'Prospect' durumuna geçerse durdur
ADD COLUMN IF NOT EXISTS stop_on_customer_response BOOLEAN DEFAULT true, -- Müşteri yanıt verirse (WhatsApp/Call) durdur
ADD COLUMN IF NOT EXISTS max_concurrent_executions INTEGER DEFAULT 10; -- Aynı anda kaç kişi çalışabilir

-- 2. Step Tablosuna Gelişmiş Dallanma Desteği
ALTER TABLE outreach_steps
ADD COLUMN IF NOT EXISTS next_step_id_on_success TEXT,
ADD COLUMN IF NOT EXISTS next_step_id_on_failure TEXT,
ADD COLUMN IF NOT EXISTS next_step_id_on_condition_true TEXT,
ADD COLUMN IF NOT EXISTS next_step_id_on_condition_false TEXT;

-- 3. Action Type Check Constraint Güncelleme (Yeni tipler ekleyelim)
ALTER TABLE outreach_steps DROP CONSTRAINT IF EXISTS outreach_steps_action_type_check;
ALTER TABLE outreach_steps ADD CONSTRAINT outreach_steps_action_type_check 
CHECK (action_type IN (
    'ai_call', 'whatsapp', 'sms', 'wait', 'status_update', 'notify', 'tag', 
    'condition', -- Karar düğümü (Eğer ... ise)
    'ai_personalize', -- Mesajı AI ile o ana özel rewrite etme
    'webhook' -- Dış sisteme (Örn: Zapier) veri gönder
));

-- 4. Olay Bazlı Tetikleyiciler (Triggers)
CREATE TABLE IF NOT EXISTS outreach_event_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES outreach_workflows(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'lead_created', 'status_changed', 'activity_created', 'link_clicked'
    event_config JSONB DEFAULT '{}', -- Örn: { "new_status": "Inbox" }
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Analytics & Performance Tracking (A/B Test Desteği İçin)
ALTER TABLE outreach_step_logs
ADD COLUMN IF NOT EXISTS version_tag TEXT, -- A/B test versiyonu
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 6. RLS Policies for new table
ALTER TABLE outreach_event_triggers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for outreach_event_triggers" ON outreach_event_triggers;
CREATE POLICY "Tenant isolation for outreach_event_triggers" ON outreach_event_triggers
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_outreach_triggers_event ON outreach_event_triggers(event_type, is_active);
