-- ==========================================================
-- ENFORCE DUPLICATE SALES VALIDATION
-- ==========================================================

CREATE OR REPLACE FUNCTION check_duplicate_sales()
RETURNS TRIGGER AS $$
BEGIN
  -- We only apply duplicate checks for ACTIVE sales (not Lost, Sold, or Completed, and not Restarted)
  -- If the record being inserted/updated is itself inactive, we do not check.
  IF NEW.status IN ('Lost', 'Sold', 'Completed') OR NEW.restarted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Rule 1: Same Customer + Same Project + Same Unit (where all are provided)
  IF NEW.customer_id IS NOT NULL AND NEW.project_id IS NOT NULL AND NEW.unit_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM sales
      WHERE customer_id = NEW.customer_id
        AND project_id = NEW.project_id
        AND unit_id = NEW.unit_id
        AND status NOT IN ('Lost', 'Sold', 'Completed')
        AND restarted_at IS NULL
        AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'Bu müşteri için bu projede ve ünitede zaten aktif bir satış kaydı mevcuttur.';
    END IF;
  END IF;

  -- Rule 2: Same Customer + Same Project + No Unit (only project name)
  IF NEW.customer_id IS NOT NULL AND NEW.project_id IS NOT NULL AND NEW.unit_id IS NULL THEN
    IF EXISTS (
      SELECT 1 FROM sales
      WHERE customer_id = NEW.customer_id
        AND project_id = NEW.project_id
        AND unit_id IS NULL
        AND status NOT IN ('Lost', 'Sold', 'Completed')
        AND restarted_at IS NULL
        AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'Bu müşteri için bu projede ünitesiz genel bir satış kaydı zaten mevcuttur. İkinci bir genel satış kaydı açılamaz.';
    END IF;
  END IF;

  -- Rule 3: Same Customer + No Project + No Unit
  IF NEW.customer_id IS NOT NULL AND NEW.project_id IS NULL AND NEW.unit_id IS NULL THEN
    IF EXISTS (
      SELECT 1 FROM sales
      WHERE customer_id = NEW.customer_id
        AND project_id IS NULL
        AND unit_id IS NULL
        AND status NOT IN ('Lost', 'Sold', 'Completed')
        AND restarted_at IS NULL
        AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'Bu müşteri için proje ve ünite bilgisi olmayan genel bir satış kaydı zaten mevcuttur. İkinci bir genel satış kaydı açılamaz.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trg_check_duplicate_sales ON sales;

-- Create trigger BEFORE INSERT OR UPDATE
CREATE TRIGGER trg_check_duplicate_sales
BEFORE INSERT OR UPDATE ON sales
FOR EACH ROW
EXECUTE FUNCTION check_duplicate_sales();
