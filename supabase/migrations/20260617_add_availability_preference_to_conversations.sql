-- Add availability_preference to whatsapp_conversations table
ALTER TABLE whatsapp_conversations
ADD COLUMN IF NOT EXISTS availability_preference TEXT;
