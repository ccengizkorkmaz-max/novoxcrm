-- 1. Fix Contracts table schema (Add missing columns for CRM integration)
DO $$ 
BEGIN 
    -- sale_id ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='sale_id') THEN
        ALTER TABLE contracts ADD COLUMN sale_id UUID REFERENCES sales(id) ON DELETE CASCADE;
    END IF;

    -- unit_id ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='unit_id') THEN
        ALTER TABLE contracts ADD COLUMN unit_id UUID REFERENCES units(id) ON DELETE SET NULL;
    END IF;

    -- signed_amount zorunluluğunu kaldır (Eski kolon, yeni sistem amount kullanıyor)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='signed_amount') THEN
        ALTER TABLE contracts ALTER COLUMN signed_amount DROP NOT NULL;
    END IF;

    -- project_id ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='project_id') THEN
        ALTER TABLE contracts ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
    END IF;

    -- amount ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='amount') THEN
        ALTER TABLE contracts ADD COLUMN amount NUMERIC NOT NULL DEFAULT 0;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='signed_amount') THEN
            UPDATE contracts SET amount = signed_amount;
        END IF;
    END IF;

    -- final_amount ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='final_amount') THEN
        ALTER TABLE contracts ADD COLUMN final_amount NUMERIC NOT NULL DEFAULT 0;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='signed_amount') THEN
            UPDATE contracts SET final_amount = signed_amount;
        END IF;
    END IF;

    -- total_amount ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='total_amount') THEN
        ALTER TABLE contracts ADD COLUMN total_amount NUMERIC NOT NULL DEFAULT 0;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='signed_amount') THEN
            UPDATE contracts SET total_amount = signed_amount;
        END IF;
    END IF;

    -- delivery_date ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='delivery_date') THEN
        ALTER TABLE contracts ADD COLUMN delivery_date DATE;
    END IF;

    -- sales_rep_id ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='sales_rep_id') THEN
        ALTER TABLE contracts ADD COLUMN sales_rep_id UUID REFERENCES profiles(id);
    END IF;

    -- discount_rate ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='discount_rate') THEN
        ALTER TABLE contracts ADD COLUMN discount_rate NUMERIC DEFAULT 0;
    END IF;

    -- discount_amount ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='discount_amount') THEN
        ALTER TABLE contracts ADD COLUMN discount_amount NUMERIC DEFAULT 0;
    END IF;

    -- vat_rate ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='vat_rate') THEN
        ALTER TABLE contracts ADD COLUMN vat_rate NUMERIC DEFAULT 0;
    END IF;

    -- vat_amount ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='vat_amount') THEN
        ALTER TABLE contracts ADD COLUMN vat_amount NUMERIC DEFAULT 0;
    END IF;

    -- down_payment_amount ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='down_payment_amount') THEN
        ALTER TABLE contracts ADD COLUMN down_payment_amount NUMERIC DEFAULT 0;
    END IF;

    -- status ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='status') THEN
        ALTER TABLE contracts ADD COLUMN status TEXT DEFAULT 'Draft';
    END IF;

    -- type ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='type') THEN
        ALTER TABLE contracts ADD COLUMN type TEXT DEFAULT 'Sales';
    END IF;

    -- created_by ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='created_by') THEN
        ALTER TABLE contracts ADD COLUMN created_by UUID REFERENCES profiles(id);
    END IF;

    -- updated_at ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='updated_at') THEN
        ALTER TABLE contracts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 2. Add restarted_at to sales table to track one-time restart
ALTER TABLE sales ADD COLUMN IF NOT EXISTS restarted_at TIMESTAMPTZ;