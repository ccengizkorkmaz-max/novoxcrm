-- ==========================================
-- 🛡️ NOVO-CRM KESİN ÇÖZÜM: RECURSION (DÖNGÜ) KIRICI V2
-- ==========================================

-- 1. Güvenlik Temizliği (RLS Geçici Kapalı)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;

-- Mevcut tüm politikaları isim bağımsız temizleyelim
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('profiles', 'tenants'))
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END
$$;

-- 2. DÖNGÜYÜ KIRAN ÖZEL FONKSİYONLAR (Security Definer)
-- ÖNEMLİ: Bu fonksiyonlar 'SECURITY DEFINER' olduğu için RLS kurallarını baypas eder.
-- Politikalar içinde asla doğrudan tablo sorgusu (subquery) yapmıyoruz, bu fonksiyonları kullanıyoruz.

-- [Fonksiyon 1] Mevcut kullanıcının tenant_id'sini döner
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS uuid AS $$
BEGIN
  RETURN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- [Fonksiyon 2] Mevcut kullanıcının admin olup olmadığını döner
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'manager', 'owner')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. YENİ VE STABİL RLS POLİTİKALARI (Döngüsüz)

-- [PROFILES]
-- Şirket üyelerini görme kuralı
CREATE POLICY "p_select" ON public.profiles FOR SELECT USING (
  id = auth.uid() OR tenant_id = public.get_my_tenant_id()
);

-- Admin işlemleri
CREATE POLICY "p_all_admin" ON public.profiles FOR ALL USING (
  public.is_admin()
);

-- [TENANTS]
-- Şirketini görme (Döngüyü kırmak için en güvenli direkt kural)
CREATE POLICY "t_select" ON public.tenants FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND tenant_id = public.tenants.id)
);

-- Şirket bilgilerini güncelleme (Sadece Admin/Owner)
CREATE POLICY "t_update_admin" ON public.tenants FOR UPDATE USING (
  public.is_admin()
);

-- 4. VERİ BİRLİĞİ (FORCE MERGE)
-- Tüm kullanıcıları 'ccengizkorkmaz@gmail.com' ana hesabı altında toplar.
DO $$
DECLARE
    main_tenant_id uuid;
BEGIN
    -- Ana kullanıcıyı bul ve onun şirketini 'ana şirket' yap
    SELECT tenant_id INTO main_tenant_id FROM public.profiles 
    WHERE id = (SELECT id FROM auth.users WHERE email = 'ccengizkorkmaz@gmail.com' LIMIT 1);

    IF main_tenant_id IS NULL THEN SELECT id INTO main_tenant_id FROM public.tenants LIMIT 1; END IF;

    -- Şirket yoksa oluştur
    IF main_tenant_id IS NULL THEN INSERT INTO public.tenants (name) VALUES ('NovoCRM Ana Şirket') RETURNING id INTO main_tenant_id; END IF;

    -- Tüm profilleri güncelle
    UPDATE public.profiles p
    SET 
        tenant_id = main_tenant_id,
        email = u.email,
        role = CASE WHEN u.email = 'ccengizkorkmaz@gmail.com' THEN 'owner' ELSE COALESCE(p.role, 'user') END
    FROM auth.users u WHERE p.id = u.id;

    -- Temizlik
    DELETE FROM public.tenants WHERE id != main_tenant_id;
END;
$$;

-- 5. RLS AKTİF
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 6. GELECEK KAYITLAR İÇİN TETİKLEYİCİ
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_tid uuid;
BEGIN
  v_tid := (new.raw_user_meta_data->>'tenant_id')::uuid;
  IF v_tid IS NULL THEN SELECT id INTO v_tid FROM public.tenants LIMIT 1; END IF;

  INSERT INTO public.profiles (id, tenant_id, full_name, role, email)
  VALUES (new.id, v_tid, COALESCE(new.raw_user_meta_data->>'full_name', new.email), 'user', new.email);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
