-- Migration: Create System Logs Table
-- Created: 2026-03-26
-- Purpose: Support transaction and error logging separated from notifications

CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    action_type TEXT NOT NULL, -- e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'ERROR'
    entity_type TEXT NOT NULL, -- e.g., 'Customer', 'Sale', 'Offer', 'System'
    entity_id UUID,            -- The ID of the affected record
    
    status TEXT NOT NULL CHECK (status IN ('Success', 'Error', 'Warning')),
    message TEXT NOT NULL,     -- Human readable summary 
    details JSONB,             -- Detailed JSON data (old/new values, stack trace etc.)
    
    ip_address TEXT,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_system_logs_tenant_id ON system_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_status ON system_logs(status);
CREATE INDEX IF NOT EXISTS idx_system_logs_entity ON system_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);

-- Enable RLS
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Policy: tenant users can view their tenant's logs (or strictly admin/owner)
CREATE POLICY "Admins and Owners can view system logs"
  ON system_logs FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()) 
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  );

-- Policy: System logs can be inserted by authenticated users (for auditing)
CREATE POLICY "Authenticated users can insert system logs"
  ON system_logs FOR INSERT
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

COMMENT ON TABLE system_logs IS 'Audit and transaction logs for the system';
