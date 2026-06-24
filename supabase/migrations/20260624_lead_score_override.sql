-- Migration: Lead Score Manuel Override ve Geçmiş Takibi
-- 1. Leads tablosuna manuel skor kontrol kolonlarının eklenmesi
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS lead_score_ai text,
  ADD COLUMN IF NOT EXISTS lead_score_source text DEFAULT 'ai',
  ADD COLUMN IF NOT EXISTS lead_score_history jsonb DEFAULT '[]'::jsonb;

-- Check constraint for lead_score_source
DO $$ BEGIN
  ALTER TABLE leads ADD CONSTRAINT leads_lead_score_source_check 
    CHECK (lead_score_source IN ('ai', 'manual'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Lead Qualifications tablosuna manuel skor kontrol kolonlarının eklenmesi
ALTER TABLE lead_qualifications
  ADD COLUMN IF NOT EXISTS interest_level_ai text,
  ADD COLUMN IF NOT EXISTS interest_level_source text DEFAULT 'ai',
  ADD COLUMN IF NOT EXISTS interest_level_history jsonb DEFAULT '[]'::jsonb;

-- Check constraint for interest_level_source
DO $$ BEGIN
  ALTER TABLE lead_qualifications ADD CONSTRAINT lq_interest_level_source_check 
    CHECK (interest_level_source IN ('ai', 'manual'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Mevcut verilerin güncellenmesi (Orijinal AI skoru atama)
UPDATE leads 
SET lead_score_ai = lead_score
WHERE lead_score IS NOT NULL AND lead_score_ai IS NULL;

UPDATE lead_qualifications
SET interest_level_ai = interest_level
WHERE interest_level IS NOT NULL AND interest_level_ai IS NULL;
