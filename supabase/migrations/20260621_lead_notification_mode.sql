-- Advance CRM: Lead bildirim modu (WhatsApp ne zaman gönderilsin?)
-- 'immediate' = Lead oluştuğu anda gönder
-- 'on_conversion' = Lead müşteriye dönüştürüldüğünde gönder
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS lead_notification_mode text DEFAULT 'immediate';

-- Oikos tenant'ını güncelle
UPDATE tenants SET lead_notification_mode = 'immediate' 
WHERE id = '3de3c038-8ce7-44b1-b5ba-8b99d63301f4';
