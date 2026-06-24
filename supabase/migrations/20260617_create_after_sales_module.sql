-- 1. Create Subcontractors Table
CREATE TABLE IF NOT EXISTS subcontractors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Plumbing', 'Electrical', 'Paint', 'Carpentry', 'Zemin', 'HVAC' etc.
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Snag Items (Defects) Table
CREATE TABLE IF NOT EXISTS snag_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    service_request_id UUID REFERENCES service_requests(id) ON DELETE SET NULL,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    subcontractor_id UUID REFERENCES subcontractors(id) ON DELETE SET NULL,
    priority TEXT DEFAULT 'Normal', -- 'Low', 'Normal', 'High', 'Urgent'
    status TEXT DEFAULT 'Pending', -- 'Pending', 'In Progress', 'Repaired', 'Verified', 'Cancelled'
    photo_before_url TEXT,
    photo_after_url TEXT,
    scheduled_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Delivery Appointments Table
CREATE TABLE IF NOT EXISTS delivery_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    appointment_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'Scheduled', -- 'Scheduled', 'Completed', 'Cancelled', 'No Show'
    notes TEXT,
    checklist_items JSONB DEFAULT '[]'::jsonb,
    initial_meter_readings JSONB DEFAULT '{}'::jsonb,
    protocol_pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Warranty Tracking Table
CREATE TABLE IF NOT EXISTS warranty_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    duration_months INTEGER NOT NULL DEFAULT 12,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    provider_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Service Request Feedback (CSAT) Table
CREATE TABLE IF NOT EXISTS service_request_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    service_request_id UUID UNIQUE NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable RLS
ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE snag_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_request_feedback ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
-- Subcontractors Policies
CREATE POLICY "Tenant users can manage subcontractors in their tenant"
ON subcontractors FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Snag Items Policies
CREATE POLICY "Tenant users can manage snag items in their tenant"
ON snag_items FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Customers can view their own snag items"
ON snag_items FOR SELECT
USING (unit_id IN (
    SELECT unit_id FROM sales WHERE customer_id IN (SELECT customer_id FROM profiles WHERE id = auth.uid())
));

-- Delivery Appointments Policies
CREATE POLICY "Tenant users can manage delivery appointments in their tenant"
ON delivery_appointments FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Customers can view their own delivery appointments"
ON delivery_appointments FOR SELECT
USING (customer_id IN (SELECT customer_id FROM profiles WHERE id = auth.uid()));

-- Warranty Tracking Policies
CREATE POLICY "Tenant users can manage warranty tracking in their tenant"
ON warranty_tracking FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Customers can view their own unit's warranties"
ON warranty_tracking FOR SELECT
USING (unit_id IN (
    SELECT unit_id FROM sales WHERE customer_id IN (SELECT customer_id FROM profiles WHERE id = auth.uid())
));

-- Service Request Feedback Policies
CREATE POLICY "Tenant users can view feedback in their tenant"
ON service_request_feedback FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Customers can view/create their own service request feedback"
ON service_request_feedback FOR ALL
USING (service_request_id IN (
    SELECT id FROM service_requests WHERE customer_id IN (SELECT customer_id FROM profiles WHERE id = auth.uid())
));

-- 8. Grants for API Access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subcontractors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subcontractors TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.snag_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.snag_items TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_appointments TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.warranty_tracking TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.warranty_tracking TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_request_feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_request_feedback TO service_role;
