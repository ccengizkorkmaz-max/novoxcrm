-- ============================================================
-- NovoCRM Online Meetings — Database Migration
-- ============================================================

-- Canlı toplantı & proje sunumu tablosu
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    -- Toplantı bilgileri
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'
    )),
    meeting_type TEXT DEFAULT 'project_presentation' CHECK (meeting_type IN (
        'project_presentation', 'sales_meeting', 'follow_up', 'general'
    )),
    -- Video konferans (Daily.co)
    daily_room_name TEXT,
    daily_room_url TEXT,
    host_token TEXT,
    guest_token TEXT,
    -- Zamanlama
    scheduled_at TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    -- Proje/Birim referansı
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    unit_ids UUID[],
    -- Katılımcılar
    host_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    -- Kayıt & Transkript
    recording_url TEXT,
    transcript TEXT,
    summary TEXT,
    -- Post-meeting
    notes TEXT,
    outcome TEXT CHECK (outcome IN (
        'interested', 'very_interested', 'needs_time', 'not_interested', 'follow_up'
    )),
    next_action TEXT,
    next_action_date TIMESTAMPTZ,
    -- Meta
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_meetings_tenant ON meetings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meetings_customer ON meetings(customer_id);
CREATE INDEX IF NOT EXISTS idx_meetings_host ON meetings(host_user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled ON meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_meetings_daily_room ON meetings(daily_room_name);

-- ============================================================
-- RLS (Row Level Security) Policies
-- ============================================================
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for meetings" ON meetings
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ));

-- Service role için full access (API routes)
CREATE POLICY "Service role full access for meetings" ON meetings
    FOR ALL USING (true) WITH CHECK (true);
