-- CRM Settings: Müşteri adayları (leads) atamalarında temsilciye WhatsApp bildirimi gitsin mi?
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS wa_lead_assignment_notification_enabled boolean NOT NULL DEFAULT false;
