-- Yeni WhatsApp Gelen Kutusu ve Native Chatbot Altyapısı

-- 1. Tenant tablosuna WhatsApp ve AI ayarları için yeni sütunlar
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS whatsapp_access_token TEXT,
ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(50) DEFAULT 'openai', -- openai, gemini, anthropic
ADD COLUMN IF NOT EXISTS ai_api_key TEXT,
ADD COLUMN IF NOT EXISTS ai_system_prompt TEXT DEFAULT 'Sen profesyonel bir emlak asistanısın. Kısa ve net cevaplar ver.';

-- 2. Sohbet Odaları Tablosu (Conversations)
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    phone_number VARCHAR(50) NOT NULL, -- Müşterinin telefon numarası
    ai_enabled BOOLEAN DEFAULT true, -- Satış danışmanı devraldığında false yapılır
    unread_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_message_preview TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Hızlı aramalar için indeksler
CREATE INDEX IF NOT EXISTS idx_wa_conv_tenant ON whatsapp_conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wa_conv_phone ON whatsapp_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_wa_conv_last_msg ON whatsapp_conversations(last_message_at DESC);

-- 3. Mesajlar Tablosu (Messages)
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    wa_message_id VARCHAR(255), -- Meta'dan gelen gerçek mesaj ID'si (wamid.xxxx)
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'ai', 'agent', 'system')),
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'received')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wa_msgs_conv ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_wa_msgs_created ON whatsapp_messages(created_at ASC);

-- RLS (Row Level Security) Politikaları
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversations in their tenant" 
    ON whatsapp_conversations FOR SELECT 
    USING (tenant_id = auth.uid());

CREATE POLICY "Users can manage conversations in their tenant" 
    ON whatsapp_conversations FOR ALL 
    USING (tenant_id = auth.uid());

CREATE POLICY "Users can view messages in their tenant" 
    ON whatsapp_messages FOR SELECT 
    USING (conversation_id IN (SELECT id FROM whatsapp_conversations WHERE tenant_id = auth.uid()));

CREATE POLICY "Users can manage messages in their tenant" 
    ON whatsapp_messages FOR ALL 
    USING (conversation_id IN (SELECT id FROM whatsapp_conversations WHERE tenant_id = auth.uid()));

-- Realtime izleme için mesajlar tablosunu yayına al
alter publication supabase_realtime add table whatsapp_conversations;
alter publication supabase_realtime add table whatsapp_messages;
