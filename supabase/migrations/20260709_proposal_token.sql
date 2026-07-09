-- Tek Tık Teklif Motoru: Teklif paylaşım token'ı
-- Her teklife benzersiz bir public token atanır, müşteriye özel teklif sayfası için kullanılır

ALTER TABLE offers ADD COLUMN IF NOT EXISTS proposal_token TEXT UNIQUE;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS proposal_views INTEGER DEFAULT 0;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS proposal_last_viewed_at TIMESTAMPTZ;

-- Mevcut kayıtlara otomatik token ata
UPDATE offers 
SET proposal_token = substring(md5(random()::text || id::text) from 1 for 16)
WHERE proposal_token IS NULL;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_offers_proposal_token ON offers(proposal_token);

COMMENT ON COLUMN offers.proposal_token IS 'Unique public token for customer-facing proposal web page';
COMMENT ON COLUMN offers.proposal_views IS 'View count for the public proposal page';
COMMENT ON COLUMN offers.proposal_last_viewed_at IS 'Last time the public proposal page was viewed';
