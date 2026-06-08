-- Yedekleme geçmişini takip eden tablo
CREATE TABLE IF NOT EXISTS backup_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    backup_type TEXT NOT NULL DEFAULT 'manual', -- manual, auto, restore
    status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, completed, failed
    file_name TEXT,
    file_size_bytes BIGINT,
    storage_path TEXT,
    tables_included JSONB DEFAULT '{}',
    table_count INTEGER DEFAULT 0,
    record_count INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_backup_history_tenant ON backup_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_backup_history_created ON backup_history(created_at DESC);

-- RLS
ALTER TABLE backup_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backup_history_tenant_isolation" ON backup_history
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );
