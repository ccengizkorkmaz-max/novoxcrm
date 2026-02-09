-- Add created_by column to customers table
-- This allows tracking which user registered the customer for lead attribution/commission logic.

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Index for performance in lookup/filtering
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON public.customers(created_by);

-- Optional: Comments for clarity
COMMENT ON COLUMN public.customers.created_by IS 'The user who originally registered/added this customer.';
