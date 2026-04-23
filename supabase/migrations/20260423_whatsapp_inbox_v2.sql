-- WhatsApp Messages tablosuna eksik sütunları ekle
-- Webhook route.ts'de tenant_id ve role alanları kullanılıyor

ALTER TABLE whatsapp_messages
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'assistant', 'system'));

-- Tenant tablosundaki sütun isimleri düzeltmesi (migration'da whatsapp_phone_number_id, kodda wa_phone_number_id)
-- Kodda wa_phone_number_id kullandık, migration'daki ismi düzeltelim
DO $$
BEGIN
    -- whatsapp_phone_number_id -> wa_phone_number_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='whatsapp_phone_number_id') THEN
        ALTER TABLE tenants RENAME COLUMN whatsapp_phone_number_id TO wa_phone_number_id;
    END IF;
    -- whatsapp_access_token -> wa_access_token
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='whatsapp_access_token') THEN
        ALTER TABLE tenants RENAME COLUMN whatsapp_access_token TO wa_access_token;
    END IF;
END $$;

-- sender_type'a 'bot' ekle (AI yanıtları sender_type='bot' olarak kaydediliyor)
ALTER TABLE whatsapp_messages DROP CONSTRAINT IF EXISTS whatsapp_messages_sender_type_check;
ALTER TABLE whatsapp_messages ADD CONSTRAINT whatsapp_messages_sender_type_check 
    CHECK (sender_type IN ('customer', 'ai', 'agent', 'system', 'bot'));
