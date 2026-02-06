-- Create commission_rules table
CREATE TABLE IF NOT EXISTS public.commission_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role TEXT DEFAULT 'sales',
    source_category TEXT NOT NULL CHECK (source_category IN ('company', 'personal', 'personal_agent')),
    payment_type TEXT NOT NULL CHECK (payment_type IN ('cash', 'term')),
    rate NUMERIC NOT NULL, -- e.g. 0.02 for 2%
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(role, source_category, payment_type)
);

-- ROW LEVEL SECURITY for commission_rules
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.commission_rules
    FOR SELECT USING (true);

CREATE POLICY "Enable write access for admins" ON public.commission_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'owner', 'manager')
        )
    );

-- Create commissions table
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    rule_snapshot JSONB,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE
);

-- ROW LEVEL SECURITY for commissions
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own commissions" ON public.commissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can see all commissions" ON public.commissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'owner', 'manager')
        )
    );

-- Add columns to sales table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'lead_origin') THEN
        ALTER TABLE public.sales ADD COLUMN lead_origin TEXT CHECK (lead_origin IN ('company', 'personal', 'personal_agent')) DEFAULT 'company';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'payment_mode') THEN
        ALTER TABLE public.sales ADD COLUMN payment_mode TEXT CHECK (payment_mode IN ('cash', 'term')) DEFAULT 'term';
    END IF;
END $$;

-- Seed initial rules
INSERT INTO public.commission_rules (source_category, payment_type, rate, description) VALUES
('company', 'term', 0.02, 'Şirket Lead - Vadeli (%2)'),
('company', 'cash', 0.02, 'Şirket Lead - Peşin (%2)'),
('personal', 'term', 0.04, 'Bireysel - Vadeli (%4)'),
('personal', 'cash', 0.04, 'Bireysel - Peşin (%4)'),
('personal_agent', 'term', 0.01, 'Bireysel Emlakçı - Vadeli (%1)'),
('personal_agent', 'cash', 0.01, 'Bireysel Emlakçı - Peşin (%1)')
ON CONFLICT (role, source_category, payment_type) DO NOTHING;


-- FUNCTION: Calculate Commission on Deposit Payment
CREATE OR REPLACE FUNCTION public.calculate_commission_on_deposit()
RETURNS TRIGGER AS $$
DECLARE
  v_offer RECORD;
  v_sale RECORD;
  v_user_id UUID;
  v_rule RECORD;
  v_rate NUMERIC;
  v_commission_amount NUMERIC;
  v_lead_origin TEXT;
  v_payment_mode TEXT;
BEGIN
  -- Only run when status changes to 'Paid'
  IF (TG_OP = 'INSERT' AND NEW.status = 'Paid') OR (TG_OP = 'UPDATE' AND OLD.status != 'Paid' AND NEW.status = 'Paid') THEN
      
      -- 1. Find Offer
      SELECT * INTO v_offer FROM public.offers WHERE id = NEW.offer_id;
      IF NOT FOUND THEN 
        -- Raise notice or ignore?
        RETURN NEW; 
      END IF;
      
      -- 2. Find Sale
      SELECT * INTO v_sale FROM public.sales WHERE id = v_offer.sale_id;
      IF NOT FOUND THEN RETURN NEW; END IF;
      
      -- 3. Identify Sales Representative
      v_user_id := v_sale.assigned_to;
      IF v_user_id IS NULL THEN RETURN NEW; END IF; -- No rep, no commission
      
      -- 4. Determine Params with Fallbacks
      v_lead_origin := COALESCE(v_sale.lead_origin, 'company');
      v_payment_mode := COALESCE(v_sale.payment_mode, 'term');
      
      -- 5. Find Rule
      SELECT * INTO v_rule FROM public.commission_rules 
      WHERE source_category = v_lead_origin 
      AND payment_type = v_payment_mode
      LIMIT 1;
      
      IF FOUND THEN
         v_rate := v_rule.rate;
         v_commission_amount := NEW.amount * v_rate;
         
         -- 6. Insert Commission
         INSERT INTO public.commissions (sale_id, user_id, amount, status, rule_snapshot)
         VALUES (v_sale.id, v_user_id, v_commission_amount, 'pending', row_to_json(v_rule));
      END IF;
      
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DROP AND RECREATE TRIGGER
DROP TRIGGER IF EXISTS trigger_commission_on_deposit ON public.deposits;
CREATE TRIGGER trigger_commission_on_deposit
AFTER INSERT OR UPDATE ON public.deposits
FOR EACH ROW EXECUTE FUNCTION public.calculate_commission_on_deposit();
