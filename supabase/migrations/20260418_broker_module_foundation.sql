-- ==========================================
-- 🏢 ACENTE (BROKERAGE) MODÜLÜ TEMELLERİ
-- ==========================================

-- 1. Tenant türü ayrımı: developer (müteahhit) veya broker (acente)
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS tenant_type TEXT DEFAULT 'developer'
    CHECK (tenant_type IN ('developer', 'broker'));

-- Mevcut firmalar müteahhit olarak kalsın
UPDATE public.tenants SET tenant_type = 'developer' WHERE tenant_type IS NULL;

-- 2. Portföyler (İkinci El Mülkler) - Acente modülü çekirdek tablosu
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES auth.users(id),       -- Hangi danışmana ait
    
    -- Temel mülk bilgileri
    title TEXT NOT NULL,                            -- "Beşiktaş'ta Deniz Manzaralı 3+1"
    listing_type TEXT NOT NULL DEFAULT 'sale'        -- sale | rent
        CHECK (listing_type IN ('sale', 'rent')),
    property_type TEXT NOT NULL DEFAULT 'apartment'  -- apartment | villa | land | commercial | office
        CHECK (property_type IN ('apartment', 'villa', 'land', 'commercial', 'office')),
    
    -- Konum
    city TEXT,
    district TEXT,
    neighborhood TEXT,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    
    -- Mülk detayları
    room_count TEXT,                                 -- "3+1", "2+1", "Studio"
    floor_number INTEGER,
    total_floors INTEGER,
    building_age INTEGER,
    area_gross DECIMAL(10, 2),
    area_net DECIMAL(10, 2),
    
    -- Fiyat
    price DECIMAL(15, 2),
    currency TEXT DEFAULT 'TRY',
    price_negotiable BOOLEAN DEFAULT true,
    
    -- Durum
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'pending', 'sold', 'rented', 'withdrawn', 'expired')),
    
    -- Yetki Sözleşmesi
    authorization_start DATE,
    authorization_end DATE,
    authorization_type TEXT DEFAULT 'exclusive'       -- exclusive | open
        CHECK (authorization_type IN ('exclusive', 'open')),
    owner_name TEXT,
    owner_phone TEXT,
    owner_email TEXT,
    
    -- Özellikler (dinamik)
    features JSONB DEFAULT '{}',                     -- { "balcony": true, "parking": "indoor", "heating": "central" }
    custom_fields JSONB DEFAULT '{}',                -- Tenant bazlı özel alanlar
    
    -- İstatistikler
    view_count INTEGER DEFAULT 0,
    inquiry_count INTEGER DEFAULT 0,
    showing_count INTEGER DEFAULT 0,
    
    -- Meta
    description TEXT,
    internal_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portföy görselleri
CREATE TABLE IF NOT EXISTS public.portfolio_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    caption TEXT,
    is_cover BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Lead Yönlendirme Kuralları (Speed-to-Lead)
CREATE TABLE IF NOT EXISTS public.lead_routing_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    routing_type TEXT NOT NULL DEFAULT 'round_robin'
        CHECK (routing_type IN ('round_robin', 'shark_tank', 'manual', 'area_based')),
    
    timeout_minutes INTEGER DEFAULT 15,              -- Shark tank: kaç dk sonra başkasına geçsin
    is_active BOOLEAN DEFAULT true,
    
    config JSONB DEFAULT '{}',                       -- Ek kurallar (bölgeye göre atama vb.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Komisyon Bölüşüm Ayarları (Broker Settings)
CREATE TABLE IF NOT EXISTS public.broker_commission_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    default_split_office DECIMAL(5, 2) DEFAULT 40.00,   -- Ofis payı %
    default_split_agent DECIMAL(5, 2) DEFAULT 60.00,    -- Danışman payı %
    
    cap_enabled BOOLEAN DEFAULT false,                    -- Yıllık Cap sistemi aktif mi
    cap_amount DECIMAL(15, 2) DEFAULT 0,                  -- Cap miktarı (TRY)
    cap_split_after_office DECIMAL(5, 2) DEFAULT 10.00,   -- Cap sonrası Ofis payı %
    cap_split_after_agent DECIMAL(5, 2) DEFAULT 90.00,    -- Cap sonrası Danışman payı %
    
    desk_fee_monthly DECIMAL(10, 2) DEFAULT 0,           -- Aylık masa ücreti
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Danışman Satış İşlemleri (Agent Transactions / Hakediş)
CREATE TABLE IF NOT EXISTS public.agent_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    portfolio_id UUID REFERENCES public.portfolios(id),
    
    -- İşlem tarafları
    listing_agent_id UUID REFERENCES auth.users(id),    -- Portföyü alan danışman
    buyer_agent_id UUID REFERENCES auth.users(id),      -- Müşteriyi getiren danışman
    customer_id UUID REFERENCES public.customers(id),
    
    -- Finansallar
    sale_price DECIMAL(15, 2) NOT NULL,
    currency TEXT DEFAULT 'TRY',
    commission_rate DECIMAL(5, 2),                       -- Toplam hizmet bedeli %
    gross_commission DECIMAL(15, 2),                     -- GCI (Brüt Komisyon Geliri)
    
    -- Bölüşüm
    office_share DECIMAL(15, 2),
    listing_agent_share DECIMAL(15, 2),
    buyer_agent_share DECIMAL(15, 2),
    
    -- Durum
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    
    transaction_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tenant Webhook Entegrasyonları
CREATE TABLE IF NOT EXISTS public.tenant_webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    event_type TEXT NOT NULL,         -- 'new_lead', 'portfolio_created', 'sale_completed', etc.
    target_url TEXT NOT NULL,          -- Make.com / Zapier webhook URL
    is_active BOOLEAN DEFAULT true,
    headers JSONB DEFAULT '{}',       -- Ek HTTP başlıkları (Auth token vb.)
    
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    last_status_code INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tenant Entegrasyon Ayarları (SMS, API Keys vb.)
CREATE TABLE IF NOT EXISTS public.tenant_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    integration_type TEXT NOT NULL,       -- 'sms', 'email', 'whatsapp', 'ai'
    provider TEXT NOT NULL,               -- 'netgsm', 'iletimerkezi', 'twilio', 'openai', 'gemini'
    
    config JSONB NOT NULL DEFAULT '{}',   -- { "api_key": "xxx", "sender_id": "NOVO" } (şifreli tutulacak)
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tenant_id, integration_type, provider)
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_portfolios_tenant ON public.portfolios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_agent ON public.portfolios(agent_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_status ON public.portfolios(status);
CREATE INDEX IF NOT EXISTS idx_portfolios_city_district ON public.portfolios(city, district);
CREATE INDEX IF NOT EXISTS idx_agent_transactions_tenant ON public.agent_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_webhooks_tenant ON public.tenant_webhooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_integrations_tenant ON public.tenant_integrations(tenant_id);

-- RLS Politikaları
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_commission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_integrations ENABLE ROW LEVEL SECURITY;

-- Portfolios: Aynı tenant'taki kullanıcılar görebilir
CREATE POLICY "portfolio_tenant_select" ON public.portfolios
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "portfolio_tenant_insert" ON public.portfolios
    FOR INSERT WITH CHECK (
        tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "portfolio_tenant_update" ON public.portfolios
    FOR UPDATE USING (
        tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "portfolio_tenant_delete" ON public.portfolios
    FOR DELETE USING (
        tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
            AND role IN ('manager', 'admin', 'owner'))
    );

-- Portfolio Images: Portfolioya erişebilen herkes görselleri de görebilir
CREATE POLICY "portfolio_images_select" ON public.portfolio_images
    FOR SELECT USING (
        portfolio_id IN (
            SELECT id FROM public.portfolios 
            WHERE tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY "portfolio_images_insert" ON public.portfolio_images
    FOR INSERT WITH CHECK (
        portfolio_id IN (
            SELECT id FROM public.portfolios 
            WHERE tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
        )
    );

-- Diğer tablolar için basit tenant bazlı RLS
CREATE POLICY "lead_routing_tenant" ON public.lead_routing_rules
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "broker_commission_tenant" ON public.broker_commission_settings
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "agent_transactions_tenant" ON public.agent_transactions
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "tenant_webhooks_policy" ON public.tenant_webhooks
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
            AND role IN ('admin', 'owner'))
    );

CREATE POLICY "tenant_integrations_policy" ON public.tenant_integrations
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
            AND role IN ('admin', 'owner'))
    );
