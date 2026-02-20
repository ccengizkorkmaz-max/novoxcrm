-- AI Asistan karakter ayarları için tenants tablosuna yeni kolonlar ekleme
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS ai_assistant_name text DEFAULT 'Novo AI',
ADD COLUMN IF NOT EXISTS ai_assistant_personality text DEFAULT 'Kurumsal, kibar ve çözüm odaklı',
ADD COLUMN IF NOT EXISTS ai_assistant_gender text DEFAULT 'female',
ADD COLUMN IF NOT EXISTS ai_assistant_instructions text;
