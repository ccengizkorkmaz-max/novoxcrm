-- ============================================================
-- NovoCRM Outreach Automation System — Database Migration
-- ============================================================

-- 1. Outreach Segmentleri (Kayıtlı Hedef Kitle Filtreleri)
CREATE TABLE IF NOT EXISTS outreach_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    filters JSONB NOT NULL DEFAULT '{}',
    estimated_count INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. AI Script Kütüphanesi
CREATE TABLE IF NOT EXISTS outreach_scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    prompt TEXT NOT NULL,
    first_message TEXT,
    voice TEXT DEFAULT 'turkish_female',
    language TEXT DEFAULT 'tr',
    max_duration_seconds INTEGER DEFAULT 180,
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Workflow Tanımları
CREATE TABLE IF NOT EXISTS outreach_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    segment_id UUID REFERENCES outreach_segments(id) ON DELETE SET NULL,
    -- Çalışma Ayarları
    working_hours_start TIME DEFAULT '09:00',
    working_hours_end TIME DEFAULT '19:00',
    working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
    timezone TEXT DEFAULT 'Europe/Istanbul',
    -- AI Ayarları
    default_script_id UUID REFERENCES outreach_scripts(id) ON DELETE SET NULL,
    -- Otomasyon
    is_active BOOLEAN DEFAULT true,
    is_auto_detect BOOLEAN DEFAULT false,
    auto_detect_days INTEGER DEFAULT 3,
    max_leads_per_day INTEGER DEFAULT 50,
    -- Meta
    total_executions INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Workflow Adımları
CREATE TABLE IF NOT EXISTS outreach_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES outreach_workflows(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    name TEXT,
    -- Aksiyon tipi
    action_type TEXT NOT NULL CHECK (action_type IN (
        'ai_call', 'whatsapp', 'sms', 'wait', 'status_update', 'notify', 'tag'
    )),
    -- Aksiyon konfigürasyonu (kanal bazlı farklı yapı)
    config JSONB NOT NULL DEFAULT '{}',
    -- Koşullu dallanma
    on_success TEXT DEFAULT 'next',
    on_failure TEXT DEFAULT 'next',
    on_no_answer TEXT DEFAULT 'next',
    on_busy TEXT DEFAULT 'retry',
    -- Meta
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Execution (Lead başına workflow çalıştırma kaydı)
CREATE TABLE IF NOT EXISTS outreach_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES outreach_workflows(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    -- Durum
    current_step_id UUID REFERENCES outreach_steps(id) ON DELETE SET NULL,
    current_step_order INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active' CHECK (status IN (
        'active', 'waiting', 'paused', 'completed', 'stopped', 'converted', 'opted_out'
    )),
    -- Zamanlama
    started_at TIMESTAMPTZ DEFAULT now(),
    next_action_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    -- Retry tracking
    current_retry_count INTEGER DEFAULT 0,
    -- Meta
    metadata JSONB DEFAULT '{}'
);

-- 6. Adım Çalışma Logları
CREATE TABLE IF NOT EXISTS outreach_step_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID REFERENCES outreach_executions(id) ON DELETE CASCADE,
    step_id UUID REFERENCES outreach_steps(id) ON DELETE SET NULL,
    attempt_number INTEGER DEFAULT 1,
    -- Kanal
    channel TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'sending', 'sent', 'delivered', 'read',
        'answered', 'no_answer', 'busy', 'voicemail',
        'failed', 'opted_out', 'converted', 'skipped'
    )),
    -- İçerik
    message_content TEXT,
    template_name TEXT,
    -- AI Call özel alanlar
    call_duration_seconds INTEGER,
    call_transcript TEXT,
    call_recording_url TEXT,
    call_outcome TEXT,
    call_summary TEXT,
    -- Yanıt
    customer_response TEXT,
    responded_at TIMESTAMPTZ,
    -- Referans
    external_id TEXT,
    error_message TEXT,
    cost_amount DECIMAL(10,4),
    cost_currency TEXT DEFAULT 'USD',
    -- Zamanlar
    scheduled_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- 7. Opt-out (İletişim reddi)
CREATE TABLE IF NOT EXISTS outreach_optouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    channel TEXT DEFAULT 'all' CHECK (channel IN ('whatsapp', 'ai_call', 'sms', 'all')),
    reason TEXT,
    opted_out_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_outreach_exec_next_action ON outreach_executions(next_action_at) WHERE status IN ('active', 'waiting');
CREATE INDEX IF NOT EXISTS idx_outreach_exec_sale ON outreach_executions(sale_id);
CREATE INDEX IF NOT EXISTS idx_outreach_exec_workflow ON outreach_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_outreach_exec_status ON outreach_executions(status);
CREATE INDEX IF NOT EXISTS idx_outreach_logs_exec ON outreach_step_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_outreach_logs_channel ON outreach_step_logs(channel);
CREATE INDEX IF NOT EXISTS idx_outreach_optouts_phone ON outreach_optouts(phone);
CREATE INDEX IF NOT EXISTS idx_outreach_optouts_customer ON outreach_optouts(customer_id);
CREATE INDEX IF NOT EXISTS idx_outreach_steps_workflow ON outreach_steps(workflow_id, step_order);

-- ============================================================
-- RLS (Row Level Security) Policies
-- ============================================================
ALTER TABLE outreach_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_step_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_optouts ENABLE ROW LEVEL SECURITY;

-- Tenant-scoped access for all outreach tables
CREATE POLICY "Tenant isolation for outreach_segments" ON outreach_segments
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant isolation for outreach_scripts" ON outreach_scripts
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant isolation for outreach_workflows" ON outreach_workflows
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant isolation for outreach_steps" ON outreach_steps
    FOR ALL USING (workflow_id IN (
        SELECT id FROM outreach_workflows WHERE tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Tenant isolation for outreach_executions" ON outreach_executions
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant isolation for outreach_step_logs" ON outreach_step_logs
    FOR ALL USING (execution_id IN (
        SELECT id FROM outreach_executions WHERE tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Tenant isolation for outreach_optouts" ON outreach_optouts
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
