-- ============================================================
-- DISABLE AI BY DEFAULT IN WHATSAPP CONVERSATIONS
-- ============================================================

-- 1. Alter default value of ai_enabled to false
ALTER TABLE whatsapp_conversations ALTER COLUMN ai_enabled SET DEFAULT false;

-- 2. Turn off AI for all existing conversations
UPDATE whatsapp_conversations 
SET ai_enabled = false 
WHERE ai_enabled IS TRUE OR ai_enabled IS NULL;
