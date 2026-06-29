CREATE TABLE IF NOT EXISTS campaign_daily_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    campaign_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    spend NUMERIC DEFAULT 0,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    ctr NUMERIC DEFAULT 0,
    leads INT DEFAULT 0,
    cpl NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, stat_date, campaign_name)
);

CREATE INDEX IF NOT EXISTS idx_campaign_daily_stats_tenant_date 
    ON campaign_daily_stats(tenant_id, stat_date DESC);

-- Enable RLS
ALTER TABLE campaign_daily_stats ENABLE ROW LEVEL SECURITY;

-- Select policy
DO $$ BEGIN
    CREATE POLICY "Users can read own tenant campaign stats"
        ON campaign_daily_stats FOR SELECT
        TO authenticated
        USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Insert policy
DO $$ BEGIN
    CREATE POLICY "Users can insert own tenant campaign stats"
        ON campaign_daily_stats FOR INSERT
        TO authenticated
        WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Update policy
DO $$ BEGIN
    CREATE POLICY "Users can update own tenant campaign stats"
        ON campaign_daily_stats FOR UPDATE
        TO authenticated
        USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
