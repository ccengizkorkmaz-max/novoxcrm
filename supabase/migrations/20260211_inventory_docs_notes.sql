-- =====================================================
-- INVENTORY DOCUMENTS & NOTES
-- =====================================================

-- 1. Unit Documents Table
CREATE TABLE IF NOT EXISTS unit_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT, -- pdf, jpg, docx etc.
    size_bytes BIGINT,
    tenant_id UUID NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Documents
ALTER TABLE unit_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for unit_documents"
    ON unit_documents FOR ALL
    USING (tenant_id = (SELECT (auth.jwt()->'user_metadata'->>'tenant_id')::uuid));

-- 2. Storage Bucket for Documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('unit-documents', 'unit-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can upload unit documents'
    ) THEN
        CREATE POLICY "Authenticated users can upload unit documents"
            ON storage.objects FOR INSERT
            WITH CHECK (bucket_id = 'unit-documents' AND auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Anyone can view unit documents'
    ) THEN
        CREATE POLICY "Anyone can view unit documents"
            ON storage.objects FOR SELECT
            USING (bucket_id = 'unit-documents');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can delete unit documents'
    ) THEN
        CREATE POLICY "Authenticated users can delete unit documents"
            ON storage.objects FOR DELETE
            USING (bucket_id = 'unit-documents' AND auth.role() = 'authenticated');
    END IF;
END $$;


-- 3. Unit Notes (Internal Communication)
CREATE TABLE IF NOT EXISTS unit_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    tenant_id UUID NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Notes
ALTER TABLE unit_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for unit_notes"
    ON unit_notes FOR ALL
    USING (tenant_id = (SELECT (auth.jwt()->'user_metadata'->>'tenant_id')::uuid));

-- Indexing
CREATE INDEX IF NOT EXISTS idx_unit_documents_unit_id ON unit_documents(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_notes_unit_id ON unit_notes(unit_id);
