-- Add communication toggle to customers
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS communication_enabled boolean DEFAULT true;

COMMENT ON COLUMN customers.communication_enabled IS 'false ise bu müşteriye hiçbir kanaldan iletişim yapılmaz (arama, WhatsApp, SMS vb.)';
