-- Add level toggle flags to broker commission settings
ALTER TABLE public.broker_commission_settings
ADD COLUMN IF NOT EXISTS level_commission_multiplier_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS level_lead_lock_duration_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS level_auto_promotion_enabled BOOLEAN DEFAULT false;

-- Add bonus rate and lock duration details to broker levels
ALTER TABLE public.broker_levels
ADD COLUMN IF NOT EXISTS commission_bonus_rate DECIMAL(5, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS ownership_days INTEGER DEFAULT 90;
