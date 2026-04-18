-- =====================================================
-- BELGE YÖNETİMİ (Document Management)
-- =====================================================

-- Doküman tablosu
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- İlişki (polymorphic)
    entity_type TEXT NOT NULL CHECK (entity_type IN ('portfolio', 'customer', 'sale', 'agent')),
    entity_id UUID NOT NULL,
    
    -- Dosya bilgileri
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER DEFAULT 0,
    file_type TEXT, -- mime type
    
    -- Kategori
    category TEXT NOT NULL DEFAULT 'other'
        CHECK (category IN (
            'authorization',    -- Yetki Belgesi
            'title_deed',       -- Tapu
            'identity',         -- Kimlik / Pasaport
            'contract',         -- Sözleşme
            'appraisal',        -- Ekspertiz Raporu
            'zoning',           -- İmar Durumu
            'floor_plan',       -- Kat Planı
            'energy_cert',      -- Enerji Kimlik Belgesi
            'insurance',        -- Sigorta
            'invoice',          -- Fatura
            'receipt',          -- Makbuz
            'photo',            -- Fotoğraf
            'other'             -- Diğer
        )),
    
    -- Meta
    description TEXT,
    expiry_date DATE,           -- Son kullanma tarihi (yetki belgesi vs.)
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES profiles(id),
    verified_at TIMESTAMPTZ,
    
    -- Yükleyen
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_expiry ON documents(expiry_date) WHERE expiry_date IS NOT NULL;

-- RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_tenant_isolation" ON documents
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    );

-- =====================================================
-- PAZARLAMA OTOMASYONU (Marketing Automation)
-- =====================================================

-- Kampanya tablosu
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'whatsapp')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
    
    -- Hedef kitle
    target_filter JSONB DEFAULT '{}',  -- { "status": "Lead", "source": "Sahibinden", ... }
    target_count INTEGER DEFAULT 0,
    
    -- İçerik
    subject TEXT,                       -- E-posta konusu
    body TEXT,                          -- İçerik (HTML veya plain text)
    template_id TEXT,                   -- Harici şablon ID
    
    -- Zamanlama
    schedule_type TEXT DEFAULT 'immediate' CHECK (schedule_type IN ('immediate', 'scheduled', 'drip')),
    scheduled_at TIMESTAMPTZ,
    drip_delay_hours INTEGER,           -- Drip kampanyalarda bekleme süresi
    drip_sequence INTEGER DEFAULT 1,    -- Drip'te kaçıncı adım
    parent_campaign_id UUID REFERENCES campaigns(id), -- Drip zinciri
    
    -- İstatistikler
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    
    -- Meta
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Kampanya alıcıları
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id),
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'failed')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- E-posta şablonları
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name TEXT NOT NULL,
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'listing', 'follow_up', 'welcome', 'birthday', 'anniversary', 'price_change')),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,         -- HTML template with {{variables}}
    variables JSONB DEFAULT '[]',  -- Available merge fields
    
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_tenant_isolation" ON campaigns
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "campaign_recipients_via_campaign" ON campaign_recipients
    FOR ALL USING (campaign_id IN (SELECT id FROM campaigns WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "email_templates_tenant_isolation" ON email_templates
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_customer ON campaign_recipients(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_tenant ON email_templates(tenant_id);

-- =====================================================
-- GELİŞMİŞ KOMİSYON SİSTEMİ
-- =====================================================

-- Komisyon planları
CREATE TABLE IF NOT EXISTS commission_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name TEXT NOT NULL,                -- Plan adı (örn: "Junior Plan", "Senior Plan")
    description TEXT,
    
    -- Split oranları
    agent_split_pct NUMERIC(5,2) NOT NULL DEFAULT 50,    -- Danışman payı %
    office_split_pct NUMERIC(5,2) NOT NULL DEFAULT 50,   -- Ofis payı %
    franchise_fee_pct NUMERIC(5,2) DEFAULT 0,            -- Franchise payı % (RE/MAX: 8%)
    
    -- CAP (Tavan)
    cap_enabled BOOLEAN DEFAULT false,
    cap_amount NUMERIC(12,2) DEFAULT 0,        -- Yıllık max ofis payı
    cap_period TEXT DEFAULT 'yearly' CHECK (cap_period IN ('yearly', 'quarterly', 'monthly')),
    
    -- Katmanlı split (tier-based)
    tier_enabled BOOLEAN DEFAULT false,
    tiers JSONB DEFAULT '[]',
    -- Örnek: [{"from": 0, "to": 500000, "agent_pct": 50}, {"from": 500000, "to": 1000000, "agent_pct": 60}, {"from": 1000000, "to": null, "agent_pct": 70}]
    
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Danışman → Plan eşleştirmesi
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS commission_plan_id UUID REFERENCES commission_plans(id);

-- RLS
ALTER TABLE commission_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commission_plans_tenant_isolation" ON commission_plans
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_commission_plans_tenant ON commission_plans(tenant_id);

-- =====================================================
-- AJAN WEB SİTESİ (Agent Profile Fields)
-- =====================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agent_slug TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agent_title TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agent_bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agent_cover_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agent_social_links JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agent_specializations JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agent_service_areas JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agent_certifications JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agent_years_experience INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agent_is_public BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_agent_slug ON profiles(agent_slug) WHERE agent_slug IS NOT NULL;

-- =====================================================
-- EĞİTİM / LMS MODÜLÜ
-- =====================================================

-- Kurslar
CREATE TABLE IF NOT EXISTS training_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'onboarding', 'sales', 'marketing', 'legal', 'technology', 'certification')),
    difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    
    thumbnail_url TEXT,
    duration_minutes INTEGER DEFAULT 0,
    
    -- İçerik
    content_type TEXT DEFAULT 'video' CHECK (content_type IN ('video', 'article', 'quiz', 'mixed')),
    content_url TEXT,           -- Video URL veya makale linki
    content_body TEXT,          -- Metin içeriği (markdown)
    
    -- Kurallar
    is_mandatory BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    passing_score INTEGER DEFAULT 70,  -- Quiz geçme notu (%)
    
    order_index INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Kurs modülleri (dersler)
CREATE TABLE IF NOT EXISTS training_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT DEFAULT 'video' CHECK (content_type IN ('video', 'article', 'quiz')),
    content_url TEXT,
    content_body TEXT,
    duration_minutes INTEGER DEFAULT 0,
    
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Quiz soruları
CREATE TABLE IF NOT EXISTS training_quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES training_lessons(id) ON DELETE CASCADE,
    
    question TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]',   -- ["Seçenek A", "Seçenek B", "Seçenek C", "Seçenek D"]
    correct_answer INTEGER NOT NULL DEFAULT 0,  -- Index of correct option
    explanation TEXT,
    
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Danışman ilerleme kaydı
CREATE TABLE IF NOT EXISTS training_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    course_id UUID NOT NULL REFERENCES training_courses(id),
    lesson_id UUID REFERENCES training_lessons(id),
    
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    score INTEGER,              -- Quiz skoru
    completed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE (user_id, course_id, lesson_id)
);

-- Sertifikalar
CREATE TABLE IF NOT EXISTS training_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    course_id UUID NOT NULL REFERENCES training_courses(id),
    
    certificate_number TEXT UNIQUE,
    issued_at TIMESTAMPTZ DEFAULT now(),
    score INTEGER,
    
    UNIQUE (user_id, course_id)
);

-- RLS
ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_courses_tenant" ON training_courses
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "training_lessons_via_course" ON training_lessons
    FOR ALL USING (course_id IN (SELECT id FROM training_courses WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "training_quiz_via_lesson" ON training_quiz_questions
    FOR ALL USING (lesson_id IN (SELECT id FROM training_lessons WHERE course_id IN (SELECT id FROM training_courses WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))));

CREATE POLICY "training_progress_own" ON training_progress
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "training_certificates_own" ON training_certificates
    FOR ALL USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_courses_tenant ON training_courses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_training_lessons_course ON training_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_user ON training_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_course ON training_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_training_certificates_user ON training_certificates(user_id);
