-- Migration to fix payment_plan_templates table for Contracts module
DO $$ 
BEGIN
    -- Add tenant_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_plan_templates' AND column_name='tenant_id') THEN
        ALTER TABLE payment_plan_templates ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;

    -- Add unique constraint for seeding
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='payment_plan_templates_tenant_id_name_key') THEN
        ALTER TABLE payment_plan_templates ADD CONSTRAINT payment_plan_templates_tenant_id_name_key UNIQUE (tenant_id, name);
    END IF;
END $$;
