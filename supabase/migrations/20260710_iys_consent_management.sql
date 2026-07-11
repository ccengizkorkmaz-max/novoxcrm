-- ============================================================
-- IYS & Consent Management Database Migration (Scrum Specs)
-- ============================================================

-- 1. Tenants tablosuna IYS sağlayıcı ayarları
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS iys_provider TEXT DEFAULT 'none';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS iys_config JSONB DEFAULT '{}'::jsonb;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS iys_sync_enabled BOOLEAN DEFAULT false;

-- 2. Customers (Kişiler) tablosuna standart izin alanlarının eklenmesi
ALTER TABLE customers ADD COLUMN IF NOT EXISTS sms_consent TEXT DEFAULT 'yes' CHECK (sms_consent IN ('yes', 'no', 'unknown'));
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_consent TEXT DEFAULT 'yes' CHECK (email_consent IN ('yes', 'no', 'unknown'));
ALTER TABLE customers ADD COLUMN IF NOT EXISTS call_consent TEXT DEFAULT 'yes' CHECK (call_consent IN ('yes', 'no', 'unknown'));

ALTER TABLE customers ADD COLUMN IF NOT EXISTS sms_last_updated_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_last_updated_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS call_last_updated_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE customers ADD COLUMN IF NOT EXISTS iys_sync_status TEXT DEFAULT 'pending';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS iys_last_synced_at TIMESTAMPTZ DEFAULT NULL;

-- Leads tablosuna da aynısını ekle
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sms_consent TEXT DEFAULT 'yes' CHECK (sms_consent IN ('yes', 'no', 'unknown'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_consent TEXT DEFAULT 'yes' CHECK (email_consent IN ('yes', 'no', 'unknown'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS call_consent TEXT DEFAULT 'yes' CHECK (call_consent IN ('yes', 'no', 'unknown'));

ALTER TABLE leads ADD COLUMN IF NOT EXISTS sms_last_updated_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_last_updated_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS call_last_updated_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS iys_sync_status TEXT DEFAULT 'pending';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS iys_last_synced_at TIMESTAMPTZ DEFAULT NULL;

-- Mevcut iletişim engelli müşterileri yeni sisteme "no" olarak aktar
UPDATE customers 
SET sms_consent = 'no', email_consent = 'no', call_consent = 'no' 
WHERE communication_enabled = false;

-- 3. İletişim Bilgisi (customer_communication_infos) tablosu
CREATE TABLE IF NOT EXISTS customer_communication_infos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('gsm', 'email')),
    value TEXT NOT NULL,
    sms_consent TEXT DEFAULT 'unknown' CHECK (sms_consent IN ('yes', 'no', 'unknown')),
    email_consent TEXT DEFAULT 'unknown' CHECK (email_consent IN ('yes', 'no', 'unknown')),
    call_consent TEXT DEFAULT 'unknown' CHECK (call_consent IN ('yes', 'no', 'unknown')),
    sms_last_updated_at TIMESTAMPTZ DEFAULT NULL,
    email_last_updated_at TIMESTAMPTZ DEFAULT NULL,
    call_last_updated_at TIMESTAMPTZ DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    status_detail TEXT NOT NULL DEFAULT 'active',
    owner_id UUID, -- Satış temsilcisi
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS & Indexes for customer_communication_infos
ALTER TABLE customer_communication_infos ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_cust_comm_infos_lookup ON customer_communication_infos(tenant_id, value, status);
CREATE INDEX IF NOT EXISTS idx_cust_comm_infos_customer ON customer_communication_infos(customer_id);

-- 4. İletişim İzin Log Kaydı (communication_consent_logs) tablosu
CREATE TABLE IF NOT EXISTS communication_consent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    communication_info_id UUID REFERENCES customer_communication_infos(id) ON DELETE SET NULL,
    value TEXT NOT NULL,
    consent_type TEXT NOT NULL CHECK (consent_type IN ('sms', 'email', 'call')),
    consent_status TEXT NOT NULL CHECK (consent_status IN ('yes', 'no', 'unknown')),
    consent_date TIMESTAMPTZ NOT NULL,
    owner_id UUID,
    processed_to_oikos BOOLEAN DEFAULT false,
    not_processed_reason TEXT DEFAULT NULL,
    consent_source TEXT NOT NULL CHECK (consent_source IN ('integrator', 'iys')),
    transfer_target TEXT NOT NULL CHECK (transfer_target IN ('crm', 'integrator')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    status_detail TEXT NOT NULL DEFAULT 'ready_to_process' CHECK (status_detail IN ('draft', 'pending_verification', 'ready_to_send', 'ready_to_process', 'sent', 'processed', 'error', 'cancelled')),
    raw_log TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS & Indexes for communication_consent_logs
ALTER TABLE communication_consent_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_consent_logs_tenant ON communication_consent_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_sync ON communication_consent_logs(transfer_target, status, status_detail);

-- RLS Policies
CREATE POLICY "Tenant isolation for customer_communication_infos" ON customer_communication_infos
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant isolation for communication_consent_logs" ON communication_consent_logs
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_communication_infos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_communication_infos TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communication_consent_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communication_consent_logs TO service_role;

-- ============================================================
-- DB TRIGGERS (Lifecycle & Processing Automation)
-- ============================================================

-- A. Before Customer Insert/Update (Reset consent on phone/email change)
CREATE OR REPLACE FUNCTION fn_before_customer_consent_reset()
RETURNS TRIGGER AS $$
BEGIN
    -- GSM/Phone Değişikliği
    IF (TG_OP = 'INSERT' AND NEW.phone IS NOT NULL AND NEW.phone <> '') OR 
       (TG_OP = 'UPDATE' AND (OLD.phone IS NULL OR NEW.phone <> OLD.phone) AND NEW.phone IS NOT NULL AND NEW.phone <> '') THEN
        NEW.sms_consent := 'unknown';
        NEW.call_consent := 'unknown';
        NEW.sms_last_updated_at := NULL;
        NEW.call_last_updated_at := NULL;
    END IF;

    -- E-Posta Değişikliği
    IF (TG_OP = 'INSERT' AND NEW.email IS NOT NULL AND NEW.email <> '') OR 
       (TG_OP = 'UPDATE' AND (OLD.email IS NULL OR NEW.email <> OLD.email) AND NEW.email IS NOT NULL AND NEW.email <> '') THEN
        NEW.email_consent := 'unknown';
        NEW.email_last_updated_at := NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_before_customer_consent_reset ON customers;
CREATE TRIGGER trg_before_customer_consent_reset
    BEFORE INSERT OR UPDATE OF phone, email ON customers
    FOR EACH ROW
    EXECUTE FUNCTION fn_before_customer_consent_reset();


-- B. After Customer Insert/Update (Manage customer_communication_infos lifecycle)
CREATE OR REPLACE FUNCTION fn_after_customer_communication_lifecycle()
RETURNS TRIGGER AS $$
DECLARE
    v_sales_rep UUID;
BEGIN
    -- Kişi kaydının Satış Temsilcisi (assigned_to veya created_by)
    v_sales_rep := COALESCE(NEW.assigned_to, NEW.created_by);

    -- GSM/Phone Değişikliği
    IF TG_OP = 'INSERT' OR OLD.phone IS NULL OR NEW.phone <> OLD.phone THEN
        -- Eski aktif GSM kayıtlarını pasif yap
        UPDATE customer_communication_infos 
        SET status = 'inactive', status_detail = 'inactive', updated_at = now()
        WHERE customer_id = NEW.id AND type = 'gsm' AND status = 'active';

        -- Yeni GSM formatı uygunsa yeni kayıt aç
        IF NEW.phone IS NOT NULL AND NEW.phone <> '' THEN
            INSERT INTO customer_communication_infos (
                tenant_id, customer_id, type, value, 
                sms_consent, call_consent, 
                sms_last_updated_at, call_last_updated_at,
                status, status_detail, owner_id, created_by, updated_by
            ) VALUES (
                NEW.tenant_id, NEW.id, 'gsm', NEW.phone,
                'unknown', 'unknown',
                NULL, NULL,
                'active', 'active', v_sales_rep, v_sales_rep, v_sales_rep
            );
        END IF;
    END IF;

    -- E-Posta Değişikliği
    IF TG_OP = 'INSERT' OR OLD.email IS NULL OR NEW.email <> OLD.email THEN
        -- Eski aktif E-Posta kayıtlarını pasif yap
        UPDATE customer_communication_infos 
        SET status = 'inactive', status_detail = 'inactive', updated_at = now()
        WHERE customer_id = NEW.id AND type = 'email' AND status = 'active';

        -- Yeni E-Posta formatı uygunsa yeni kayıt aç
        IF NEW.email IS NOT NULL AND NEW.email <> '' THEN
            INSERT INTO customer_communication_infos (
                tenant_id, customer_id, type, value, 
                email_consent, email_last_updated_at,
                status, status_detail, owner_id, created_by, updated_by
            ) VALUES (
                NEW.tenant_id, NEW.id, 'email', NEW.email,
                'unknown', NULL,
                'active', 'active', v_sales_rep, v_sales_rep, v_sales_rep
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_after_customer_communication_lifecycle ON customers;
CREATE TRIGGER trg_after_customer_communication_lifecycle
    AFTER INSERT OR UPDATE OF phone, email ON customers
    FOR EACH ROW
    EXECUTE FUNCTION fn_after_customer_communication_lifecycle();


-- C. Before Consent Log Insert/Update (Process Inbound updates automatically)
CREATE OR REPLACE FUNCTION fn_before_process_consent_log()
RETURNS TRIGGER AS $$
DECLARE
    v_info RECORD;
    v_customer RECORD;
    v_last_updated TIMESTAMPTZ;
    v_is_newer BOOLEAN := false;
BEGIN
    -- Sadece transfer_target = 'crm' ve status_detail = 'ready_to_process' olan kayıtları işle
    IF NEW.transfer_target = 'crm' AND NEW.status_detail = 'ready_to_process' THEN
        -- Eşleşen aktif iletişim bilgisi kaydını bul
        SELECT * INTO v_info 
        FROM customer_communication_infos 
        WHERE tenant_id = NEW.tenant_id AND value = NEW.value AND status = 'active'
        LIMIT 1;

        IF v_info.id IS NOT NULL THEN
            NEW.communication_info_id := v_info.id;
            NEW.customer_id := v_info.customer_id;

            -- Müşteri (Kişi) kaydını al
            SELECT * INTO v_customer FROM customers WHERE id = v_info.customer_id;

            -- İzin Tipine göre son güncelleme tarihini al
            IF NEW.consent_type = 'sms' THEN
                v_last_updated := v_info.sms_last_updated_at;
            ELSIF NEW.consent_type = 'call' THEN
                v_last_updated := v_info.call_last_updated_at;
            ELSIF NEW.consent_type = 'email' THEN
                v_last_updated := v_info.email_last_updated_at;
            END IF;

            -- Tarih karşılaştırması
            IF v_last_updated IS NULL OR NEW.consent_date > v_last_updated THEN
                v_is_newer := true;
            END IF;

            -- Eğer gelen bilgi daha güncelse güncelleme yap
            IF v_is_newer THEN
                -- İletişim Bilgisi Güncellemesi
                IF NEW.consent_type = 'sms' THEN
                    UPDATE customer_communication_infos 
                    SET sms_consent = NEW.consent_status, sms_last_updated_at = NEW.consent_date, updated_at = now()
                    WHERE id = v_info.id;
                    
                    UPDATE customers 
                    SET sms_consent = NEW.consent_status, sms_last_updated_at = NEW.consent_date, 
                        iys_sync_status = 'synced', iys_last_synced_at = now(), updated_at = now()
                    WHERE id = v_customer.id;

                ELSIF NEW.consent_type = 'call' THEN
                    UPDATE customer_communication_infos 
                    SET call_consent = NEW.consent_status, call_last_updated_at = NEW.consent_date, updated_at = now()
                    WHERE id = v_info.id;

                    UPDATE customers 
                    SET call_consent = NEW.consent_status, call_last_updated_at = NEW.consent_date, 
                        iys_sync_status = 'synced', iys_last_synced_at = now(), updated_at = now()
                    WHERE id = v_customer.id;

                ELSIF NEW.consent_type = 'email' THEN
                    UPDATE customer_communication_infos 
                    SET email_consent = NEW.consent_status, email_last_updated_at = NEW.consent_date, updated_at = now()
                    WHERE id = v_info.id;

                    UPDATE customers 
                    SET email_consent = NEW.consent_status, email_last_updated_at = NEW.consent_date, 
                        iys_sync_status = 'synced', iys_last_synced_at = now(), updated_at = now()
                    WHERE id = v_customer.id;
                END IF;

                -- Log alanlarını güncelle
                NEW.processed_to_oikos := true;
                NEW.status_detail := 'processed';
            ELSE
                -- Daha güncel bir izin bilgisi varsa güncelleme yapma
                NEW.processed_to_oikos := true;
                NEW.status_detail := 'processed';
                NEW.not_processed_reason := 'Daha güncel bir izin bilgisi olduğundan herhangi bir güncelleme yapılmamıştır';
            END IF;
        ELSE
            -- Eşleşen aktif iletişim bilgisi bulunamazsa
            NEW.processed_to_oikos := false;
            NEW.status_detail := 'error';
            NEW.not_processed_reason := 'Eşleşen aktif bir iletişim bilgisi kaydı bulunamadı';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_before_process_consent_log ON communication_consent_logs;
CREATE TRIGGER trg_before_process_consent_log
    BEFORE INSERT OR UPDATE OF status_detail ON communication_consent_logs
    FOR EACH ROW
    EXECUTE FUNCTION fn_before_process_consent_log();


-- D. After Customer Update (Process manual consent changes and create outbound sync logs)
CREATE OR REPLACE FUNCTION fn_after_customer_consent_change()
RETURNS TRIGGER AS $$
DECLARE
    v_info_id UUID;
BEGIN
    -- Eğer güncelleme zaten IYS senkronizasyonundan (Trigger C) geldiyse işlem yapma (loop engelleme)
    IF NEW.iys_sync_status = 'synced' THEN
        RETURN NEW;
    END IF;

    -- SMS İzni Değişikliği
    IF NEW.sms_consent IS DISTINCT FROM OLD.sms_consent AND NEW.sms_consent <> 'unknown' THEN
        SELECT id INTO v_info_id FROM customer_communication_infos 
        WHERE customer_id = NEW.id AND type = 'gsm' AND status = 'active' LIMIT 1;

        INSERT INTO communication_consent_logs (
            tenant_id, customer_id, communication_info_id, value,
            consent_type, consent_status, consent_date,
            consent_source, transfer_target, status_detail
        ) VALUES (
            NEW.tenant_id, NEW.id, v_info_id, NEW.phone,
            'sms', NEW.sms_consent, now(),
            'integrator', 'integrator', 'ready_to_send'
        );

        IF v_info_id IS NOT NULL THEN
            UPDATE customer_communication_infos 
            SET sms_consent = NEW.sms_consent, sms_last_updated_at = now()
            WHERE id = v_info_id;
        END IF;
    END IF;

    -- Arama İzni Değişikliği
    IF NEW.call_consent IS DISTINCT FROM OLD.call_consent AND NEW.call_consent <> 'unknown' THEN
        SELECT id INTO v_info_id FROM customer_communication_infos 
        WHERE customer_id = NEW.id AND type = 'gsm' AND status = 'active' LIMIT 1;

        INSERT INTO communication_consent_logs (
            tenant_id, customer_id, communication_info_id, value,
            consent_type, consent_status, consent_date,
            consent_source, transfer_target, status_detail
        ) VALUES (
            NEW.tenant_id, NEW.id, v_info_id, NEW.phone,
            'call', NEW.call_consent, now(),
            'integrator', 'integrator', 'ready_to_send'
        );

        IF v_info_id IS NOT NULL THEN
            UPDATE customer_communication_infos 
            SET call_consent = NEW.call_consent, call_last_updated_at = now()
            WHERE id = v_info_id;
        END IF;
    END IF;

    -- E-Posta İzni Değişikliği
    IF NEW.email_consent IS DISTINCT FROM OLD.email_consent AND NEW.email_consent <> 'unknown' THEN
        SELECT id INTO v_info_id FROM customer_communication_infos 
        WHERE customer_id = NEW.id AND type = 'email' AND status = 'active' LIMIT 1;

        INSERT INTO communication_consent_logs (
            tenant_id, customer_id, communication_info_id, value,
            consent_type, consent_status, consent_date,
            consent_source, transfer_target, status_detail
        ) VALUES (
            NEW.tenant_id, NEW.id, v_info_id, NEW.email,
            'email', NEW.email_consent, now(),
            'integrator', 'integrator', 'ready_to_send'
        );

        IF v_info_id IS NOT NULL THEN
            UPDATE customer_communication_infos 
            SET email_consent = NEW.email_consent, email_last_updated_at = now()
            WHERE id = v_info_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_after_customer_consent_change ON customers;
CREATE TRIGGER trg_after_customer_consent_change
    AFTER UPDATE OF sms_consent, email_consent, call_consent ON customers
    FOR EACH ROW
    EXECUTE FUNCTION fn_after_customer_consent_change();
