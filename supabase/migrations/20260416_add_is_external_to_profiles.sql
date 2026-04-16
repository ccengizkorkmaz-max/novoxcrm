-- Add is_external column to profiles table
-- External users are excluded from internal sales team,
-- auto-assignments, filters, and round-robin distributions.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_external boolean DEFAULT false;

-- Comment for clarity
COMMENT ON COLUMN profiles.is_external IS 'Dış kaynak kullanıcı. İşaretlenirse iç satış ekibine dahil olmaz, otomatik atamalarda ve filtrelerde gözükmez.';
