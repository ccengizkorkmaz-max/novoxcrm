-- Add customer_id to profiles to link portal users to customer records
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

-- Create index for faster portal data lookup
CREATE INDEX IF NOT EXISTS idx_profiles_customer_id ON profiles(customer_id);
