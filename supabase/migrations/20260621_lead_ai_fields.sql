-- Müşteri Adayları (Leads) AI Arama & Skorlama Entegrasyonu Şema Değişiklikleri
-- 1. Leads tablosuna AI arama ve skor alanlarının eklenmesi
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS sub_status text,
  ADD COLUMN IF NOT EXISTS lead_score text,
  ADD COLUMN IF NOT EXISTS last_call_at timestamptz,
  ADD COLUMN IF NOT EXISTS call_count integer NOT NULL DEFAULT 0;

-- 2. whatsapp_conversations tablosuna lead_id referansının eklenmesi
ALTER TABLE whatsapp_conversations 
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES leads(id) ON DELETE SET NULL;

-- 3. Performans için indekslerin oluşturulması
CREATE INDEX IF NOT EXISTS idx_leads_sub_status ON leads(sub_status) WHERE sub_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_last_call_at ON leads(last_call_at) WHERE last_call_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wa_conv_lead_id ON whatsapp_conversations(lead_id) WHERE lead_id IS NOT NULL;
