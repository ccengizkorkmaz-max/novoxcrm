-- 1. Add portal toggle to tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS customer_portal_enabled BOOLEAN DEFAULT FALSE;

-- 2. Link profiles to customers for portal access
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE CASCADE;

-- 3. Service Requests Table
CREATE TABLE IF NOT EXISTS service_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'Normal', -- 'Low', 'Normal', 'High', 'Urgent'
    status TEXT DEFAULT 'Open', -- 'Open', 'In Progress', 'Resolved', 'Closed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Delivery Status Tracking
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'Pending'; -- 'Pending', 'In Progress', 'Ready', 'Delivered'
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS title_deed_status TEXT DEFAULT 'Pending'; -- 'Pending', 'In Progress', 'Ready', 'Handed Over'

-- 5. Enable RLS
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for Service Requests
CREATE POLICY "Customers can view only their own service requests"
ON service_requests FOR SELECT
USING (customer_id IN (SELECT customer_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Customers can create their own service requests"
ON service_requests FOR INSERT
WITH CHECK (customer_id IN (SELECT customer_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant users can manage their own tenant service requests"
ON service_requests FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 7. RLS for Contracts (Allow customers to see their own)
CREATE POLICY "Customers can view their own contracts"
ON contracts FOR SELECT
USING (sale_id IN (SELECT id FROM sales WHERE customer_id IN (SELECT customer_id FROM profiles WHERE id = auth.uid())));

-- 8. RLS for Payment Items (Allow customers to see their own)
CREATE POLICY "Customers can view their own payments"
ON payment_items FOR SELECT
USING (payment_plan_id IN (
    SELECT id FROM payment_plans WHERE contract_id IN (
        SELECT id FROM contracts WHERE sale_id IN (
            SELECT id FROM sales WHERE customer_id IN (
                SELECT customer_id FROM profiles WHERE id = auth.uid()
            )
        )
    )
));
