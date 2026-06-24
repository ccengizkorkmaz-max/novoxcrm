-- ==========================================================
-- AUTOMATIC SYNC BETWEEN SALES AND OPPORTUNITIES
-- ==========================================================

-- Function to handle inserts and updates on sales
CREATE OR REPLACE FUNCTION sync_sales_to_opportunities()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
DECLARE
  v_crm_mode TEXT;
  v_customer_name TEXT;
  v_project_name TEXT;
  v_opp_title TEXT;
  v_stage TEXT;
BEGIN
  -- Get crm_mode for this tenant
  SELECT crm_mode INTO v_crm_mode FROM tenants WHERE id = NEW.tenant_id;
  
  -- If crm_mode is not 'advance', do nothing
  IF v_crm_mode <> 'advance' THEN
    RETURN NEW;
  END IF;

  -- Map sales status to opportunity stage
  IF NEW.status = 'Lead' OR NEW.status = 'Prospect' THEN
    v_stage := 'prospect';
  ELSIF NEW.status = 'Proposal' OR NEW.status = 'Teklif - Kapora Bekleniyor' OR NEW.status LIKE '%Teklif%' THEN
    v_stage := 'proposal';
  ELSIF NEW.status = 'Negotiation' OR NEW.status = 'Contract' THEN
    v_stage := 'negotiation';
  ELSIF NEW.status = 'Sold' OR NEW.status = 'Completed' THEN
    v_stage := 'won';
  ELSIF NEW.status = 'Lost' THEN
    v_stage := 'lost';
  ELSIF NEW.status = 'Reservation' OR NEW.status = 'Opsiyon - Kapora Bekleniyor' OR NEW.status LIKE '%Opsiyon%' THEN
    v_stage := 'reservation';
  ELSE
    v_stage := 'prospect';
  END IF;

  -- If it's an update and the status changed
  IF TG_OP = 'UPDATE' THEN
    -- Only sync if status or project_id or customer_id or assigned_to changed
    IF OLD.status IS DISTINCT FROM NEW.status OR OLD.project_id IS DISTINCT FROM NEW.project_id OR OLD.customer_id IS DISTINCT FROM NEW.customer_id OR OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      -- Try to update existing opportunity
      UPDATE opportunities
      SET 
        stage = v_stage,
        project_id = NEW.project_id,
        assigned_to = NEW.assigned_to,
        updated_at = now()
      WHERE tenant_id = NEW.tenant_id
        AND customer_id = NEW.customer_id
        AND (project_id = NEW.project_id OR (project_id IS NULL AND NEW.project_id IS NULL));
        
      -- If no rows updated, we can create one
      IF NOT FOUND THEN
        -- Get customer name
        SELECT full_name INTO v_customer_name FROM customers WHERE id = NEW.customer_id;
        -- Get project name
        IF NEW.project_id IS NOT NULL THEN
          SELECT name INTO v_project_name FROM projects WHERE id = NEW.project_id;
        END IF;
        
        IF v_project_name IS NOT NULL AND v_project_name <> '' THEN
          v_opp_title := v_customer_name || ' - ' || v_project_name;
        ELSE
          v_opp_title := v_customer_name || ' - Fırsat';
        END IF;

        INSERT INTO opportunities (tenant_id, customer_id, title, stage, project_id, assigned_to, created_at, updated_at)
        VALUES (NEW.tenant_id, NEW.customer_id, v_opp_title, v_stage, NEW.project_id, NEW.assigned_to, now(), now());
      END IF;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    -- Get customer name
    SELECT full_name INTO v_customer_name FROM customers WHERE id = NEW.customer_id;
    -- Get project name
    IF NEW.project_id IS NOT NULL THEN
      SELECT name INTO v_project_name FROM projects WHERE id = NEW.project_id;
    END IF;
    
    IF v_project_name IS NOT NULL AND v_project_name <> '' THEN
      v_opp_title := v_customer_name || ' - ' || v_project_name;
    ELSE
      v_opp_title := v_customer_name || ' - Fırsat';
    END IF;

    -- Create opportunity
    INSERT INTO opportunities (tenant_id, customer_id, title, stage, project_id, assigned_to, created_at, updated_at)
    VALUES (NEW.tenant_id, NEW.customer_id, v_opp_title, v_stage, NEW.project_id, NEW.assigned_to, now(), now());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Delete trigger function
CREATE OR REPLACE FUNCTION delete_opportunity_on_sale_delete()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
DECLARE
  v_crm_mode TEXT;
BEGIN
  SELECT crm_mode INTO v_crm_mode FROM tenants WHERE id = OLD.tenant_id;
  IF v_crm_mode = 'advance' THEN
    DELETE FROM opportunities
    WHERE tenant_id = OLD.tenant_id
      AND customer_id = OLD.customer_id
      AND (project_id = OLD.project_id OR (project_id IS NULL AND OLD.project_id IS NULL));
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers
DROP TRIGGER IF EXISTS trg_sync_sales_to_opportunities ON sales;
CREATE TRIGGER trg_sync_sales_to_opportunities
AFTER INSERT OR UPDATE ON sales
FOR EACH ROW
EXECUTE FUNCTION sync_sales_to_opportunities();

DROP TRIGGER IF EXISTS trg_delete_opportunity_on_sale_delete ON sales;
CREATE TRIGGER trg_delete_opportunity_on_sale_delete
AFTER DELETE ON sales
FOR EACH ROW
EXECUTE FUNCTION delete_opportunity_on_sale_delete();
