-- Add cancellation_reason to delivery_appointments
ALTER TABLE delivery_appointments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
