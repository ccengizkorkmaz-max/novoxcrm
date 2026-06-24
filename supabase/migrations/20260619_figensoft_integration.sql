-- =============================================
-- Figensoft (Posta Güvercini + TİKo) Entegrasyonu
-- SMS, E-Posta, OTP, Ödeme altyapısı
-- =============================================

-- 1. Tenants tablosuna Figensoft credentials
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS figensoft_username TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS figensoft_password TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS figensoft_sender_id TEXT DEFAULT 'NOVO INSAAT';

-- 2. SMS Log tablosu
CREATE TABLE IF NOT EXISTS sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    sender_id TEXT,
    message_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    channel TEXT NOT NULL DEFAULT 'sms',
    cost NUMERIC(10,4),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    delivered_at TIMESTAMPTZ
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_sms_logs_tenant ON sms_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_customer ON sms_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_message_id ON sms_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs(created_at DESC);

-- 3. OTP Kodları tablosu (geçici kodlar)
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_lookup ON otp_codes(tenant_id, phone);

-- 4. Süresi dolmuş OTP kodlarını otomatik temizle (opsiyonel cron)
-- Bu, pg_cron extension'ı ile çalıştırılabilir:
-- SELECT cron.schedule('clean-otp-codes', '*/5 * * * *', 'DELETE FROM otp_codes WHERE expires_at < now()');

-- 5. RLS Policies
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- SMS Logs: Authenticated users kendi tenant'larını görebilir
CREATE POLICY "sms_logs_tenant_isolation" ON sms_logs
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

-- OTP Codes: Sadece service_role erişebilir (createAdminClient kullanıyoruz)
CREATE POLICY "otp_codes_service_only" ON otp_codes
    FOR ALL
    USING (false); -- Normal kullanıcılar erişemez, sadece admin client
