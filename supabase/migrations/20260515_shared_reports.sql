-- Shared Reports: password-protected, time-limited public report links
CREATE TABLE IF NOT EXISTS shared_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    report_type TEXT NOT NULL DEFAULT 'marketing', -- only 'marketing' for now
    password_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ, -- NULL = never expires
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_shared_reports_token ON shared_reports(token);

-- RLS: only tenant members can create/manage their own shared reports
ALTER TABLE shared_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage shared reports"
    ON shared_reports
    FOR ALL
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON shared_reports TO authenticated;
GRANT SELECT ON shared_reports TO service_role;
