-- ============================================================
-- OPT-OUT AUDIT LOG TABLE
-- Her opt-out ekleme/kaldırma işlemini loglar
-- ============================================================
CREATE TABLE IF NOT EXISTS outreach_optout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    phone TEXT,
    channel TEXT CHECK (channel IN ('whatsapp', 'ai_call', 'sms', 'email', 'all')),
    action TEXT NOT NULL CHECK (action IN ('opted_out', 'opted_in')),
    reason TEXT,
    performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    performed_by_name TEXT,
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'ai_call', 'whatsapp_campaign', 'system', 'crm_toggle')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_optout_logs_customer ON outreach_optout_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_optout_logs_phone ON outreach_optout_logs(phone);
CREATE INDEX IF NOT EXISTS idx_optout_logs_created ON outreach_optout_logs(created_at DESC);

-- RLS
ALTER TABLE outreach_optout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for outreach_optout_logs" ON outreach_optout_logs
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Grants
GRANT SELECT, INSERT ON public.outreach_optout_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_optout_logs TO service_role;

-- Email kanalını mevcut optouts tablosuna da ekle
ALTER TABLE outreach_optouts DROP CONSTRAINT IF EXISTS outreach_optouts_channel_check;
ALTER TABLE outreach_optouts ADD CONSTRAINT outreach_optouts_channel_check 
    CHECK (channel IN ('whatsapp', 'ai_call', 'sms', 'email', 'all'));
