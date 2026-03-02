-- Migration: Create Tenant Email Accounts
-- Created: 2026-03-02

CREATE TABLE IF NOT EXISTS tenant_email_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    
    -- Account Info
    account_name TEXT NOT NULL, -- e.g. "Satis Birimi", "Destek"
    email_address TEXT NOT NULL,
    
    -- SMTP Details (Outgoing)
    smtp_host TEXT,
    smtp_port INTEGER DEFAULT 587,
    smtp_user TEXT,
    smtp_password TEXT,
    smtp_encryption TEXT DEFAULT 'TLS', -- TLS, SSL, None
    
    -- Incoming Details (POP3/IMAP)
    incoming_host TEXT,
    incoming_port INTEGER DEFAULT 995,
    incoming_user TEXT,
    incoming_password TEXT,
    incoming_protocol TEXT DEFAULT 'POP3', -- POP3, IMAP
    incoming_encryption TEXT DEFAULT 'SSL', -- SSL, TLS, None
    
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE tenant_email_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant owners can manage email accounts"
  ON tenant_email_accounts FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- Index
CREATE INDEX IF NOT EXISTS idx_tenant_email_accounts_tenant ON tenant_email_accounts(tenant_id);
