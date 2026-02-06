-- Migration: Fix sale_id foreign key constraint in inbox_items
-- Created: 2026-02-05
-- Purpose: Allow sales to be deleted by setting the reference in inbox_items to NULL instead of blocking the deletion.

-- Drop existing constraint first (need to find the name or use the default)
-- Usually the name is 'inbox_items_sale_id_fkey' as seen in the error message
ALTER TABLE inbox_items DROP CONSTRAINT IF EXISTS inbox_items_sale_id_fkey;

-- Re-add with ON DELETE SET NULL
ALTER TABLE inbox_items 
ADD CONSTRAINT inbox_items_sale_id_fkey 
FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL;
