-- Migration: Create inbox_items table for web form lead storage
-- Created: 2026-02-05
-- Purpose: Store incoming web form emails without auto-creating customers/sales

-- Create inbox_items table
CREATE TABLE IF NOT EXISTS inbox_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Raw email/form data
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT,
  source TEXT DEFAULT 'WEB Form',
  
  -- Metadata
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES profiles(id),
  
  -- Link to created sale after approval
  sale_id UUID REFERENCES sales(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inbox_items_tenant ON inbox_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inbox_items_status ON inbox_items(status);
CREATE INDEX IF NOT EXISTS idx_inbox_items_created ON inbox_items(created_at DESC);

-- Enable RLS
ALTER TABLE inbox_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view inbox items in their tenant"
  ON inbox_items FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert inbox items in their tenant"
  ON inbox_items FOR INSERT
  WITH CHECK (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update inbox items in their tenant"
  ON inbox_items FOR UPDATE
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete inbox items in their tenant"
  ON inbox_items FOR DELETE
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Comment
COMMENT ON TABLE inbox_items IS 'Stores incoming web form leads before approval and CRM entry';
