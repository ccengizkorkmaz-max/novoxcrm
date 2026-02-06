-- Refine Commission Logic: Shift from deposits to payment_plans
-- Goal: Only commission Peşinat (DownPayment), exclude Kapora and Installments.

-- 1. Update Rules Descriptions
UPDATE public.commission_rules SET description = 'Şirket Lead - Peşinat (%2)' WHERE source_category = 'company' AND payment_type = 'term';
UPDATE public.commission_rules SET description = 'Şirket Lead - Tamamı Peşin (%2)' WHERE source_category = 'company' AND payment_type = 'cash';
UPDATE public.commission_rules SET description = 'Bireysel - Peşinat (%4)' WHERE source_category = 'personal' AND payment_type = 'term';
UPDATE public.commission_rules SET description = 'Bireysel - Tamamı Peşin (%4)' WHERE source_category = 'personal' AND payment_type = 'cash';

-- 2. Drop Old Trigger on Deposits
DROP TRIGGER IF EXISTS trigger_commission_on_deposit ON public.deposits;

-- 3. Create Refined Function for Payment Plans
CREATE OR REPLACE FUNCTION public.calculate_commission_on_payment_plan()
RETURNS TRIGGER AS $$
DECLARE
  v_contract RECORD;
  v_sale RECORD;
  v_user_id UUID;
  v_rule RECORD;
  v_rate NUMERIC;
  v_commission_amount NUMERIC;
  v_lead_origin TEXT;
  v_payment_mode TEXT;
BEGIN
  -- Only run when status changes to 'Paid' AND payment_type is 'DownPayment'
  IF (TG_OP = 'UPDATE' AND OLD.status != 'Paid' AND NEW.status = 'Paid' AND NEW.payment_type = 'DownPayment') OR 
     (TG_OP = 'INSERT' AND NEW.status = 'Paid' AND NEW.payment_type = 'DownPayment') THEN
      
      -- 1. Find Contract
      SELECT * INTO v_contract FROM public.contracts WHERE id = NEW.contract_id;
      IF NOT FOUND THEN RETURN NEW; END IF;
      
      -- 2. Find Sales Rep ID
      v_user_id := v_contract.sales_rep_id;
      IF v_user_id IS NULL THEN RETURN NEW; END IF;
      
      -- 3. Find Sale (to get lead origin)
      -- Note: In this system, contracts are tied to units. We find the active sale for this unit.
      SELECT * INTO v_sale FROM public.sales WHERE unit_id = v_contract.unit_id AND status IN ('Completed', 'Sold') ORDER BY created_at DESC LIMIT 1;
      
      -- 4. Determine Params
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

-- 4. Create New Trigger on Payment Plans
DROP TRIGGER IF EXISTS trigger_commission_on_payment_plan ON public.payment_plans;
CREATE TRIGGER trigger_commission_on_payment_plan
AFTER INSERT OR UPDATE ON public.payment_plans
FOR EACH ROW EXECUTE FUNCTION public.calculate_commission_on_payment_plan();
