-- WhatsApp mesajlarında gönderen temsilcinin adını kaydetmek için
-- sender_name kolonu ekleniyor
ALTER TABLE whatsapp_messages
ADD COLUMN IF NOT EXISTS sender_name TEXT;

COMMENT ON COLUMN whatsapp_messages.sender_name IS 'Name of the agent/user who sent the outbound message';
