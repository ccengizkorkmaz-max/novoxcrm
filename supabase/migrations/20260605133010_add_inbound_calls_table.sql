-- Gelen aramaları kaydetmek için tablo (basitleştirilmiş)
CREATE TABLE IF NOT EXISTS inbound_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    caller_phone TEXT NOT NULL,
    caller_name TEXT,
    vapi_call_id TEXT UNIQUE,
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    duration INTEGER DEFAULT 0,
    status TEXT DEFAULT 'ringing',
    outcome TEXT,
    ended_reason TEXT,
    lead_score TEXT,
    interested BOOLEAN,
    transcript TEXT,
    summary TEXT,
    recording_url TEXT,
    cost NUMERIC(10, 4),
    analysis JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inbound_calls_tenant ON inbound_calls(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inbound_calls_phone ON inbound_calls(caller_phone);
CREATE INDEX IF NOT EXISTS idx_inbound_calls_started ON inbound_calls(started_at DESC);
